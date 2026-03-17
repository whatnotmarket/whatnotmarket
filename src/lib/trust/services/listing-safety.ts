import { createAdminClient } from "@/lib/supabase-admin";
import { detectListingPatternSignals } from "@/lib/trust/detection";
import { calculateListingRiskScore } from "@/lib/trust/scoring/listing-risk";
import { evaluateListingRiskPolicy } from "@/lib/trust/policy/engine";
import { createModerationCase, saveRiskEvent, upsertRiskSnapshot } from "@/lib/trust/services/trust-store";
import { getTrustAccountState } from "@/lib/trust/services/trust-store";
import type { ListingPolicyDecision, ListingRiskSignals, RiskScoreResult } from "@/lib/trust/types";
import { jaccardSimilarity, normalizeWhitespace } from "@/lib/trust/utils";

type ListingInput = {
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
};

type ExistingListingRow = {
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  budget_min: number | null;
  budget_max: number | null;
};

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

async function estimateCategoryMedianPrice(category: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("requests")
    .select("budget_min,budget_max")
    .eq("category", category)
    .eq("safety_status", "published")
    .order("created_at", { ascending: false })
    .limit(200);

  const values = (data || [])
    .map((row) => {
      const min = Number(row.budget_min || 0);
      const max = Number(row.budget_max || 0);
      if (min > 0 && max > 0) return (min + max) / 2;
      if (max > 0) return max;
      if (min > 0) return min;
      return null;
    })
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0);

  return median(values);
}

async function computeDuplicationSignals(userId: string, input: ListingInput) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("requests")
    .select("title,description,category,location,budget_min,budget_max")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = (data || []) as ExistingListingRow[];
  let highestSimilarity = 0;
  let crossCityDuplicationSignal = false;

  const incomingText = normalizeWhitespace(`${input.title} ${input.description}`);
  for (const row of rows) {
    const candidate = normalizeWhitespace(`${row.title} ${row.description || ""}`);
    const similarity = jaccardSimilarity(incomingText, candidate);
    highestSimilarity = Math.max(highestSimilarity, similarity);

    if (similarity >= 0.85 && row.category && row.category !== input.category) {
      crossCityDuplicationSignal = true;
    }
  }

  return {
    duplicateTextSimilarity: highestSimilarity,
    crossCityDuplicationSignal,
  };
}

export async function validateListingBeforePublish(input: {
  userId: string;
  listing: ListingInput;
  accountAgeHours: number;
  listingVelocityLast24h: number;
  duplicateImageConfidence?: number;
}): Promise<{
  signals: ListingRiskSignals;
  score: RiskScoreResult<ListingRiskSignals>;
  decision: ListingPolicyDecision;
}> {
  const baseSignals = detectListingPatternSignals({
    title: input.listing.title,
    description: input.listing.description,
  });

  const [medianPrice, duplicationSignals, trustState] = await Promise.all([
    estimateCategoryMedianPrice(input.listing.category),
    computeDuplicationSignals(input.userId, input.listing),
    getTrustAccountState(input.userId),
  ]);

  const listingPrice = input.listing.budgetMax > 0 ? input.listing.budgetMax : input.listing.budgetMin;
  const priceDeviationPct =
    medianPrice && listingPrice > 0 ? ((listingPrice - medianPrice) / medianPrice) * 100 : null;

  const signals: ListingRiskSignals = {
    accountAgeHours: input.accountAgeHours,
    textLength: normalizeWhitespace(input.listing.description).length,
    suspiciousKeywordHits: baseSignals.suspiciousKeywordHits,
    hasExternalContact: baseSignals.hasExternalContact,
    requestsOffPlatformPayment: baseSignals.requestsOffPlatformPayment,
    priceDeviationPct,
    duplicateImageConfidence: input.duplicateImageConfidence || 0,
    duplicateTextSimilarity: duplicationSignals.duplicateTextSimilarity,
    listingVelocityLast24h: input.listingVelocityLast24h,
    crossCityDuplicationSignal: duplicationSignals.crossCityDuplicationSignal,
    vagueDescriptionSignal: baseSignals.vagueDescriptionSignal,
  };

  const score = calculateListingRiskScore(signals);
  const decision = evaluateListingRiskPolicy(score, trustState.accountFlag);
  return { signals, score, decision };
}

export async function persistListingSafetyDecision(params: {
  listingId: string;
  userId: string;
  score: RiskScoreResult<ListingRiskSignals>;
  decision: ListingPolicyDecision;
  signals: ListingRiskSignals;
}) {
  await Promise.all([
    upsertRiskSnapshot({
      entityType: "listing",
      entityId: params.listingId,
      score: params.score.score,
      level: params.score.level,
      reasonCodes: params.score.reasonCodes,
      details: {
        decision: params.decision.action,
        listingSafetyStatus: params.decision.listingSafetyStatus,
        signals: params.signals,
      },
    }),
    saveRiskEvent({
      entityType: "listing",
      entityId: params.listingId,
      actorUserId: params.userId,
      score: params.score.score,
      level: params.score.level,
      reasonCodes: params.score.reasonCodes,
      blocked: params.decision.blocked,
      action: params.decision.action,
      details: {
        listingSafetyStatus: params.decision.listingSafetyStatus,
        visibilityState: params.decision.visibilityState,
        signals: params.signals,
      },
    }),
  ]);

  if (params.decision.requiresManualReview) {
    await createModerationCase({
      entityType: "listing",
      entityId: params.listingId,
      priority: params.score.level === "critical" ? 5 : params.score.level === "high" ? 4 : 3,
      riskScore: params.score.score,
      riskLevel: params.score.level,
      reasonCodes: params.score.reasonCodes,
      summary: "Listing flagged by trust policy",
      notes: `Auto-created from listing publish pipeline. Action=${params.decision.action}`,
    });
  }
}
