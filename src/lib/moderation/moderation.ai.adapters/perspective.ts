import { MODERATION_AI_CONFIG } from "@/lib/moderation/moderation.ai.config";
import {
  createAIAllowResult,
  type ModerationAICategory,
  type ModerationClassifierInput,
  type ModerationProvider,
  type ModerationProviderResult,
} from "@/lib/moderation/moderation.ai.types";
import type { ModerationReasonCode } from "@/lib/moderation/moderation.types";

const CATEGORY_REASON_CODE_MAP: Partial<Record<ModerationAICategory, ModerationReasonCode>> = {
  spam: "AI_SPAM_SIGNAL",
  harassment: "AI_HARASSMENT_SIGNAL",
  hate_speech: "AI_HATE_SIGNAL",
  threat: "AI_THREAT_SIGNAL",
  sexual_textual_content: "AI_SEXUAL_TEXT_SIGNAL",
};

type PerspectiveScore = {
  summaryScore?: {
    value?: number;
  };
};

type PerspectiveResponse = {
  attributeScores?: Record<string, PerspectiveScore>;
};

function mapAttributeScore(json: PerspectiveResponse, key: string) {
  return Number(json.attributeScores?.[key]?.summaryScore?.value || 0);
}

function pushIfScore(
  categories: ModerationAICategory[],
  score: number,
  threshold: number,
  category: ModerationAICategory
) {
  if (score >= threshold) {
    categories.push(category);
  }
}

function mapReasonCodes(result: ModerationProviderResult): ModerationReasonCode[] {
  const codes = result.categories
    .map((category) => CATEGORY_REASON_CODE_MAP[category])
    .filter((code): code is ModerationReasonCode => Boolean(code));

  if (result.decision === "block") codes.push("AI_MODERATION_BLOCKED");
  if (result.decision === "review" || result.decision === "flag") codes.push("AI_MODERATION_FLAGGED");
  return Array.from(new Set(codes));
}

export class PerspectiveModerationAdapter implements ModerationProvider {
  name = "perspective" as const;

  async moderate(input: ModerationClassifierInput): Promise<ModerationProviderResult> {
    if (!MODERATION_AI_CONFIG.perspective.apiKey) {
      return createAIAllowResult(this.name);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MODERATION_AI_CONFIG.aiTimeoutMs);

    try {
      const requestBody = {
        comment: { text: input.text },
        languages: input.language ? [input.language] : ["it", "en"],
        doNotStore: true,
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          INSULT: {},
          IDENTITY_ATTACK: {},
          THREAT: {},
          SEXUALLY_EXPLICIT: {},
          SPAM: {},
        },
      };

      const response = await fetch(
        `${MODERATION_AI_CONFIG.perspective.endpoint}?key=${encodeURIComponent(MODERATION_AI_CONFIG.perspective.apiKey)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const fallback = createAIAllowResult(this.name);
        fallback.reasonCodes = ["AI_PROVIDER_ERROR"];
        fallback.explanation = `perspective_http_${response.status}`;
        fallback.raw = { status: response.status };
        return fallback;
      }

      const json = (await response.json().catch(() => ({}))) as PerspectiveResponse;
      const spamScore = mapAttributeScore(json, "SPAM");
      const toxicityScore = mapAttributeScore(json, "TOXICITY");
      const severeToxicityScore = mapAttributeScore(json, "SEVERE_TOXICITY");
      const insultScore = mapAttributeScore(json, "INSULT");
      const identityAttackScore = mapAttributeScore(json, "IDENTITY_ATTACK");
      const threatScore = mapAttributeScore(json, "THREAT");
      const sexualScore = mapAttributeScore(json, "SEXUALLY_EXPLICIT");

      const maxScore = Math.max(
        spamScore,
        toxicityScore,
        severeToxicityScore,
        insultScore,
        identityAttackScore,
        threatScore,
        sexualScore
      );
      const normalizedScore = Math.min(100, Math.round(maxScore * 100));

      const categories: ModerationAICategory[] = [];
      pushIfScore(categories, spamScore, 0.75, "spam");
      pushIfScore(categories, Math.max(toxicityScore, insultScore, severeToxicityScore), 0.74, "harassment");
      pushIfScore(categories, identityAttackScore, 0.7, "hate_speech");
      pushIfScore(categories, threatScore, 0.68, "threat");
      pushIfScore(categories, sexualScore, 0.72, "sexual_textual_content");
      if (categories.length === 0 && normalizedScore >= MODERATION_AI_CONFIG.reviewThreshold) {
        categories.push("risky_but_uncertain");
      }

      let decision: "allow" | "flag" | "review" | "block" = "allow";
      if (normalizedScore >= MODERATION_AI_CONFIG.blockThreshold) decision = "block";
      else if (normalizedScore >= MODERATION_AI_CONFIG.reviewThreshold) decision = "review";
      else if (normalizedScore >= 30) decision = "flag";

      const result: ModerationProviderResult = {
        providerName: this.name,
        decision,
        score: normalizedScore,
        severity:
          decision === "block"
            ? "critical"
            : decision === "review"
              ? "high"
              : decision === "flag"
                ? "medium"
                : "none",
        categories,
        reasonCodes: [],
        confidence: Number(Math.min(1, Math.max(0.35, maxScore)).toFixed(2)),
        explanation: "perspective_semantic_moderation",
        shouldReview: decision === "review",
        shouldBlock: decision === "block",
        raw: {
          spamScore,
          toxicityScore,
          severeToxicityScore,
          insultScore,
          identityAttackScore,
          threatScore,
          sexualScore,
        },
      };

      result.reasonCodes = mapReasonCodes(result);
      return result;
    } catch (error) {
      const fallback = createAIAllowResult(this.name);
      fallback.reasonCodes = ["AI_PROVIDER_ERROR"];
      fallback.explanation = error instanceof Error ? error.message : "perspective_provider_error";
      fallback.raw = {
        error: fallback.explanation,
      };
      return fallback;
    } finally {
      clearTimeout(timeout);
    }
  }
}
