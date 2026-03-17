import { MODERATION_AI_CONFIG } from "@/lib/moderation/moderation.ai.config";
import {
  createAIAllowResult,
  parseAIClassifierOutput,
  type ModerationAICategory,
  type ModerationClassifierInput,
  type ModerationProvider,
  type ModerationProviderResult,
} from "@/lib/moderation/moderation.ai.types";
import type { ModerationReasonCode } from "@/lib/moderation/moderation.types";

const CATEGORY_REASON_CODE_MAP: Partial<Record<ModerationAICategory, ModerationReasonCode>> = {
  spam: "AI_SPAM_SIGNAL",
  scam: "AI_SCAM_SIGNAL",
  off_platform_contact_attempt: "AI_OFF_PLATFORM_CONTACT_SIGNAL",
  off_platform_payment_request: "AI_OFF_PLATFORM_PAYMENT_SIGNAL",
  phishing: "AI_PHISHING_SIGNAL",
  harassment: "AI_HARASSMENT_SIGNAL",
  hate_speech: "AI_HATE_SIGNAL",
  threat: "AI_THREAT_SIGNAL",
  sexual_textual_content: "AI_SEXUAL_TEXT_SIGNAL",
  suspicious_listing_language: "AI_SUSPICIOUS_LISTING_LANGUAGE",
  suspicious_public_profile_content: "AI_SUSPICIOUS_LISTING_LANGUAGE",
  risky_but_uncertain: "AI_BORDERLINE_REVIEW",
};

function withMappedReasonCodes(result: ModerationProviderResult): ModerationProviderResult {
  const mapped = result.categories
    .map((category) => CATEGORY_REASON_CODE_MAP[category])
    .filter((code): code is ModerationReasonCode => Boolean(code));

  const reasonCodes = new Set<ModerationReasonCode>([...result.reasonCodes, ...mapped]);
  if (result.decision === "block") reasonCodes.add("AI_MODERATION_BLOCKED");
  if (result.decision === "review" || result.decision === "flag") reasonCodes.add("AI_MODERATION_FLAGGED");

  return {
    ...result,
    reasonCodes: Array.from(reasonCodes),
  };
}

export class CustomModerationAdapter implements ModerationProvider {
  name = "custom" as const;

  async moderate(input: ModerationClassifierInput): Promise<ModerationProviderResult> {
    if (!MODERATION_AI_CONFIG.custom.endpoint) {
      return createAIAllowResult(this.name);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MODERATION_AI_CONFIG.aiTimeoutMs);

    try {
      const response = await fetch(MODERATION_AI_CONFIG.custom.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(MODERATION_AI_CONFIG.custom.apiKey
            ? {
                Authorization: `Bearer ${MODERATION_AI_CONFIG.custom.apiKey}`,
              }
            : {}),
        },
        body: JSON.stringify({
          targetType: input.targetType,
          route: input.route,
          text: input.text,
          language: input.language || null,
          metadata: input.metadata || {},
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const fallback = createAIAllowResult(this.name);
        fallback.reasonCodes = ["AI_PROVIDER_ERROR"];
        fallback.explanation = `custom_provider_http_${response.status}`;
        fallback.raw = { status: response.status };
        return fallback;
      }

      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const parsed = parseAIClassifierOutput(this.name, payload, "AI_PROVIDER_ERROR");
      return withMappedReasonCodes(parsed);
    } catch (error) {
      const fallback = createAIAllowResult(this.name);
      fallback.reasonCodes = ["AI_PROVIDER_ERROR"];
      fallback.explanation = error instanceof Error ? error.message : "custom_provider_error";
      fallback.raw = {
        error: fallback.explanation,
      };
      return fallback;
    } finally {
      clearTimeout(timeout);
    }
  }
}
