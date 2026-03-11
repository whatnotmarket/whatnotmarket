import { createAdminClient } from "@/lib/supabase-admin";
import type { ReasonCode } from "@/lib/trust/reason-codes";
import type { RiskEntityType, RiskLevel, TrustAccountFlag, TrustAccountState } from "@/lib/trust/types";

type TrustAccountStateRow = {
  user_id: string;
  account_flag: TrustAccountFlag;
  trust_score: number;
  risk_score: number;
  risk_level: RiskLevel;
  kyc_status: "not_started" | "pending" | "verified" | "rejected";
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  restrictions: Record<string, unknown> | null;
  last_reason_codes: ReasonCode[] | null;
};

export async function getTrustAccountState(userId: string): Promise<TrustAccountState> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("trust_account_states")
    .select(
      "user_id,account_flag,trust_score,risk_score,risk_level,kyc_status,email_verified,phone_verified,identity_verified,restrictions,last_reason_codes"
    )
    .eq("user_id", userId)
    .maybeSingle<TrustAccountStateRow>();

  if (error) {
    return {
      userId,
      accountFlag: "limited",
      trustScore: 20,
      riskScore: 0,
      riskLevel: "medium",
      kycStatus: "not_started",
      emailVerified: false,
      phoneVerified: false,
      identityVerified: false,
      restrictions: {},
      lastReasonCodes: [],
    };
  }

  if (!data) {
    const fallback: TrustAccountState = {
      userId,
      accountFlag: "limited",
      trustScore: 20,
      riskScore: 0,
      riskLevel: "medium",
      kycStatus: "not_started",
      emailVerified: false,
      phoneVerified: false,
      identityVerified: false,
      restrictions: {},
      lastReasonCodes: [],
    };

    await upsertTrustAccountState(fallback).catch(() => {
      // Best-effort upsert; do not fail request pipeline.
    });
    return fallback;
  }

  return {
    userId: data.user_id,
    accountFlag: data.account_flag,
    trustScore: data.trust_score,
    riskScore: data.risk_score,
    riskLevel: data.risk_level,
    kycStatus: data.kyc_status,
    emailVerified: data.email_verified,
    phoneVerified: data.phone_verified,
    identityVerified: data.identity_verified,
    restrictions: data.restrictions || {},
    lastReasonCodes: data.last_reason_codes || [],
  };
}

export async function upsertTrustAccountState(state: TrustAccountState) {
  const admin = createAdminClient();
  await admin.from("trust_account_states").upsert(
    {
      user_id: state.userId,
      account_flag: state.accountFlag,
      trust_score: state.trustScore,
      risk_score: state.riskScore,
      risk_level: state.riskLevel,
      kyc_status: state.kycStatus,
      email_verified: state.emailVerified,
      phone_verified: state.phoneVerified,
      identity_verified: state.identityVerified,
      restrictions: state.restrictions,
      last_reason_codes: state.lastReasonCodes,
      trusted_since: state.accountFlag === "trusted" ? new Date().toISOString() : null,
    },
    { onConflict: "user_id" }
  );
}

export async function saveRiskEvent(params: {
  entityType: RiskEntityType;
  entityId: string;
  actorUserId?: string | null;
  score: number;
  level: RiskLevel;
  reasonCodes: ReasonCode[];
  blocked: boolean;
  action: string;
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("trust_risk_events").insert({
    entity_type: params.entityType,
    entity_id: params.entityId,
    actor_user_id: params.actorUserId || null,
    risk_score: params.score,
    risk_level: params.level,
    reason_codes: params.reasonCodes,
    blocked: params.blocked,
    action: params.action,
    details: params.details || {},
  });
}

export async function upsertRiskSnapshot(params: {
  entityType: RiskEntityType;
  entityId: string;
  score: number;
  level: RiskLevel;
  reasonCodes: ReasonCode[];
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("trust_risk_snapshots").upsert(
    {
      entity_type: params.entityType,
      entity_id: params.entityId,
      risk_score: params.score,
      risk_level: params.level,
      reason_codes: params.reasonCodes,
      details: params.details || {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entity_type,entity_id" }
  );
}

export async function createModerationCase(params: {
  sourceReportId?: string | null;
  entityType: RiskEntityType;
  entityId: string;
  priority: number;
  riskScore: number;
  riskLevel: RiskLevel;
  reasonCodes: ReasonCode[];
  summary: string;
  notes?: string | null;
}) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("trust_moderation_cases")
    .insert({
      source_report_id: params.sourceReportId || null,
      entity_type: params.entityType,
      entity_id: params.entityId,
      status: "open",
      priority: Math.max(1, Math.min(5, params.priority)),
      risk_score: params.riskScore,
      risk_level: params.riskLevel,
      reason_codes: params.reasonCodes,
      summary: params.summary,
      notes: params.notes || null,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  return data?.id ?? null;
}

export async function appendModerationAction(params: {
  caseId: string;
  actorUserId?: string | null;
  actionType: string;
  targetType?: string | null;
  targetId?: string | null;
  reasonCodes?: string[];
  notes?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("trust_moderation_actions").insert({
    case_id: params.caseId,
    actor_user_id: params.actorUserId || null,
    action_type: params.actionType,
    target_type: params.targetType || null,
    target_id: params.targetId || null,
    reason_codes: params.reasonCodes || [],
    notes: params.notes || null,
    metadata: params.metadata || {},
  });
}

export async function appendTrustAuditLog(params: {
  actorUserId?: string | null;
  eventType: string;
  targetType?: string | null;
  targetId?: string | null;
  reasonCodes?: string[];
  ipHash?: string | null;
  deviceHash?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("trust_audit_logs").insert({
    actor_user_id: params.actorUserId || null,
    event_type: params.eventType,
    target_type: params.targetType || null,
    target_id: params.targetId || null,
    reason_codes: params.reasonCodes || [],
    ip_hash: params.ipHash || null,
    device_hash: params.deviceHash || null,
    metadata: params.metadata || {},
  });
}
