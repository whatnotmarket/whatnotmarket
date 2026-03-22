import { MODERATION_REASON_CODES } from "@/lib/domains/moderation/moderation.reason-codes";
import { MODERATION_AI_CONFIG } from "@/lib/domains/moderation/moderation.ai.config";
import { CustomModerationAdapter } from "@/lib/domains/moderation/moderation.ai.adapters/custom";
import { OpenAIModerationAdapter } from "@/lib/domains/moderation/moderation.ai.adapters/openai";
import { PerspectiveModerationAdapter } from "@/lib/domains/moderation/moderation.ai.adapters/perspective";
import { isInboxRoute } from "@/lib/domains/moderation/moderation.skip";
import {
  createAIAllowResult,
  type ModerationAIExecution,
  type ModerationClassifierInput,
  type ModerationProvider,
  type ModerationProviderResult,
} from "@/lib/domains/moderation/moderation.ai.types";

type ModerateWithAIOptions = {
  skipBecauseHardRuleBlock?: boolean;
};

type AISkipDecision = {
  skip: boolean;
  reason: ModerationAIExecution["skippedReason"];
  reasonCode?: "AI_SKIPPED_INBOX_ROUTE";
};

function normalizeRoute(route: string | null | undefined) {
  return String(route || "").trim().toLowerCase();
}

function isExcludedRoute(route: string | null) {
  const normalized = normalizeRoute(route);
  if (!normalized) return false;

  return MODERATION_AI_CONFIG.excludedRoutes.some((excluded) => {
    const normalizedExcluded = normalizeRoute(excluded);
    return normalized === normalizedExcluded || normalized.startsWith(`${normalizedExcluded}/`);
  });
}

function resolveAIProvider(): ModerationProvider {
  switch (MODERATION_AI_CONFIG.provider) {
    case "openai":
      return new OpenAIModerationAdapter();
    case "perspective":
      return new PerspectiveModerationAdapter();
    case "custom":
      return new CustomModerationAdapter();
    default:
      return {
        name: "none",
        moderate: async () => createAIAllowResult("none"),
      };
  }
}

function shouldSkipAI(input: ModerationClassifierInput, options: ModerateWithAIOptions): AISkipDecision {
  if (options.skipBecauseHardRuleBlock) {
    return { skip: true, reason: "hard_rule_block" };
  }

  const route = normalizeRoute(input.route);
  if (input.context?.isPrivateMessage || isInboxRoute(route) || isExcludedRoute(route)) {
    return { skip: true, reason: route.includes("/inbox") ? "inbox_route" : "excluded_route", reasonCode: "AI_SKIPPED_INBOX_ROUTE" };
  }

  if (!MODERATION_AI_CONFIG.enabled || MODERATION_AI_CONFIG.provider === "none") {
    return { skip: true, reason: "disabled" };
  }

  if (!MODERATION_AI_CONFIG.enabledTargets.has(input.targetType)) {
    return { skip: true, reason: "target_not_enabled" };
  }

  const text = String(input.text || "").trim();
  const looksPotentiallyRisky = /[@:/.]|(?:http|www|wa\.me|t\.me|\+\d)/i.test(text);
  if (text.length < MODERATION_AI_CONFIG.minTextLengthForAI && !looksPotentiallyRisky) {
    return { skip: true, reason: "text_too_short" };
  }

  return { skip: false, reason: null };
}

function normalizeAIResult(result: ModerationProviderResult): ModerationProviderResult {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(Number(result.score || 0))));
  const normalizedConfidence = Math.min(1, Math.max(0, Number(result.confidence || 0)));

  let decision = result.decision;
  const reasonCodes = new Set(result.reasonCodes);

  if (decision !== "allow" && normalizedConfidence < MODERATION_AI_CONFIG.aiConfidenceThreshold) {
    reasonCodes.add(MODERATION_REASON_CODES.AI_CONFIDENCE_LOW);
    if (decision === "block") {
      decision = "review";
    }
  }

  if (decision === "block") {
    reasonCodes.add(MODERATION_REASON_CODES.AI_MODERATION_BLOCKED);
  } else if (decision === "review" || decision === "flag") {
    reasonCodes.add(MODERATION_REASON_CODES.AI_MODERATION_FLAGGED);
  }

  return {
    ...result,
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
    confidence: Number(normalizedConfidence.toFixed(2)),
    reasonCodes: Array.from(reasonCodes),
    shouldBlock: decision === "block",
    shouldReview: decision === "review",
  };
}

export async function moderateWithAI(
  input: ModerationClassifierInput,
  options: ModerateWithAIOptions = {}
): Promise<ModerationAIExecution> {
  const skipDecision = shouldSkipAI(input, options);
  const provider = resolveAIProvider();

  if (skipDecision.skip) {
    const result = createAIAllowResult(provider.name);
    if (skipDecision.reasonCode) {
      result.reasonCodes = [skipDecision.reasonCode];
    }
    return {
      invoked: false,
      providerName: provider.name,
      skippedReason: skipDecision.reason,
      providerError: null,
      result,
    };
  }

  try {
    const providerResult = await provider.moderate(input);
    const normalized = normalizeAIResult(providerResult);
    return {
      invoked: true,
      providerName: provider.name,
      skippedReason: null,
      providerError: normalized.reasonCodes.includes("AI_PROVIDER_ERROR") ? normalized.explanation : null,
      result: normalized,
    };
  } catch (error) {
    const fallback = createAIAllowResult(provider.name);
    fallback.reasonCodes = [MODERATION_REASON_CODES.AI_PROVIDER_ERROR];
    fallback.explanation = error instanceof Error ? error.message : "ai_provider_failure";
    fallback.raw = { error: fallback.explanation };

    return {
      invoked: true,
      providerName: provider.name,
      skippedReason: null,
      providerError: fallback.explanation,
      result: normalizeAIResult(fallback),
    };
  }
}

