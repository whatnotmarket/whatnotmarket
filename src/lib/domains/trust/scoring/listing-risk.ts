import { REASON_CODES } from "@/lib/domains/trust/reason-codes";
import { TRUST_SAFETY_CONFIG, scoreToRiskLevel } from "@/lib/domains/trust/config";
import type { ListingRiskSignals, ReasonWeight, RiskScoreResult } from "@/lib/domains/trust/types";
import { addReason, clampScore, dedupeReasonCodes } from "@/lib/domains/trust/utils";

export function calculateListingRiskScore(signals: ListingRiskSignals): RiskScoreResult<ListingRiskSignals> {
  const reasons: ReasonWeight[] = [];

  if (signals.accountAgeHours <= TRUST_SAFETY_CONFIG.onboarding.strictWindowHours) {
    addReason(reasons, REASON_CODES.NEW_ACCOUNT_HIGH_ACTIVITY, 14, "Listing from very new account");
  }

  if (signals.priceDeviationPct !== null) {
    if (signals.priceDeviationPct <= -70) {
      addReason(reasons, REASON_CODES.SUSPICIOUS_PRICE_DEVIATION, 32);
    } else if (signals.priceDeviationPct <= -45) {
      addReason(reasons, REASON_CODES.SUSPICIOUS_PRICE_DEVIATION, 20);
    } else if (signals.priceDeviationPct <= -30) {
      addReason(reasons, REASON_CODES.SUSPICIOUS_PRICE_DEVIATION, 12);
    }
  }

  if (signals.hasExternalContact) {
    addReason(reasons, REASON_CODES.EXTERNAL_CONTACT_IN_LISTING, 24);
  }

  if (signals.requestsOffPlatformPayment) {
    addReason(reasons, REASON_CODES.OFF_PLATFORM_PAYMENT_REQUEST, 26);
  }

  if (signals.duplicateImageConfidence >= 0.9) {
    addReason(reasons, REASON_CODES.DUPLICATE_IMAGE_SIGNAL, 24);
  } else if (signals.duplicateImageConfidence >= 0.75) {
    addReason(reasons, REASON_CODES.DUPLICATE_IMAGE_SIGNAL, 14);
  }

  if (signals.duplicateTextSimilarity >= 0.9) {
    addReason(reasons, REASON_CODES.DUPLICATE_LISTING_TEMPLATE, 20);
  } else if (signals.duplicateTextSimilarity >= 0.75) {
    addReason(reasons, REASON_CODES.COPY_PASTE_DESCRIPTION_PATTERN, 12);
  }

  if (signals.listingVelocityLast24h >= 10) {
    addReason(reasons, REASON_CODES.HIGH_LISTING_VELOCITY, 20);
  } else if (signals.listingVelocityLast24h >= 5) {
    addReason(reasons, REASON_CODES.HIGH_LISTING_VELOCITY, 12);
  }

  if (signals.crossCityDuplicationSignal) {
    addReason(reasons, REASON_CODES.DUPLICATE_LISTING_TEMPLATE, 16, "Cross-city duplication pattern");
  }

  if (signals.suspiciousKeywordHits >= 3) {
    addReason(reasons, REASON_CODES.OFF_PLATFORM_PAYMENT_REQUEST, 18);
  } else if (signals.suspiciousKeywordHits >= 1) {
    addReason(reasons, REASON_CODES.OFF_PLATFORM_PAYMENT_REQUEST, 8);
  }

  if (signals.vagueDescriptionSignal || signals.textLength < 24) {
    addReason(reasons, REASON_CODES.COPY_PASTE_DESCRIPTION_PATTERN, 8);
  }

  const rawScore = reasons.reduce((sum, reason) => sum + reason.weight, 0);
  const score = clampScore(rawScore);
  const level = scoreToRiskLevel(score, TRUST_SAFETY_CONFIG.scoring.listing.riskLevels);

  return {
    entityType: "listing",
    score,
    level,
    reasons,
    reasonCodes: dedupeReasonCodes(reasons),
    signals,
  };
}

