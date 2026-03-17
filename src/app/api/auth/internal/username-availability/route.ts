import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";
import {
  normalizeInternalUsername,
  usernameAvailabilitySchema,
} from "@/lib/internal-auth/schemas";
import { isReservedProfileHandle } from "@/lib/security/identity-guards";

function withJitter() {
  const delayMs = 120 + Math.floor(Math.random() * 180);
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function GET(request: Request) {
  const rateLimit = checkRateLimitDetailed(request, { action: "internal_onboarding_username_check" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const abuseGuard = await enforceAbuseGuard({
    request,
    action: "internal_onboarding_username_check",
    endpointGroup: "auth",
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  const url = new URL(request.url);
  const parsed = usernameAvailabilitySchema.safeParse({
    username: url.searchParams.get("username") || "",
  });

  if (!parsed.success) {
    await withJitter();
    return NextResponse.json(
      {
        ok: false,
        available: false,
        error: "Invalid username",
      },
      { status: 400 }
    );
  }

  const normalizedUsername = normalizeInternalUsername(parsed.data.username);

  if (!/^[a-z0-9_-]{3,24}$/.test(normalizedUsername)) {
    await withJitter();
    return NextResponse.json({
      ok: true,
      available: false,
      username: normalizedUsername,
      reason: "Username must use 3-24 characters: lowercase letters, numbers, hyphen, underscore.",
    });
  }

  if (isReservedProfileHandle(normalizedUsername)) {
    await withJitter();
    return NextResponse.json({
      ok: true,
      available: false,
      username: normalizedUsername,
      reason: "This username is reserved.",
    });
  }

  const admin = createAdminClient();

  const [identityResult, profileResult] = await Promise.all([
    admin
      .from("internal_identities")
      .select("id")
      .eq("username", normalizedUsername)
      .maybeSingle<{ id: string }>(),
    admin.from("profiles").select("id").eq("username", normalizedUsername).maybeSingle<{ id: string }>(),
  ]);

  if (identityResult.error || profileResult.error) {
    await withJitter();
    return NextResponse.json(
      {
        ok: false,
        available: false,
        error: "Unable to check username availability",
      },
      { status: 500 }
    );
  }

  const available = !identityResult.data && !profileResult.data;
  await withJitter();

  return NextResponse.json({
    ok: true,
    available,
    username: normalizedUsername,
  });
}

