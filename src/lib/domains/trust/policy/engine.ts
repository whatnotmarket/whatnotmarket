import { TRUST_SAFETY_CONFIG } from "@/lib/domains/trust/config";
import type {
  ConversationPolicyDecision,
  ListingPolicyDecision,
  PolicyDecision,
  RiskScoreResult,
  TrustAccountFlag,
} from "@/lib/domains/trust/types";

function reasonSummaryFallback(score: number) {
  if (score >= 85) return "Rischio critico rilevato.";
  if (score >= 60) return "Rischio alto rilevato.";
  if (score >= 40) return "Attivita monitorata in modo restrittivo.";
  return "Nessuna limitazione aggiuntiva.";
}

export function evaluateUserRiskPolicy<TSignals extends Record<string, unknown>>(
  score: RiskScoreResult<TSignals>
): PolicyDecision {
  const thresholds = TRUST_SAFETY_CONFIG.policies.user;

  if (score.score >= thresholds.suspendAt) {
    return {
      action: "SUSPEND",
      blocked: true,
      requiresManualReview: true,
      requiresVerification: true,
      nextAccountFlag: "suspended",
      reasonCodes: score.reasonCodes,
      userMessage: "Account temporaneamente sospeso per sicurezza.",
      warningMessage: reasonSummaryFallback(score.score),
    };
  }

  if (score.score >= thresholds.reviewAt) {
    return {
      action: "PENDING_REVIEW",
      blocked: false,
      requiresManualReview: true,
      requiresVerification: true,
      nextAccountFlag: "under_review",
      reasonCodes: score.reasonCodes,
      userMessage: "Account in revisione sicurezza. Alcune funzioni sono limitate.",
      warningMessage: reasonSummaryFallback(score.score),
    };
  }

  if (score.score >= thresholds.limitAt) {
    return {
      action: "LIMIT_ACTION",
      blocked: false,
      requiresManualReview: false,
      requiresVerification: true,
      nextAccountFlag: "limited",
      reasonCodes: score.reasonCodes,
      userMessage: "Per motivi di sicurezza alcune azioni sono limitate.",
      warningMessage: reasonSummaryFallback(score.score),
    };
  }

  if (score.score >= thresholds.warnAt) {
    return {
      action: "ALLOW_WITH_WARNING",
      blocked: false,
      requiresManualReview: false,
      requiresVerification: false,
      nextAccountFlag: "limited",
      reasonCodes: score.reasonCodes,
      warningMessage: reasonSummaryFallback(score.score),
    };
  }

  return {
    action: "ALLOW",
    blocked: false,
    requiresManualReview: false,
    requiresVerification: false,
    nextAccountFlag: "trusted",
    reasonCodes: score.reasonCodes,
  };
}

export function evaluateListingRiskPolicy<TSignals extends Record<string, unknown>>(
  score: RiskScoreResult<TSignals>,
  accountFlag: TrustAccountFlag
): ListingPolicyDecision {
  const thresholds = TRUST_SAFETY_CONFIG.policies.listing;

  if (score.score >= thresholds.removedAt || accountFlag === "suspended") {
    return {
      action: "BLOCK",
      blocked: true,
      requiresManualReview: true,
      requiresVerification: true,
      reasonCodes: score.reasonCodes,
      listingSafetyStatus: "removed",
      visibilityState: "shadowed",
      userMessage: "Annuncio bloccato per rischio elevato.",
      warningMessage: reasonSummaryFallback(score.score),
      metadata: { score: score.score },
    };
  }

  if (score.score >= thresholds.restrictedAt || accountFlag === "under_review") {
    return {
      action: "SHADOW_LIMIT",
      blocked: false,
      requiresManualReview: true,
      requiresVerification: true,
      reasonCodes: score.reasonCodes,
      listingSafetyStatus: "restricted",
      visibilityState: "limited",
      userMessage: "Annuncio con visibilita ridotta fino a verifica.",
      warningMessage: reasonSummaryFallback(score.score),
      metadata: { score: score.score },
    };
  }

  if (score.score >= thresholds.pendingReviewAt || accountFlag === "limited") {
    return {
      action: "PENDING_REVIEW",
      blocked: false,
      requiresManualReview: true,
      requiresVerification: false,
      reasonCodes: score.reasonCodes,
      listingSafetyStatus: "pending_review",
      visibilityState: "limited",
      userMessage: "Annuncio in coda di verifica manuale.",
      warningMessage: reasonSummaryFallback(score.score),
      metadata: { score: score.score },
    };
  }

  if (score.score >= thresholds.warningAt) {
    return {
      action: "ALLOW_WITH_WARNING",
      blocked: false,
      requiresManualReview: false,
      requiresVerification: false,
      reasonCodes: score.reasonCodes,
      listingSafetyStatus: "published",
      visibilityState: "normal",
      warningMessage: reasonSummaryFallback(score.score),
      metadata: { score: score.score },
    };
  }

  return {
    action: "ALLOW",
    blocked: false,
    requiresManualReview: false,
    requiresVerification: false,
    reasonCodes: score.reasonCodes,
    listingSafetyStatus: "published",
    visibilityState: "normal",
    metadata: { score: score.score },
  };
}

export function evaluateConversationRiskPolicy<TSignals extends Record<string, unknown>>(
  score: RiskScoreResult<TSignals>,
  accountFlag: TrustAccountFlag
): ConversationPolicyDecision {
  const thresholds = TRUST_SAFETY_CONFIG.policies.conversation;

  if (score.score >= thresholds.hardBlockAt || accountFlag === "suspended") {
    return {
      action: "BLOCK",
      blocked: true,
      requiresManualReview: true,
      requiresVerification: true,
      reasonCodes: score.reasonCodes,
      moderationMode: "hard_block",
      redactionRequired: false,
      userMessage: "Messaggio bloccato per rischio elevato.",
      warningMessage: reasonSummaryFallback(score.score),
      metadata: { score: score.score },
    };
  }

  if (score.score >= thresholds.softBlockAt || accountFlag === "under_review") {
    return {
      action: "LIMIT_ACTION",
      blocked: true,
      requiresManualReview: true,
      requiresVerification: false,
      reasonCodes: score.reasonCodes,
      moderationMode: "soft_block",
      redactionRequired: true,
      userMessage: "Messaggio non inviato: rimuovi contatti esterni e richieste di pagamento fuori piattaforma.",
      warningMessage: reasonSummaryFallback(score.score),
      metadata: { score: score.score },
    };
  }

  if (score.score >= thresholds.warningAt || accountFlag === "limited") {
    return {
      action: "ALLOW_WITH_WARNING",
      blocked: false,
      requiresManualReview: false,
      requiresVerification: false,
      reasonCodes: score.reasonCodes,
      moderationMode: "warn",
      redactionRequired: false,
      warningMessage: "Non inviare caparre e non spostare la chat su canali esterni.",
      metadata: { score: score.score },
    };
  }

  return {
    action: "ALLOW",
    blocked: false,
    requiresManualReview: false,
    requiresVerification: false,
    reasonCodes: score.reasonCodes,
    moderationMode: "none",
    redactionRequired: false,
    metadata: { score: score.score },
  };
}

