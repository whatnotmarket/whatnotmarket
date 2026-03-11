import { REASON_CODES } from "@/lib/trust/reason-codes";
import { TRUST_SAFETY_CONFIG, scoreToRiskLevel } from "@/lib/trust/config";
import type { ReasonWeight, RiskScoreResult, UserRiskSignals } from "@/lib/trust/types";
import { addReason, clampScore, dedupeReasonCodes } from "@/lib/trust/utils";

export function calculateUserRiskScore(signals: UserRiskSignals): RiskScoreResult<UserRiskSignals> {
  const reasons: ReasonWeight[] = [];

  if (signals.accountAgeHours <= TRUST_SAFETY_CONFIG.onboarding.strictWindowHours) {
    addReason(reasons, REASON_CODES.NEW_ACCOUNT_HIGH_ACTIVITY, 26, "Account under strict trust window");
  } else if (signals.accountAgeHours <= TRUST_SAFETY_CONFIG.onboarding.newAccountWindowHours) {
    addReason(reasons, REASON_CODES.NEW_ACCOUNT_HIGH_ACTIVITY, 14, "Account still in new account window");
  }

  if (!signals.emailVerified) {
    addReason(reasons, REASON_CODES.UNVERIFIED_EMAIL, 12);
  }

  if (!signals.phoneVerified) {
    addReason(reasons, REASON_CODES.UNVERIFIED_PHONE, 10);
  }

  if (signals.uniqueDeviceCountLast30d >= 5) {
    addReason(reasons, REASON_CODES.EXCESSIVE_DEVICE_COUNT, 18);
  } else if (signals.uniqueDeviceCountLast30d >= 3) {
    addReason(reasons, REASON_CODES.EXCESSIVE_DEVICE_COUNT, 10);
  }

  if (signals.anomalousLoginCountLast7d >= 3) {
    addReason(reasons, REASON_CODES.LOGIN_ANOMALY, 16);
  } else if (signals.anomalousLoginCountLast7d >= 1) {
    addReason(reasons, REASON_CODES.LOGIN_ANOMALY, 8);
  }

  if (signals.listingsCreatedLast24h >= 8) {
    addReason(reasons, REASON_CODES.HIGH_LISTING_VELOCITY, 20);
  } else if (signals.listingsCreatedLast24h >= 4) {
    addReason(reasons, REASON_CODES.HIGH_LISTING_VELOCITY, 12);
  }

  if (signals.messagesSentLast24h >= 100) {
    addReason(reasons, REASON_CODES.HIGH_MESSAGE_VELOCITY, 18);
  } else if (signals.messagesSentLast24h >= 60) {
    addReason(reasons, REASON_CODES.HIGH_MESSAGE_VELOCITY, 10);
  }

  if (signals.reportsReceivedLast30d >= 5) {
    addReason(reasons, REASON_CODES.HIGH_REPORT_RATE, 24);
  } else if (signals.reportsReceivedLast30d >= 2) {
    addReason(reasons, REASON_CODES.HIGH_REPORT_RATE, 12);
  }

  if (signals.suspiciousConversationBlocksLast30d >= 6) {
    addReason(reasons, REASON_CODES.HIGH_BLOCK_RATE, 16);
  } else if (signals.suspiciousConversationBlocksLast30d >= 3) {
    addReason(reasons, REASON_CODES.HIGH_BLOCK_RATE, 8);
  }

  if (signals.profileMutationsLast24h >= 8) {
    addReason(reasons, REASON_CODES.RAPID_PROFILE_MUTATION, 14);
  } else if (signals.profileMutationsLast24h >= 4) {
    addReason(reasons, REASON_CODES.RAPID_PROFILE_MUTATION, 8);
  }

  if (signals.geoDeviceMismatchCountLast30d >= 3) {
    addReason(reasons, REASON_CODES.GEO_DEVICE_MISMATCH, 14);
  }

  if (signals.vpnProxyTorEventsLast30d >= 2) {
    addReason(reasons, REASON_CODES.VPN_PROXY_TOR_SIGNAL, 15);
  } else if (signals.vpnProxyTorEventsLast30d >= 1) {
    addReason(reasons, REASON_CODES.VPN_PROXY_TOR_SIGNAL, 8);
  }

  if (signals.disputeRate >= 0.3 || signals.refundRate >= 0.3) {
    addReason(reasons, REASON_CODES.DISPUTE_HISTORY_SPIKE, 18);
  } else if (signals.disputeRate >= 0.15 || signals.refundRate >= 0.15) {
    addReason(reasons, REASON_CODES.DISPUTE_HISTORY_SPIKE, 10);
  }

  if (!signals.kycVerified && signals.listingsCreatedLast24h >= 4) {
    addReason(reasons, REASON_CODES.KYC_REQUIRED_FOR_VOLUME, 15);
  }

  if (signals.signupAttemptsFromIpLast24h >= 6) {
    addReason(reasons, REASON_CODES.EXCESSIVE_SIGNUP_ATTEMPTS, 18);
  } else if (signals.signupAttemptsFromIpLast24h >= 3) {
    addReason(reasons, REASON_CODES.EXCESSIVE_SIGNUP_ATTEMPTS, 10);
  }

  if (signals.multiAccountDeviceMatchesLast30d >= 3) {
    addReason(reasons, REASON_CODES.MULTI_ACCOUNT_DEVICE_MATCH, 26);
  } else if (signals.multiAccountDeviceMatchesLast30d >= 1) {
    addReason(reasons, REASON_CODES.MULTI_ACCOUNT_DEVICE_MATCH, 14);
  }

  if (signals.repeatOffender) {
    addReason(reasons, REASON_CODES.REPEAT_OFFENDER_PATTERN, 28);
  }

  const rawScore = reasons.reduce((sum, reason) => sum + reason.weight, 0);
  const score = clampScore(rawScore);
  const level = scoreToRiskLevel(score, TRUST_SAFETY_CONFIG.scoring.user.riskLevels);

  return {
    entityType: "user",
    score,
    level,
    reasons,
    reasonCodes: dedupeReasonCodes(reasons),
    signals,
  };
}
