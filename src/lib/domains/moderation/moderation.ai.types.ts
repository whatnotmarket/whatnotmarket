import { isModerationReasonCode } from "@/lib/domains/moderation/moderation.reason-codes";
import type {
ModerationDecision,
ModerationReasonCode,
ModerationSeverity,
ModerationTargetType,
} from "@/lib/domains/moderation/moderation.types";
import { z } from "zod";

export const MODERATION_AI_CATEGORIES = [
  "spam",
  "scam",
  "off_platform_contact_attempt",
  "off_platform_payment_request",
  "phishing",
  "harassment",
  "hate_speech",
  "threat",
  "sexual_textual_content",
  "abusive_promotion",
  "suspicious_listing_language",
  "suspicious_public_profile_content",
  "risky_but_uncertain",
] as const;

export type ModerationAICategory = (typeof MODERATION_AI_CATEGORIES)[number];
export type ModerationAIProvider = "openai" | "perspective" | "custom" | "none";

export type ModerationClassifierInput = {
  targetType: ModerationTargetType;
  text: string;
  route: string | null;
  language?: string | null;
  metadata?: Record<string, unknown>;
  context?: {
    isPrivateMessage?: boolean;
  };
};

export type ModerationProviderResult = {
  providerName: ModerationAIProvider | string;
  decision: ModerationDecision;
  score: number;
  severity: ModerationSeverity;
  categories: ModerationAICategory[];
  reasonCodes: ModerationReasonCode[];
  confidence: number;
  explanation: string;
  sanitizedText?: string;
  shouldReview: boolean;
  shouldBlock: boolean;
  raw?: Record<string, unknown>;
};

export type ModerationAIExecution = {
  invoked: boolean;
  providerName: ModerationAIProvider | string;
  skippedReason:
    | "disabled"
    | "target_not_enabled"
    | "text_too_short"
    | "hard_rule_block"
    | "excluded_route"
    | "inbox_route"
    | null;
  providerError: string | null;
  result: ModerationProviderResult;
};

export interface ModerationProvider {
  name: ModerationAIProvider | string;
  moderate(input: ModerationClassifierInput): Promise<ModerationProviderResult>;
}

export const aiClassifierOutputSchema = z.object({
  decision: z.enum(["allow", "flag", "review", "block"]).default("allow"),
  score: z.coerce.number().min(0).max(100).default(0),
  severity: z.enum(["low", "medium", "high", "critical"]).default("low"),
  categories: z.array(z.enum(MODERATION_AI_CATEGORIES)).default([]),
  reasonCodes: z.array(z.string()).default([]),
  confidence: z.coerce.number().min(0).max(1).default(0.5),
  explanation: z.string().trim().max(800).default(""),
  sanitizedText: z.string().optional(),
  shouldReview: z.boolean().optional(),
  shouldBlock: z.boolean().optional(),
});

function normalizeSeverity(severity: "low" | "medium" | "high" | "critical", score: number): ModerationSeverity {
  if (score <= 0) return "none";
  return severity;
}

export function createAIAllowResult(providerName: ModerationAIProvider | string): ModerationProviderResult {
  return {
    providerName,
    decision: "allow",
    score: 0,
    severity: "none",
    categories: [],
    reasonCodes: [],
    confidence: 1,
    explanation: "no_ai_signal",
    shouldReview: false,
    shouldBlock: false,
    raw: {},
  };
}

export function parseAIClassifierOutput(
  providerName: ModerationAIProvider | string,
  payload: unknown,
  fallbackReasonCode?: ModerationReasonCode
): ModerationProviderResult {
  const parsed = aiClassifierOutputSchema.safeParse(payload);
  if (!parsed.success) {
    const fallback = createAIAllowResult(providerName);
    if (fallbackReasonCode) {
      fallback.reasonCodes = [fallbackReasonCode];
      fallback.explanation = "invalid_ai_payload";
    }
    return fallback;
  }

  const reasonCodes = parsed.data.reasonCodes.filter((code) => isModerationReasonCode(code));
  const shouldBlock = parsed.data.shouldBlock ?? parsed.data.decision === "block";
  const shouldReview = parsed.data.shouldReview ?? parsed.data.decision === "review";

  return {
    providerName,
    decision: parsed.data.decision,
    score: parsed.data.score,
    severity: normalizeSeverity(parsed.data.severity, parsed.data.score),
    categories: parsed.data.categories,
    reasonCodes,
    confidence: parsed.data.confidence,
    explanation: parsed.data.explanation,
    sanitizedText: parsed.data.sanitizedText,
    shouldReview,
    shouldBlock,
    raw: parsed.data,
  };
}

export function tryParseJsonObject(raw: string): Record<string, unknown> | null {
  const input = String(raw || "").trim();
  if (!input) return null;

  try {
    return JSON.parse(input) as Record<string, unknown>;
  } catch {
    const firstBrace = input.indexOf("{");
    const lastBrace = input.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) return null;

    try {
      return JSON.parse(input.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

