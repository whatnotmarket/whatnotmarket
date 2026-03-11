import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyRoleAssignmentForUser } from "@/lib/auth/role-assignment";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  BridgeIdentityNotFoundError,
  ensureBridgeUser,
  signInBridgeUserOnRoute,
} from "@/lib/auth/bridge";
import { verifyWalletChallengeSignature } from "@/lib/auth/external-wallet";
import { resolveRequiredInviteCode } from "@/lib/invite-codes";
import { shouldAllowBridgeUserCreation } from "@/lib/security/auth-guards";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";
import { detectBanEvasionRisk, recordAuthSecurityEvent } from "@/lib/trust/services/auth-security";
import { getTrustAccountState, upsertTrustAccountState } from "@/lib/trust/services/trust-store";
import { enforceAuthAbuseMiddleware } from "@/lib/trust/middleware/auth-abuse";

type Payload = {
  signature?: string;
};

type WalletAuthTx = {
  nonce: string;
  address: string;
  chain: string;
  mode: "signin" | "signup";
  desiredRole: "buyer" | "seller";
  inviteCode: string | null;
  nextPath: string;
  provider: "walletconnect" | "metamask" | "trustwallet" | "google" | "apple" | "wallet";
  displayName: string | null;
};

function normalizeProvider(raw: string | undefined): WalletAuthTx["provider"] {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();

  if (value === "metamask") return "metamask";
  if (value === "trustwallet" || value === "trust") return "trustwallet";
  if (value === "google") return "google";
  if (value === "apple") return "apple";
  if (value === "walletconnect") return "walletconnect";
  return "wallet";
}

function parseTx(raw: string | undefined): WalletAuthTx | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<WalletAuthTx>;
    if (!parsed.nonce || !parsed.address || !parsed.chain || !parsed.nextPath) {
      return null;
    }

    return {
      nonce: parsed.nonce,
      address: parsed.address,
      chain: parsed.chain,
      mode: parsed.mode === "signup" ? "signup" : "signin",
      desiredRole: parsed.desiredRole === "seller" ? "seller" : "buyer",
      inviteCode: parsed.inviteCode ?? null,
      nextPath: parsed.nextPath,
      provider: normalizeProvider(parsed.provider),
      displayName:
        typeof parsed.displayName === "string" && parsed.displayName.trim()
          ? parsed.displayName.trim().slice(0, 80)
          : null,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimitDetailed(request, { action: "auth_wallet_verify" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const abuseGuard = await enforceAbuseGuard({
    request,
    action: "auth_wallet_verify",
    endpointGroup: "auth",
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  const body = (await request.json().catch(() => ({}))) as Payload;
  const signature = String(body.signature ?? "");
  const tx = parseTx(request.cookies.get("wm_wallet_auth_tx")?.value);

  if (!tx) {
    return NextResponse.json({ error: "Missing wallet auth transaction" }, { status: 400 });
  }

  const authAbuse = await enforceAuthAbuseMiddleware({
    request,
    action: tx.mode === "signup" ? "signup" : "signin",
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

  if (authAbuse.requiresChallenge && tx.mode === "signup") {
    return NextResponse.json(
      {
        error: "Verifica anti-abuso richiesta prima di completare la registrazione.",
        code: "AUTH_CHALLENGE_REQUIRED",
      },
      { status: 403 }
    );
  }

  const scopedLimit = checkRateLimitDetailed(request, {
    action: "auth_wallet_verify",
    identifier: `${tx.chain}:${tx.address.toLowerCase()}`,
  });
  if (!scopedLimit.allowed) {
    return RateLimitResponse(scopedLimit);
  }

  if (!signature) {
    return NextResponse.json({ error: "Signature is required" }, { status: 400 });
  }

  const isValidSignature = await verifyWalletChallengeSignature({
    address: tx.address,
    chain: tx.chain,
    nonce: tx.nonce,
    signature,
  });

  if (!isValidSignature) {
    return NextResponse.json({ error: "Wallet signature verification failed" }, { status: 401 });
  }

  const subject = `wallet:${tx.chain}:${tx.address.toLowerCase()}`;
  let desiredRole: "buyer" | "seller" = "buyer";
  let inviteCode: string | null = null;

  if (tx.mode === "signup") {
    const inviteResolution = await resolveRequiredInviteCode(tx.inviteCode, {
      allowedTypes: ["buyer", "seller"],
    });
    if (!inviteResolution.isValid) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }
    desiredRole = inviteResolution.role;
    inviteCode = inviteResolution.normalizedCode;
  }

  let bridgeIdentity;
  try {
    bridgeIdentity = await ensureBridgeUser(
      {
        subject,
        provider: tx.provider,
        email: null,
        fullName: tx.displayName || tx.address,
        avatarUrl: null,
      },
      {
        allowCreate: shouldAllowBridgeUserCreation(tx.mode),
      }
    );
  } catch (error) {
    if (error instanceof BridgeIdentityNotFoundError) {
      return NextResponse.json({ error: "Invalid authentication credentials" }, { status: 401 });
    }
    throw error;
  }

  let roleMessage: string | null = null;
  if (tx.mode === "signup") {
    const assignment = await applyRoleAssignmentForUser({
      userId: bridgeIdentity.userId,
      email: bridgeIdentity.email,
      desiredRole,
      inviteCode,
    });
    roleMessage = assignment.message;
  }

  await recordAuthSecurityEvent({
    request,
    userId: bridgeIdentity.userId,
    eventType: tx.mode === "signup" ? "auth_signup" : "auth_login",
  }).catch((error) => {
    console.error("Failed to record wallet auth security event", error);
  });

  const banEvasion = await detectBanEvasionRisk({
    request,
    userId: bridgeIdentity.userId,
  }).catch((error) => {
    console.error("Failed to evaluate wallet ban-evasion risk", error);
    return { suspicious: false, reasonCodes: [], requiresStepUp: false };
  });

  const trustState = await getTrustAccountState(bridgeIdentity.userId);
  await upsertTrustAccountState({
    ...trustState,
    userId: bridgeIdentity.userId,
    accountFlag: banEvasion.requiresStepUp
      ? "under_review"
      : tx.mode === "signup"
        ? "limited"
        : trustState.accountFlag,
    emailVerified: true,
    riskScore: banEvasion.requiresStepUp ? Math.max(trustState.riskScore, 70) : trustState.riskScore,
    riskLevel: banEvasion.requiresStepUp ? "high" : trustState.riskLevel,
    restrictions: {
      ...(trustState.restrictions || {}),
      stepUpVerificationRequired: banEvasion.requiresStepUp || trustState.restrictions?.stepUpVerificationRequired === true,
    },
    lastReasonCodes: banEvasion.reasonCodes.length > 0 ? banEvasion.reasonCodes : trustState.lastReasonCodes,
  }).catch((error) => {
    console.error("Failed to sync trust state after wallet auth", error);
  });

  const response = NextResponse.json({
    ok: true,
    redirectTo: tx.nextPath,
    roleMessage,
    securityNotice: banEvasion.requiresStepUp
      ? "Accesso consentito con restrizioni: verifica aggiuntiva richiesta."
      : null,
  });

  await signInBridgeUserOnRoute({
    request,
    response,
    email: bridgeIdentity.email,
    password: bridgeIdentity.password,
  });

  try {
    const admin = createAdminClient();
    await admin.from("wallets").upsert(
      {
        user_id: bridgeIdentity.userId,
        address: tx.address,
        chain: tx.chain,
        provider: tx.provider,
        verified_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,address,chain",
      }
    );
  } catch {
    // Wallet table might not be available before migrations are applied.
  }

  response.cookies.set("wm_wallet_auth_tx", "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
