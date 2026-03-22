import { revalidateMarketplaceSitemaps } from "@/lib/app/seo/sitemaps";
import { moderateContent } from "@/lib/domains/moderation/moderation.service";
import { AbuseGuardResponse,enforceAbuseGuard } from "@/lib/domains/security/abuse-guards";
import { checkRateLimitDetailed,RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { createClient } from "@/lib/infra/supabase/supabase-server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateRequestSchema = z.object({
  title: z.string().trim().min(5).max(160).optional(),
  description: z.string().trim().min(10).max(4000).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  condition: z.string().trim().min(2).max(80).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  paymentMethod: z.string().trim().max(120).optional(),
  deliveryTime: z.string().trim().max(120).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const rateLimit = checkRateLimitDetailed(request, { action: "request_update" });
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
    action: "request_update",
    endpointGroup: "marketplace",
    userId: user.id,
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing listing id" }, { status: 400 });
  }

  const parsed = updateRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid update payload" }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("requests")
    .select("id,created_by")
    .eq("id", id)
    .maybeSingle<{ id: string; created_by: string }>();

  if (existingError || !existing) {
    return NextResponse.json({ ok: false, error: "Listing not found" }, { status: 404 });
  }

  if (existing.created_by !== user.id) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const payload = parsed.data;
  const moderationTargets: Array<ReturnType<typeof moderateContent>> = [];

  if (payload.title) {
    moderationTargets.push(
      moderateContent({
        targetType: "listing_title",
        text: payload.title,
        actorId: user.id,
        entityId: id,
        context: {
          pathname: `/api/requests/${id}/update`,
          source: "route_handler",
          endpointTag: "requests_update",
        },
      })
    );
  }
  if (payload.description) {
    moderationTargets.push(
      moderateContent({
        targetType: "listing_description",
        text: payload.description,
        actorId: user.id,
        entityId: id,
        context: {
          pathname: `/api/requests/${id}/update`,
          source: "route_handler",
          endpointTag: "requests_update",
        },
      })
    );
  }

  const moderationResults = await Promise.all(moderationTargets);
  const blockResult = moderationResults.find((result) => result.shouldBlock);
  if (blockResult) {
    return NextResponse.json(
      {
        ok: false,
        code: "PUBLIC_CONTENT_POLICY_VIOLATION",
        error: blockResult.userMessage,
        reasonCodes: blockResult.reasonCodes,
      },
      { status: 400 }
    );
  }

  let titleModerationIndex = 0;
  const updatePayload: Record<string, unknown> = {};

  if (payload.title) {
    const result = moderationResults[titleModerationIndex];
    updatePayload.title = result?.sanitizedText || payload.title;
    titleModerationIndex += 1;
  }

  if (payload.description) {
    const result = moderationResults[titleModerationIndex];
    updatePayload.description = result?.sanitizedText || payload.description;
  }

  if (payload.category) updatePayload.category = payload.category;
  if (payload.condition) updatePayload.condition = payload.condition;
  if (typeof payload.budgetMin === "number") updatePayload.budget_min = payload.budgetMin;
  if (typeof payload.budgetMax === "number") updatePayload.budget_max = payload.budgetMax;
  if (payload.paymentMethod !== undefined) updatePayload.payment_method = payload.paymentMethod || null;
  if (payload.deliveryTime !== undefined) updatePayload.delivery_time = payload.deliveryTime || null;

  const requiresReview = moderationResults.some((result) => result.shouldReview);
  const reasonCodes = Array.from(new Set(moderationResults.flatMap((result) => result.reasonCodes)));
  if (requiresReview) {
    updatePayload.safety_status = "pending_review";
    updatePayload.visibility_state = "limited";
    updatePayload.trust_reason_codes = reasonCodes;
    updatePayload.moderation_notes = "Il contenuto Ã¨ stato inviato e sarÃ  verificato prima della pubblicazione.";
  }

  let { error: updateError } = await supabase.from("requests").update(updatePayload).eq("id", id);

  if (updateError && /Could not find the '([^']+)' column/.test(String(updateError.message || ""))) {
    delete updatePayload.safety_status;
    delete updatePayload.visibility_state;
    delete updatePayload.trust_reason_codes;
    delete updatePayload.moderation_notes;
    const fallback = await supabase.from("requests").update(updatePayload).eq("id", id);
    updateError = fallback.error;
  }

  if (updateError) {
    return NextResponse.json({ ok: false, error: "Unable to update listing" }, { status: 500 });
  }

  revalidateMarketplaceSitemaps();

  return NextResponse.json({
    ok: true,
    requestId: id,
    moderation: {
      decision: requiresReview ? "review" : moderationResults.some((result) => result.decision === "flag") ? "flag" : "allow",
      reasonCodes,
      message: requiresReview
        ? "Il contenuto Ã¨ stato inviato e sarÃ  verificato prima della pubblicazione."
        : "Operazione completata.",
    },
  });
}

