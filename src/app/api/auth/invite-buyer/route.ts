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

    const inviteResolution = await resolveRequiredInviteCode(code, {
      allowedTypes: ["buyer"],
    });

    if (!inviteResolution.isValid || !inviteResolution.normalizedCode) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 401 });
    }

    const normalizedCode = inviteResolution.normalizedCode;
    const email = `invite-buyer+${normalizedCode.toLowerCase()}@whatnotmarket.app`;

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
