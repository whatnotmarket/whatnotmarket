import type { ReasonCode } from "@/lib/domains/trust/reason-codes";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type RiskEntityType = "user" | "listing" | "conversation" | "review" | "account";

export type ReasonWeight = {
  code: ReasonCode;
  weight: number;
  detail?: string;
};

export type RiskScoreResult<TSignals extends Record<string, unknown>> = {
  entityType: RiskEntityType;
  entityId?: string;
  score: number;
  level: RiskLevel;
  reasons: ReasonWeight[];
  reasonCodes: ReasonCode[];
  signals: TSignals;
};

export type UserRiskSignals = {
  accountAgeHours: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycVerified: boolean;
  uniqueDeviceCountLast30d: number;
  anomalousLoginCountLast7d: number;
  listingsCreatedLast24h: number;
  messagesSentLast24h: number;
  reportsReceivedLast30d: number;
  suspiciousConversationBlocksLast30d: number;
  profileMutationsLast24h: number;
  geoDeviceMismatchCountLast30d: number;
  vpnProxyTorEventsLast30d: number;
  disputeRate: number;
  refundRate: number;
  signupAttemptsFromIpLast24h: number;
  multiAccountDeviceMatchesLast30d: number;
  repeatOffender: boolean;
};

export type ListingRiskSignals = {
  accountAgeHours: number;
  textLength: number;
  suspiciousKeywordHits: number;
  hasExternalContact: boolean;
  requestsOffPlatformPayment: boolean;
  priceDeviationPct: number | null;
  duplicateImageConfidence: number;
  duplicateTextSimilarity: number;
  listingVelocityLast24h: number;
  crossCityDuplicationSignal: boolean;
  vagueDescriptionSignal: boolean;
};

export type ConversationRiskSignals = {
  senderAccountAgeHours: number;
  senderRiskScore: number;
  containsExternalLink: boolean;
  containsEmail: boolean;
  containsPhone: boolean;
  containsExternalHandle: boolean;
  offPlatformRedirectSignal: boolean;
  depositOrAdvancePaymentSignal: boolean;
  urgencyManipulationSignal: boolean;
  phishingSignal: boolean;
  repeatedTemplateCountLast6h: number;
  massOutreachRecipientsLast6h: number;
};

export type TrustAccountFlag = "trusted" | "limited" | "under_review" | "suspended";

export type TrustAccountState = {
  userId: string;
  accountFlag: TrustAccountFlag;
  trustScore: number;
  riskScore: number;
  riskLevel: RiskLevel;
  kycStatus: "not_started" | "pending" | "verified" | "rejected";
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  restrictions: Record<string, unknown>;
  lastReasonCodes: ReasonCode[];
};

export type PolicyAction =
  | "ALLOW"
  | "ALLOW_WITH_WARNING"
  | "LIMIT_ACTION"
  | "REQUIRE_STEP_UP_VERIFICATION"
  | "PENDING_REVIEW"
  | "SHADOW_LIMIT"
  | "BLOCK"
  | "SUSPEND";

export type PolicyDecision = {
  action: PolicyAction;
  blocked: boolean;
  requiresManualReview: boolean;
  requiresVerification: boolean;
  nextAccountFlag?: TrustAccountFlag;
  reasonCodes: ReasonCode[];
  warningMessage?: string;
  userMessage?: string;
  metadata?: Record<string, unknown>;
};

export type ListingSafetyStatus = "draft" | "pending_review" | "published" | "restricted" | "removed";

export type ListingPolicyDecision = PolicyDecision & {
  listingSafetyStatus: ListingSafetyStatus;
  visibilityState: "normal" | "limited" | "shadowed";
};

export type ConversationPolicyDecision = PolicyDecision & {
  moderationMode: "none" | "warn" | "soft_block" | "hard_block";
  redactionRequired: boolean;
};

