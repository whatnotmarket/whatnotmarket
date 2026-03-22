import { TRUST_SAFETY_CONFIG,scoreToRiskLevel } from "@/lib/domains/trust/config";
import { REASON_CODES } from "@/lib/domains/trust/reason-codes";
import type { ConversationRiskSignals,ReasonWeight,RiskScoreResult } from "@/lib/domains/trust/types";
import { addReason,clampScore,dedupeReasonCodes } from "@/lib/domains/trust/utils";

export function calculateConversationRiskScore(
  signals: ConversationRiskSignals
): RiskScoreResult<ConversationRiskSignals> {
  const reasons: ReasonWeight[] = [];

  if (signals.senderAccountAgeHours <= TRUST_SAFETY_CONFIG.onboarding.strictWindowHours) {
    addReason(reasons, REASON_CODES.NEW_ACCOUNT_HIGH_ACTIVITY, 12);
  }

  if (signals.senderRiskScore >= 80) {
    addReason(reasons, REASON_CODES.REPEAT_OFFENDER_PATTERN, 24);
  } else if (signals.senderRiskScore >= 55) {
    addReason(reasons, REASON_CODES.REPEAT_OFFENDER_PATTERN, 12);
  }

  if (signals.containsExternalLink) {
    addReason(reasons, REASON_CODES.EXTERNAL_LINK_IN_CHAT, 18);
  }

  if (signals.containsEmail || signals.containsPhone || signals.containsExternalHandle) {
    addReason(reasons, REASON_CODES.EXTERNAL_CONTACT_IN_CHAT, 22);
  }

  if (signals.offPlatformRedirectSignal) {
    addReason(reasons, REASON_CODES.TELEGRAM_WHATSAPP_REDIRECT, 26);
  }

  if (signals.depositOrAdvancePaymentSignal) {
    addReason(reasons, REASON_CODES.DEPOSIT_REQUEST_SIGNAL, 24);
    addReason(reasons, REASON_CODES.OFF_PLATFORM_PAYMENT_REQUEST, 16);
  }

  if (signals.urgencyManipulationSignal) {
    addReason(reasons, REASON_CODES.URGENCY_MANIPULATION_SIGNAL, 12);
  }

  if (signals.phishingSignal) {
    addReason(reasons, REASON_CODES.CHAT_PHISHING_PATTERN, 28);
  }

  if (signals.repeatedTemplateCountLast6h >= 5) {
    addReason(reasons, REASON_CODES.REPEATED_SCAM_TEMPLATE, 20);
  } else if (signals.repeatedTemplateCountLast6h >= 3) {
    addReason(reasons, REASON_CODES.REPEATED_SCAM_TEMPLATE, 12);
  }

  if (signals.massOutreachRecipientsLast6h >= 10) {
    addReason(reasons, REASON_CODES.MASS_OUTREACH_PATTERN, 24);
  } else if (signals.massOutreachRecipientsLast6h >= 5) {
    addReason(reasons, REASON_CODES.MASS_OUTREACH_PATTERN, 14);
  }

  const rawScore = reasons.reduce((sum, reason) => sum + reason.weight, 0);
  const score = clampScore(rawScore);
  const level = scoreToRiskLevel(score, TRUST_SAFETY_CONFIG.scoring.conversation.riskLevels);

  return {
    entityType: "conversation",
    score,
    level,
    reasons,
    reasonCodes: dedupeReasonCodes(reasons),
    signals,
  };
}

