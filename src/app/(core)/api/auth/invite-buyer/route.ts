import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ensureBridgeUser, signInBridgeUserOnRoute } from "@/lib/domains/auth/bridge";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { getRedirectPath } from "@/lib/app/seo/redirects";
import { registerInviteUsage, resolveRequiredInviteCode } from "@/lib/domains/auth/invite-codes";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/domains/security/abuse-guards";
import { isInviteCodeDirectLoginEnabled } from "@/lib/domains/security/auth-guards";
import { detectBanEvasionRisk, recordAuthSecurityEvent } from "@/lib/domains/trust/services/auth-security";
import { getTrustAccountState, upsertTrustAccountState } from "@/lib/domains/trust/services/trust-store";
import { enforceAuthAbuseMiddleware } from "@/lib/domains/trust/middleware/auth-abuse";

type Payload = {
  code?: string;
  next?: string;
};

export async function POST(request: NextRequest) {
  try {
    if (!isInviteCodeDirectLoginEnabled()) {
      return NextResponse.json({ error: "Invite code login is disabled" }, { status: 403 });
    }

    const rateLimit = checkRateLimitDetailed(request, { action: "invite_buyer_login" });
    if (!rateLimit.allowed) {
      return RateLimitResponse(rateLimit);
    }

    const abuseGuard = await enforceAbuseGuard({
      request,
      action: "invite_buyer_login",
      endpointGroup: "auth",
    });
    if (!abuseGuard.allowed) {
      return AbuseGuardResponse(abuseGuard);
    }

    const body = (await request.json().catch(() => ({}))) as Payload;
    const code = String(body.code || "")
      .trim()
      .toUpperCase();

    const authAbuse = await enforceAuthAbuseMiddleware({
      request,
      action: "signin",
    });
    if (!authAbuse.allowed) {
      return NextResponse.json(
        {
          error: "Troppi tentativi sospetti. Riprova tra poco.",
          code: "AUTH_ABUSE_BLOCKED",
          reasonCodes: authAbuse.reasonCodes,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(authAbuse.retryAfterSeconds || 120),
          },
        }
      );
    }

    const inviteResolution = await resolveRequiredInviteCode(code, {
      allowedTypes: ["buyer"],
    });

    if (!inviteResolution.isValid || !inviteResolution.normalizedCode) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 401 });
    }

    const normalizedCode = inviteResolution.normalizedCode;
    const email = `invite-buyer+${normalizedCode.toLowerCase()}@openlymarket.app`;

    const bridgeIdentity = await ensureBridgeUser({
      subject: `invite:buyer:${normalizedCode}`,
      provider: "walletconnect",
      email,
      fullName: "Invite Buyer",
      avatarUrl: null,
    });

    const admin = createAdminClient();
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: "Invite Buyer",
        role_preference: "buyer",
        onboarding_status: "completed",
        is_admin: false,
      })
      .eq("id", bridgeIdentity.userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return NextResponse.json(
        {
          error: `Unable to activate buyer profile: ${profileError.message}`,
        },
        { status: 500 }
      );
    }

    const redirectTo = getRedirectPath(body.next);
    const response = NextResponse.json({ ok: true, redirectTo });

    await signInBridgeUserOnRoute({
      request,
      response,
      email: bridgeIdentity.email,
      password: bridgeIdentity.password,
    });

    await recordAuthSecurityEvent({
      request,
      userId: bridgeIdentity.userId,
      eventType: "auth_login",
    }).catch((error) => {
      console.error("Failed to record invite buyer auth security event", error);
    });

    const banEvasion = await detectBanEvasionRisk({
      request,
      userId: bridgeIdentity.userId,
    }).catch((error) => {
      console.error("Failed to evaluate invite buyer ban-evasion risk", error);
      return { suspicious: false, reasonCodes: [], requiresStepUp: false };
    });

    const trustState = await getTrustAccountState(bridgeIdentity.userId);
    await upsertTrustAccountState({
      ...trustState,
      userId: bridgeIdentity.userId,
      accountFlag: banEvasion.requiresStepUp ? "under_review" : trustState.accountFlag,
      emailVerified: true,
      riskScore: banEvasion.requiresStepUp ? Math.max(trustState.riskScore, 70) : trustState.riskScore,
      riskLevel: banEvasion.requiresStepUp ? "high" : trustState.riskLevel,
      restrictions: {
        ...(trustState.restrictions || {}),
        stepUpVerificationRequired: banEvasion.requiresStepUp || trustState.restrictions?.stepUpVerificationRequired === true,
      },
      lastReasonCodes: banEvasion.reasonCodes.length > 0 ? banEvasion.reasonCodes : trustState.lastReasonCodes,
    }).catch((error) => {
      console.error("Failed to sync trust state after invite buyer auth", error);
    });

    await registerInviteUsage({
      code: normalizedCode,
      userId: bridgeIdentity.userId,
      email: bridgeIdentity.email,
      source: "invite_buyer_login",
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    });

    return response;
  } catch (error) {
    console.error("Invite buyer error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}


