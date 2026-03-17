import { MODERATION_CONFIG } from "@/lib/moderation/moderation.config";
import { MODERATION_REASON_CODES } from "@/lib/moderation/moderation.reason-codes";
import { writeModerationAudit } from "@/lib/moderation/moderation.audit";
import { MODERATION_AI_CONFIG } from "@/lib/moderation/moderation.ai.config";
import { moderateWithAI } from "@/lib/moderation/moderation.ai.service";
import { evaluateRuleBasedModeration } from "@/lib/moderation/moderation.rules";
import { shouldSkipModeration } from "@/lib/moderation/moderation.skip";
import type {
  ModerationDecision,
  ModerationInput,
  ModerationReasonCode,
  ModerationResult,
  ModerationSeverity,
} from "@/lib/moderation/moderation.types";

const ALLOWED_TARGETS = new Set([
  "listing_title",
  "listing_description",
  "profile_bio",
  "username",
  "comment",
  "review",
  "public_form",
  "report_text",
  "marketplace_content",
  "generic_public_text",
]);

function pickHighestSeverity(left: ModerationSeverity, right: ModerationSeverity): ModerationSeverity {
  return MODERATION_CONFIG.severityRank[left] >= MODERATION_CONFIG.severityRank[right] ? left : right;
}

function mostRestrictiveDecision(left: ModerationDecision, right: ModerationDecision): ModerationDecision {
  const rank: Record<ModerationDecision, number> = {
    allow: 0,
    flag: 1,
    review: 2,
    block: 3,
  };
  return rank[left] >= rank[right] ? left : right;
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function decisionFromReasonCodes(reasonCodes: ModerationReasonCode[], score: number): ModerationDecision {
  if (reasonCodes.some((code) => MODERATION_CONFIG.blockReasonCodes.has(code))) return "block";
  if (score >= MODERATION_CONFIG.thresholds.blockScore) return "block";
  if (reasonCodes.some((code) => MODERATION_CONFIG.reviewReasonCodes.has(code))) return "review";
  if (score >= MODERATION_CONFIG.thresholds.reviewScore) return "review";
  if (score >= MODERATION_CONFIG.thresholds.flagScore || reasonCodes.length > 0) return "flag";
  return "allow";
}

function buildUserMessage(decision: ModerationDecision, reasonCodes: ModerationReasonCode[]) {
  if (decision === "block") {
    if (
      reasonCodes.includes("PHONE_NUMBER_DETECTED") ||
      reasonCodes.includes("EMAIL_DETECTED") ||
      reasonCodes.includes("EXTERNAL_CONTACT") ||
      reasonCodes.includes("AI_OFF_PLATFORM_CONTACT_SIGNAL")
    ) {
      return MODERATION_CONFIG.decisionMessages.blockPartial;
    }
    return MODERATION_CONFIG.decisionMessages.block;
  }
  if (decision === "review") return MODERATION_CONFIG.decisionMessages.review;
  if (decision === "flag") return MODERATION_CONFIG.decisionMessages.flag;
  return MODERATION_CONFIG.decisionMessages.allow;
}

function isHardRuleBlock(reasonCodes: ModerationReasonCode[], ruleScore: number) {
  if (reasonCodes.some((code) => MODERATION_AI_CONFIG.hardRuleBlockReasonCodes.has(code))) {
    return true;
  }

  return ruleScore >= 90;
}

function pickLanguage(metadata: Record<string, unknown> | undefined): string | null {
  const language = metadata?.language;
  if (typeof language === "string" && language.trim()) return language.trim();
  return null;
}

function pickSafeAIMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!metadata) return {};

  const allowedKeys = new Set([
    "listingTitle",
    "listingCategory",
    "category",
    "source",
    "formType",
    "contentType",
    "locale",
    "language",
  ]);

  return Object.fromEntries(Object.entries(metadata).filter(([key]) => allowedKeys.has(key)));
}

export async function moderateContent(input: ModerationInput): Promise<ModerationResult> {
  const route = input.context?.pathname || null;

  if (!ALLOWED_TARGETS.has(input.targetType)) {
    const result: ModerationResult = {
      decision: "block",
      severity: "critical",
      score: 100,
      matchedRules: ["invalid_target_policy"],
      reasonCodes: [MODERATION_REASON_CODES.PUBLIC_CONTENT_POLICY_VIOLATION],
      sanitizedText: "",
      shouldBlock: true,
      shouldReview: false,
      shouldLog: true,
      skippedBecauseInbox: false,
      providerName: "none",
      route,
      userMessage: MODERATION_CONFIG.decisionMessages.block,
      ai: {
        invoked: false,
        providerName: "none",
        categories: [],
        confidence: 0,
        explanation: "invalid_target_policy",
        providerError: null,
        skippedBecauseInbox: false,
        skippedByPolicy: true,
        skippedReason: "target_not_enabled",
      },
    };
    await writeModerationAudit({ input, result });
    return result;
  }

  const skipDecision = shouldSkipModeration(input);
  if (skipDecision.skip) {
    const reasonCodes = unique([
      ...(skipDecision.reasonCode ? [skipDecision.reasonCode] : []),
      MODERATION_REASON_CODES.AI_SKIPPED_INBOX_ROUTE,
    ]);

    const result: ModerationResult = {
      decision: "allow",
      severity: "none",
      score: 0,
      matchedRules: [],
      reasonCodes,
      sanitizedText: String(input.text || ""),
      shouldBlock: false,
      shouldReview: false,
      shouldLog: true,
      skippedBecauseInbox: skipDecision.skippedBecauseInbox,
      providerName: "skipped",
      route,
      userMessage: MODERATION_CONFIG.decisionMessages.allow,
      ai: {
        invoked: false,
        providerName: "skipped",
        categories: [],
        confidence: 0,
        explanation: "ai_not_used_on_inbox_or_private_messages",
        providerError: null,
        skippedBecauseInbox: skipDecision.skippedBecauseInbox,
        skippedByPolicy: true,
        skippedReason: "inbox_route",
      },
    };
    await writeModerationAudit({ input, result });
    return result;
  }

  const ruleResult = evaluateRuleBasedModeration(input);
  const hardRuleBlock = isHardRuleBlock(ruleResult.reasonCodes, ruleResult.score);

  const aiExecution = await moderateWithAI(
    {
      targetType: input.targetType,
      text: input.text,
      route,
      language: pickLanguage(input.metadata),
      metadata: pickSafeAIMetadata(input.metadata),
      context: {
        isPrivateMessage: Boolean(input.context?.isPrivateMessage),
      },
    },
    {
      skipBecauseHardRuleBlock: hardRuleBlock,
    }
  );

  const aiResult = aiExecution.result;
  const score = Math.min(100, Math.max(ruleResult.score, aiResult.score));
  const reasonCodes = unique([...ruleResult.reasonCodes, ...aiResult.reasonCodes]);
  const matchedRules = unique([...ruleResult.matchedRules.map((match) => match.id), ...aiResult.categories.map((c) => `ai:${c}`)]);

  const decisionByReasonCode = decisionFromReasonCodes(reasonCodes, score);
  let decision = mostRestrictiveDecision(ruleResult.suggestedDecision, decisionByReasonCode);

  if (!hardRuleBlock) {
    decision = mostRestrictiveDecision(decision, aiResult.decision);

    if (decision === "block" && aiExecution.invoked && aiResult.confidence < MODERATION_AI_CONFIG.aiConfidenceThreshold) {
      decision = "review";
    }
  }

  const severity = pickHighestSeverity(ruleResult.severity, aiResult.severity);
  const userMessage = buildUserMessage(decision, reasonCodes);

  const result: ModerationResult = {
    decision,
    severity,
    score,
    matchedRules,
    reasonCodes,
    sanitizedText: aiResult.sanitizedText || ruleResult.sanitizedText,
    shouldBlock: decision === "block",
    shouldReview: decision === "review",
    shouldLog: true,
    skippedBecauseInbox: false,
    providerName: aiExecution.providerName,
    route,
    userMessage,
    ai: {
      invoked: aiExecution.invoked,
      providerName: aiExecution.providerName,
      categories: aiResult.categories,
      confidence: aiResult.confidence,
      explanation: aiResult.explanation,
      providerError: aiExecution.providerError,
      skippedBecauseInbox: aiExecution.skippedReason === "inbox_route",
      skippedByPolicy: !aiExecution.invoked,
      skippedReason: aiExecution.skippedReason,
    },
  };

  if (result.shouldLog) {
    await writeModerationAudit({ input, result });
  }

  return result;
}
