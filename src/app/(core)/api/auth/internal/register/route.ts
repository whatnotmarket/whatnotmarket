import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { signInBridgeUserOnRoute } from "@/lib/domains/auth/bridge";
import { getRedirectPath } from "@/lib/app/seo/redirects";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { generateInternalAuthEmail } from "@/lib/domains/internal-auth/identity";
import {
  onboardingRegistrationSchema,
  type OnboardingRegistrationInput,
} from "@/lib/domains/internal-auth/schemas";
import { hashInternalPassword, encryptRecoveryPhrase } from "@/lib/domains/internal-auth/security";
import {
  createInternalIdentitySession,
  setInternalSessionCookie,
} from "@/lib/domains/internal-auth/sessions";
import { verifyOnboardingSessionProof } from "@/lib/domains/internal-auth/onboarding-session";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/domains/security/abuse-guards";
import { enforceAuthAbuseMiddleware } from "@/lib/domains/trust/middleware/auth-abuse";

type RegisterResponse = {
  ok: boolean;
  identityUsername?: string;
  redirectTo?: string;
  error?: string;
};

type CreatedAuthUser = {
  id: string;
  authEmail: string;
};

const MAX_AUTH_EMAIL_ATTEMPTS = 12;

function isDuplicateErrorMessage(message: string | undefined) {
  const normalized = String(message || "").toLowerCase();
  return (
    normalized.includes("already") ||
    normalized.includes("exists") ||
    normalized.includes("duplicate") ||
    normalized.includes("unique")
  );
}

async function isUsernameUnavailable(username: string) {
  const admin = createAdminClient();

  const [identityResult, profileResult] = await Promise.all([
    admin.from("internal_identities").select("id").eq("username", username).maybeSingle<{ id: string }>(),
    admin.from("profiles").select("id").eq("username", username).maybeSingle<{ id: string }>(),
  ]);

  if (identityResult.error || profileResult.error) {
    throw new Error("Unable to verify username availability.");
  }

  return Boolean(identityResult.data || profileResult.data);
}

async function createAuthUserWithIdentity(
  admin: ReturnType<typeof createAdminClient>,
  payload: OnboardingRegistrationInput
): Promise<CreatedAuthUser> {
  for (let attempt = 0; attempt < MAX_AUTH_EMAIL_ATTEMPTS; attempt += 1) {
    const authEmail = generateInternalAuthEmail(payload.username);
    const isSellerIntent = payload.userIntent === "sell" || payload.userIntent === "both";

    const { data, error } = await admin.auth.admin.createUser({
      email: authEmail,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.username,
        role_preference: isSellerIntent ? "seller" : "buyer",
      },
    });

    if (error) {
      if (isDuplicateErrorMessage(error.message)) {
        continue;
      }

      throw new Error(`Unable to create auth user: ${error.message}`);
    }

    const userId = data.user?.id;
    if (!userId) {
      throw new Error("Auth user creation did not return a user id.");
    }

    return {
      id: userId,
      authEmail,
    };
  }

  throw new Error("Unable to create internal digital identity.");
}

async function cleanupAuthUser(userId: string | null) {
  if (!userId) return;

  try {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(userId);
  } catch (error) {
    console.error("[internal-auth] cleanup failed", error);
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimitDetailed(request, { action: "internal_onboarding_register" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const abuseGuard = await enforceAbuseGuard({
    request,
    action: "internal_onboarding_register",
    endpointGroup: "auth",
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  const authAbuse = await enforceAuthAbuseMiddleware({
    request,
    action: "signup",
  });

  if (!authAbuse.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many suspicious signup attempts. Please try again shortly.",
      } satisfies RegisterResponse,
      {
        status: 429,
        headers: {
          "Retry-After": String(authAbuse.retryAfterSeconds || 120),
        },
      }
    );
  }

  if (authAbuse.requiresChallenge) {
    return NextResponse.json(
      {
        ok: false,
        error: "Additional verification is required before creating this account.",
      } satisfies RegisterResponse,
      { status: 403 }
    );
  }

  const parsed = onboardingRegistrationSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid onboarding payload.",
      } satisfies RegisterResponse,
      { status: 400 }
    );
  }

  const payload = parsed.data;
  if (!payload.onboardingSessionId || !payload.onboardingSessionToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing onboarding session.",
      } satisfies RegisterResponse,
      { status: 400 }
    );
  }

  const validSessionProof = verifyOnboardingSessionProof({
    sessionId: payload.onboardingSessionId,
    token: payload.onboardingSessionToken,
  });
  if (!validSessionProof) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid onboarding session.",
      } satisfies RegisterResponse,
      { status: 403 }
    );
  }

  if (!/^[a-z0-9_-]{3,24}$/.test(payload.username)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid username format.",
      } satisfies RegisterResponse,
      { status: 400 }
    );
  }

  try {
    const usernameTaken = await isUsernameUnavailable(payload.username);
    if (usernameTaken) {
      return NextResponse.json(
        {
          ok: false,
          error: "Username is already taken.",
        } satisfies RegisterResponse,
        { status: 409 }
      );
    }

    const passwordHash = await hashInternalPassword(payload.password);
    const encryptedRecovery = encryptRecoveryPhrase(payload.recoveryPhrase);
    const isSellerIntent = payload.userIntent === "sell" || payload.userIntent === "both";

    const admin = createAdminClient();

    let createdUser: CreatedAuthUser | null = null;

    try {
      createdUser = await createAuthUserWithIdentity(admin, payload);

      const { error: profileError } = await admin.from("profiles").upsert(
        {
          id: createdUser.id,
          username: payload.username,
          full_name: payload.username,
          email: null,
          role_preference: isSellerIntent ? "seller" : "buyer",
          onboarding_status: "completed",
          bio: payload.bio,
          twitter_handle: isSellerIntent ? payload.xHandle : null,
          avatar_url: payload.avatarUrl,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        throw new Error(`Unable to save profile details: ${profileError.message}`);
      }

      const { data: identity, error: identityError } = await admin
        .from("internal_identities")
        .insert({
          auth_user_id: createdUser.id,
          username: payload.username,
          password_hash: passwordHash,
          encrypted_recovery: encryptedRecovery.encryptedRecovery,
          recovery_iv: encryptedRecovery.recoveryIv,
          recovery_salt: encryptedRecovery.recoverySalt,
          discovery_source: payload.discoverySource,
          user_intent: payload.userIntent,
          seller_category: payload.sellerCategory,
          buyer_interest: payload.buyerInterest,
          seller_name: payload.sellerName,
          reviews_channel: payload.reviewsChannel,
          escrow_experience: payload.escrowExperience,
          seller_notes: payload.sellerNotes,
          bio: payload.bio,
          avatar_url: payload.avatarUrl,
          is_seller: isSellerIntent,
          x_handle: isSellerIntent ? payload.xHandle : null,
          access_method: payload.accessMethod || "recovery_phrase",
        })
        .select("id")
        .single<{ id: string }>();

      if (identityError || !identity?.id) {
        if (identityError?.code === "23505") {
          throw new Error("Username already exists.");
        }

        throw new Error(identityError?.message || "Unable to create internal digital identity.");
      }

      const response = NextResponse.json({
        ok: true,
        identityUsername: payload.username,
        redirectTo: getRedirectPath(payload.next),
      } satisfies RegisterResponse);

      const internalSession = await createInternalIdentitySession(identity.id);
      setInternalSessionCookie(response, internalSession.token, internalSession.expiresAt);

      if (payload.onboardingSessionId) {
        await admin
          .from("onboarding_leads")
          .update({
            completed_identity: true,
            selected_access_method: payload.accessMethod || "recovery_phrase",
            internal_identity_id: identity.id,
            updated_at: new Date().toISOString(),
          })
          .eq("session_id", payload.onboardingSessionId);
      }

      await signInBridgeUserOnRoute({
        request,
        response,
        email: createdUser.authEmail,
        password: payload.password,
      });

      return response;
    } catch (error) {
      if (createdUser?.id) {
        await cleanupAuthUser(createdUser.id);
      }

      const message = error instanceof Error ? error.message : "Unable to create account.";
      const status =
        message.includes("already") || message.includes("exists") || message.includes("Username")
          ? 409
          : 500;

      return NextResponse.json(
        {
          ok: false,
          error:
            status === 409
              ? message
              : process.env.NODE_ENV === "production"
                ? "Unable to create account right now."
                : `Unable to create account right now. ${message}`,
        } satisfies RegisterResponse,
        { status }
      );
    }
  } catch (error) {
    console.error("[internal-auth] register failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to complete onboarding.",
      } satisfies RegisterResponse,
      { status: 500 }
    );
  }
}

