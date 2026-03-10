import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ensureBridgeUser, signInBridgeUserOnRoute } from "@/lib/auth/bridge";
import { createAdminClient } from "@/lib/supabase-admin";
import { getRedirectPath } from "@/lib/redirects";
import { registerInviteUsage, resolveRequiredInviteCode } from "@/lib/invite-codes";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";
import { isInviteCodeDirectLoginEnabled } from "@/lib/security/auth-guards";

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

  const inviteResolution = await resolveRequiredInviteCode(rawCode, {
    allowedTypes: ["founder"],
  });

  if (!inviteResolution.isValid || !inviteResolution.normalizedCode) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 401 });
  }

  const normalizedCode = inviteResolution.normalizedCode;
  const syntheticEmail = `founder+${normalizedCode.toLowerCase()}@whatnotmarket.app`;

  const bridgeIdentity = await ensureBridgeUser({
    subject: `invite:founder:${normalizedCode}`,
    provider: "walletconnect",
    email: syntheticEmail,
    fullName: "WhatnotMarket Founder",
    avatarUrl: null,
  });

  const admin = createAdminClient();
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: "WhatnotMarket Founder",
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
