import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { onboardingProgressSchema } from "@/lib/internal-auth/schemas";
import { verifyOnboardingSessionProof } from "@/lib/internal-auth/onboarding-session";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";

export async function POST(request: Request) {
  const rateLimit = checkRateLimitDetailed(request, { action: "internal_onboarding_progress" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const abuseGuard = await enforceAbuseGuard({
    request,
    action: "internal_onboarding_progress",
    endpointGroup: "auth",
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  const parsed = onboardingProgressSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid onboarding progress payload." }, { status: 400 });
  }

  const payload = parsed.data;
  const validSessionProof = verifyOnboardingSessionProof({
    sessionId: payload.sessionId,
    token: payload.onboardingSessionToken,
  });
  if (!validSessionProof) {
    return NextResponse.json({ ok: false, error: "Invalid onboarding session." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { error } = await admin.from("onboarding_leads").upsert(
    {
      session_id: payload.sessionId,
      discovery_source: payload.discoverySource,
      user_intent: payload.userIntent,
      seller_category: payload.sellerCategory,
      buyer_interest: payload.buyerInterest,
      seller_name: payload.sellerName,
      reviews_channel: payload.reviewsChannel,
      escrow_experience: payload.escrowExperience,
      seller_notes: payload.sellerNotes,
      bio: payload.bio,
      x_handle: payload.xHandle,
      avatar_url: payload.avatarUrl,
      selected_access_method: payload.selectedAccessMethod,
      completed_identity: payload.completedIdentity ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: "Unable to save onboarding progress." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
