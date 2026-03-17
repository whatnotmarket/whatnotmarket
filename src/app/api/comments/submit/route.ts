import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { enforceAbuseGuard, AbuseGuardResponse } from "@/lib/security/abuse-guards";
import { moderateContent } from "@/lib/moderation/moderation.service";

const submitCommentSchema = z.object({
  entityType: z.string().trim().min(2).max(80),
  entityId: z.string().trim().min(2).max(160),
  content: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimitDetailed(request, { action: "comment_submit" });
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
    action: "comment_submit",
    endpointGroup: "community",
    userId: user.id,
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  const parsed = submitCommentSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid comment payload" }, { status: 400 });
  }

  const payload = parsed.data;
  const moderation = await moderateContent({
    targetType: "comment",
    text: payload.content,
    actorId: user.id,
    entityId: payload.entityId,
    context: {
      pathname: "/api/comments/submit",
      source: "route_handler",
      endpointTag: "comment_submit",
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
    .from("public_comments")
    .insert({
      author_id: user.id,
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      content: moderation.sanitizedText,
      status,
      moderation_reason_codes: moderation.reasonCodes,
    })
    .select("id,status")
    .single<{ id: string; status: string }>();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "Unable to submit comment" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    commentId: data.id,
    status: data.status,
    message:
      status === "pending_review"
        ? "Il contenuto è stato inviato e sarà verificato prima della pubblicazione."
        : "Operazione completata.",
  });
}
