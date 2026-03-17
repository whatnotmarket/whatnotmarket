import { NextResponse } from "next/server";
import { resolveInviteCode } from "@/lib/invite-codes";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";

type InviteRolePayload = {
  code?: string;
};

export async function POST(request: Request) {
  const rateLimit = checkRateLimitDetailed(request, { action: "invite_role_lookup" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const abuseGuard = await enforceAbuseGuard({
    request,
    action: "invite_role_lookup",
    endpointGroup: "auth",
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  let payload: InviteRolePayload = {};

  try {
    payload = (await request.json()) as InviteRolePayload;
  } catch {
    // Keep default empty payload.
  }

  const resolution = await resolveInviteCode(payload.code ?? "");
  if (!resolution.isValid) {
    return NextResponse.json(
      {
        error: "Invalid invite code",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    role: resolution.role,
    normalizedCode: resolution.normalizedCode,
  });
}
