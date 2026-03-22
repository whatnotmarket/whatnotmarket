import { moderateContent } from "@/lib/domains/moderation/moderation.service";
import { AbuseGuardResponse,enforceAbuseGuard } from "@/lib/domains/security/abuse-guards";
import { checkRateLimitDetailed,RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { createClient } from "@/lib/infra/supabase/supabase-server";
import { NextResponse } from "next/server";
import { z } from "zod";

const submitPublicFormSchema = z.object({
  formKey: z.string().trim().min(2).max(80),
  title: z.string().trim().max(160).optional(),
  message: z.string().trim().min(3).max(4000),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimitDetailed(request, { action: "public_form_submit" });
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
    action: "public_form_submit",
    endpointGroup: "public_forms",
    userId: user.id,
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  const parsed = submitPublicFormSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid form payload" }, { status: 400 });
  }

  const payload = parsed.data;
  const textToModerate = [payload.title || "", payload.message].join("\n");
  const moderation = await moderateContent({
    targetType: "public_form",
    text: textToModerate,
    actorId: user.id,
    entityId: payload.formKey,
    context: {
      pathname: "/api/public/forms/submit",
      source: "route_handler",
      endpointTag: "public_form_submit",
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

  const status = moderation.shouldReview ? "pending_review" : "submitted";
  const sanitizedPayload = moderation.sanitizedText.split("\n");
  const sanitizedTitle = payload.title ? sanitizedPayload[0] || payload.title : payload.title || null;
  const sanitizedMessage = payload.title
    ? sanitizedPayload.slice(1).join("\n").trim() || payload.message
    : moderation.sanitizedText;

  const { data, error } = await supabase
    .from("public_form_submissions")
    .insert({
      actor_id: user.id,
      form_key: payload.formKey,
      title: sanitizedTitle,
      message: sanitizedMessage,
      payload: payload.payload || {},
      status,
      moderation_reason_codes: moderation.reasonCodes,
    })
    .select("id,status")
    .single<{ id: string; status: string }>();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "Unable to submit form" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    submissionId: data.id,
    status: data.status,
    message:
      data.status === "pending_review"
        ? "Il contenuto Ã¨ stato inviato e sarÃ  verificato prima della pubblicazione."
        : "Operazione completata.",
  });
}

