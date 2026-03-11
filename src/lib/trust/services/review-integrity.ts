import { createAdminClient } from "@/lib/supabase-admin";
import { REASON_CODES, type ReasonCode } from "@/lib/trust/reason-codes";
import { saveRiskEvent, upsertRiskSnapshot } from "@/lib/trust/services/trust-store";

type ReviewIntegrityInput = {
  reviewerId: string;
  revieweeId: string;
  referenceType: "deal" | "order" | "conversation";
  referenceId: string;
  isValidInteraction: boolean;
  reviewerAccountAgeHours: number;
  reviewerRiskScore: number;
  reviewBurstCountLast24h: number;
};

export async function evaluateReviewIntegrity(input: ReviewIntegrityInput) {
  const reasonCodes: ReasonCode[] = [];
  let riskScore = 0;

  if (!input.isValidInteraction) {
    riskScore += 35;
    reasonCodes.push(REASON_CODES.REVIEW_WITHOUT_VALID_INTERACTION);
  }

  if (input.reviewBurstCountLast24h >= 8) {
    riskScore += 28;
    reasonCodes.push(REASON_CODES.REVIEW_BURST_PATTERN);
  } else if (input.reviewBurstCountLast24h >= 4) {
    riskScore += 15;
    reasonCodes.push(REASON_CODES.REVIEW_BURST_PATTERN);
  }

  if (input.reviewerAccountAgeHours <= 72 || input.reviewerRiskScore >= 60) {
    riskScore += 15;
    reasonCodes.push(REASON_CODES.REVIEW_LOW_TRUST_WEIGHT);
  }

  riskScore = Math.min(100, riskScore);
  const level = riskScore >= 75 ? "critical" : riskScore >= 50 ? "high" : riskScore >= 25 ? "medium" : "low";

  const admin = createAdminClient();
  await admin.from("trust_review_integrity_events").insert({
    reviewer_id: input.reviewerId,
    reviewee_id: input.revieweeId,
    reference_type: input.referenceType,
    reference_id: input.referenceId,
    risk_score: riskScore,
    reason_codes: reasonCodes,
    metadata: {
      reviewBurstCountLast24h: input.reviewBurstCountLast24h,
      reviewerRiskScore: input.reviewerRiskScore,
      reviewerAccountAgeHours: input.reviewerAccountAgeHours,
      isValidInteraction: input.isValidInteraction,
    },
  });

  await Promise.all([
    upsertRiskSnapshot({
      entityType: "review",
      entityId: `${input.referenceType}:${input.referenceId}:${input.reviewerId}`,
      score: riskScore,
      level,
      reasonCodes,
      details: {
        revieweeId: input.revieweeId,
      },
    }),
    saveRiskEvent({
      entityType: "review",
      entityId: `${input.referenceType}:${input.referenceId}:${input.reviewerId}`,
      actorUserId: input.reviewerId,
      score: riskScore,
      level,
      reasonCodes,
      blocked: riskScore >= 75,
      action: riskScore >= 75 ? "BLOCK" : riskScore >= 50 ? "PENDING_REVIEW" : "ALLOW",
      details: {
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        revieweeId: input.revieweeId,
      },
    }),
  ]);

  return {
    riskScore,
    level,
    reasonCodes,
    shouldBlock: riskScore >= 75,
    shouldQueueReview: riskScore >= 50,
  };
}
