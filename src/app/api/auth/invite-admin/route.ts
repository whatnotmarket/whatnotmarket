import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ensureBridgeUser, signInBridgeUserOnRoute } from "@/lib/auth/bridge";
import { createAdminClient } from "@/lib/supabase-admin";
import { getRedirectPath } from "@/lib/redirects";
import { registerInviteUsage, resolveRequiredInviteCode } from "@/lib/invite-codes";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";
import { isInviteCodeDirectLoginEnabled } from "@/lib/security/auth-guards";
import { detectBanEvasionRisk, recordAuthSecurityEvent } from "@/lib/trust/services/auth-security";
import { getTrustAccountState, upsertTrustAccountState } from "@/lib/trust/services/trust-store";
import { enforceAuthAbuseMiddleware } from "@/lib/trust/middleware/auth-abuse";

type Payload = {
  code?: string;
  next?: string;
};

export async function POST(request: NextRequest) {
  if (!isInviteCodeDirectLoginEnabled()) {
    return NextResponse.json({ error: "Invite code login is disabled" }, { status: 403 });
  }

  const rateLimit = checkRateLimitDetailed(request, { action: "invite_admin_login" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const abuseGuard = await enforceAbuseGuard({
    request,
    action: "invite_admin_login",
    endpointGroup: "auth",
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  const body = (await request.json().catch(() => ({}))) as Payload;
  const rawCode = String(body.code || "")
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

  const inviteResolution = await resolveRequiredInviteCode(rawCode, {
    allowedTypes: ["founder"],
  });

  if (!inviteResolution.isValid || !inviteResolution.normalizedCode) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 401 });
  }

  const normalizedCode = inviteResolution.normalizedCode;
  const syntheticEmail = `founder+${normalizedCode.toLowerCase()}@openlymarket.app`;

  const bridgeIdentity = await ensureBridgeUser({
    subject: `invite:founder:${normalizedCode}`,
    provider: "walletconnect",
    email: syntheticEmail,
    fullName: "OpenlyMarket Founder",
    avatarUrl: null,
  });

  const admin = createAdminClient();
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: "OpenlyMarket Founder",
      role_preference: "seller",
      onboarding_status: "completed",
      seller_status: "verified",
      is_admin: true,
    })
    .eq("id", bridgeIdentity.userId);

  if (profileError) {
    return NextResponse.json(
      {
        error: `Unable to activate founder profile: ${profileError.message}`,
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
    console.error("Failed to record invite admin auth security event", error);
  });

  const banEvasion = await detectBanEvasionRisk({
    request,
    userId: bridgeIdentity.userId,
  }).catch((error) => {
    console.error("Failed to evaluate invite admin ban-evasion risk", error);
    return { suspicious: false, reasonCodes: [], requiresStepUp: false };
  });

  const trustState = await getTrustAccountState(bridgeIdentity.userId);
  await upsertTrustAccountState({
    ...trustState,
    userId: bridgeIdentity.userId,
    accountFlag: banEvasion.requiresStepUp ? "under_review" : "trusted",
    emailVerified: true,
    identityVerified: true,
    kycStatus: "verified",
    trustScore: banEvasion.requiresStepUp ? Math.min(trustState.trustScore, 45) : 90,
    riskScore: banEvasion.requiresStepUp ? Math.max(trustState.riskScore, 70) : trustState.riskScore,
    riskLevel: banEvasion.requiresStepUp ? "high" : trustState.riskLevel,
    restrictions: {
      ...(trustState.restrictions || {}),
      stepUpVerificationRequired: banEvasion.requiresStepUp || trustState.restrictions?.stepUpVerificationRequired === true,
    },
    lastReasonCodes: banEvasion.reasonCodes.length > 0 ? banEvasion.reasonCodes : trustState.lastReasonCodes,
  }).catch((error) => {
    console.error("Failed to sync trust state after invite admin auth", error);
  });

  await registerInviteUsage({
    code: normalizedCode,
    userId: bridgeIdentity.userId,
    email: bridgeIdentity.email,
    source: "invite_admin_login",
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  });

  return response;
}

