import { createAdminClient } from "@/lib/supabase-admin";
import type { ModerationInput, ModerationResult } from "@/lib/moderation/moderation.types";

type ModerationAuditPayload = {
  input: ModerationInput;
  result: ModerationResult;
};

function safeExcerpt(text: string) {
  return String(text || "").slice(0, 400);
}

export async function writeModerationAudit(payload: ModerationAuditPayload) {
  const admin = createAdminClient();
  const route = payload.input.context?.pathname || null;

  try {
    await admin.from("moderation_events").insert({
      target_type: payload.input.targetType,
      entity_id: payload.input.entityId || null,
      actor_id: payload.input.actorId || null,
      decision: payload.result.decision,
      severity: payload.result.severity,
      score: payload.result.score,
      reason_codes: payload.result.reasonCodes,
      matched_rules: payload.result.matchedRules,
      route,
      skipped_because_inbox: payload.result.skippedBecauseInbox,
      original_excerpt: safeExcerpt(payload.input.text),
      sanitized_excerpt: safeExcerpt(payload.result.sanitizedText),
      metadata: {
        ...(payload.input.metadata || {}),
        ai: {
          invoked: payload.result.ai.invoked,
          providerName: payload.result.ai.providerName,
          categories: payload.result.ai.categories,
          confidence: payload.result.ai.confidence,
          skippedByPolicy: payload.result.ai.skippedByPolicy,
          skippedReason: payload.result.ai.skippedReason,
        },
      },
    });
  } catch (error) {
    console.error("[moderation] unable to write moderation_events", error);
  }

  if (payload.result.decision !== "review") return;

  try {
    await admin.from("moderation_reviews_queue").insert({
      target_type: payload.input.targetType,
      entity_id: payload.input.entityId || null,
      actor_id: payload.input.actorId || null,
      route,
      reason_codes: payload.result.reasonCodes,
      score: payload.result.score,
      severity: payload.result.severity,
      status: "pending",
      payload: {
        originalText: safeExcerpt(payload.input.text),
        sanitizedText: safeExcerpt(payload.result.sanitizedText),
        metadata: {
          ...(payload.input.metadata || {}),
          ai: {
            invoked: payload.result.ai.invoked,
            providerName: payload.result.ai.providerName,
            categories: payload.result.ai.categories,
            confidence: payload.result.ai.confidence,
            explanation: payload.result.ai.explanation,
          },
        },
      },
    });
  } catch (error) {
    console.error("[moderation] unable to write moderation_reviews_queue", error);
  }
}
