import { MODERATION_AI_CONFIG } from "@/lib/moderation/moderation.ai.config";
import { buildModerationSystemPrompt, buildModerationUserPrompt } from "@/lib/moderation/moderation.ai.prompts";
import {
  createAIAllowResult,
  parseAIClassifierOutput,
  tryParseJsonObject,
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
  risky_but_uncertain: "AI_BORDERLINE_REVIEW",
};

function withMappedReasonCodes(result: ModerationProviderResult): ModerationProviderResult {
  const categoryReasonCodes = result.categories
    .map((category) => CATEGORY_REASON_CODE_MAP[category])
    .filter((code): code is ModerationReasonCode => Boolean(code));

  const reasonCodes = Array.from(new Set([...result.reasonCodes, ...categoryReasonCodes]));
  if (result.decision === "block") {
    reasonCodes.push("AI_MODERATION_BLOCKED");
  } else if (result.decision === "review" || result.decision === "flag") {
    reasonCodes.push("AI_MODERATION_FLAGGED");
  }

  return {
    ...result,
    reasonCodes: Array.from(new Set(reasonCodes)),
  };
}

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export class OpenAIModerationAdapter implements ModerationProvider {
  name = "openai" as const;

  async moderate(input: ModerationClassifierInput): Promise<ModerationProviderResult> {
    if (!MODERATION_AI_CONFIG.openai.apiKey) {
      return createAIAllowResult(this.name);
    }

    const requestBody = {
      model: MODERATION_AI_CONFIG.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildModerationSystemPrompt() },
        { role: "user", content: buildModerationUserPrompt(input) },
      ],
    };

    let lastError: string | null = null;
    for (let attempt = 0; attempt <= MODERATION_AI_CONFIG.retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), MODERATION_AI_CONFIG.aiTimeoutMs);

      try {
        const response = await fetch(MODERATION_AI_CONFIG.openai.endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${MODERATION_AI_CONFIG.openai.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.ok) {
          lastError = `openai_http_${response.status}`;
          continue;
        }

        const json = (await response.json().catch(() => ({}))) as OpenAIChatCompletionResponse;
        const content = String(json.choices?.[0]?.message?.content || "").trim();
        const parsedObject = tryParseJsonObject(content);
        if (!parsedObject) {
          lastError = "openai_invalid_json";
          continue;
        }

        const parsed = parseAIClassifierOutput(this.name, parsedObject, "AI_PROVIDER_ERROR");
        return withMappedReasonCodes(parsed);
      } catch (error) {
        lastError = error instanceof Error ? error.message : "openai_unknown_error";
      } finally {
        clearTimeout(timeout);
      }
    }

    const fallback = createAIAllowResult(this.name);
    fallback.reasonCodes = ["AI_PROVIDER_ERROR"];
    fallback.explanation = lastError || "openai_provider_error";
    fallback.raw = { error: lastError || "openai_provider_error" };
    return fallback;
  }
}
