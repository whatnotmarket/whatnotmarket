import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/infra/supabase/supabase-server";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { enforceAbuseGuard, AbuseGuardResponse } from "@/lib/domains/security/abuse-guards";
import { moderateContent } from "@/lib/domains/moderation/moderation.service";

const submitReviewSchema = z.object({
  revieweeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().min(3).max(2000),
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimitDetailed(request, { action: "review_submit" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const abuseGuard = await enforceAbuseGuard({
    request,
    action: "review_submit",
    endpointGroup: "community",
    userId: user.id,
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  const parsed = submitReviewSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid review payload" }, { status: 400 });
  }

  const payload = parsed.data;
  if (payload.revieweeId === user.id) {
    return NextResponse.json({ ok: false, error: "You cannot review yourself" }, { status: 400 });
  }

  const { data: interaction } = await supabase
    .from("deals")
    .select("id")
    .or(
      `and(buyer_id.eq.${user.id},seller_id.eq.${payload.revieweeId}),and(buyer_id.eq.${payload.revieweeId},seller_id.eq.${user.id})`
    )
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!interaction) {
    return NextResponse.json(
      {
        ok: false,
        error: "Le recensioni sono consentite solo dopo un'interazione verificata.",
      },
      { status: 403 }
    );
  }

  const moderation = await moderateContent({
    targetType: "review",
    text: payload.content,
    actorId: user.id,
    entityId: payload.revieweeId,
    context: {
      pathname: "/api/reviews/submit",
      source: "route_handler",
      endpointTag: "review_submit",
    },
  });

  if (moderation.shouldBlock) {
    return NextResponse.json(
      {
        ok: false,
        code: "PUBLIC_CONTENT_POLICY_VIOLATION",
        error: moderation.userMessage,
        reasonCodes: moderation.reasonCodes,
      },
      { status: 400 }
    );
  }

  const status = moderation.shouldReview ? "pending_review" : "published";

  const { data, error } = await supabase
    .from("user_reviews")
    .insert({
      reviewer_id: user.id,
      reviewee_id: payload.revieweeId,
      rating: payload.rating,
      content: moderation.sanitizedText,
      status,
      moderation_reason_codes: moderation.reasonCodes,
    })
    .select("id,status")
    .single<{ id: string; status: string }>();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "Unable to submit review" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    reviewId: data.id,
    status: data.status,
    message:
      status === "pending_review"
        ? "Il contenuto Ã¨ stato inviato e sarÃ  verificato prima della pubblicazione."
        : "Operazione completata.",
  });
}

