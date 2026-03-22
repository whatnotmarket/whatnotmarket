import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { REASON_CODES, type ReasonCode } from "@/lib/domains/trust/reason-codes";
import { appendTrustAuditLog, getTrustAccountState, upsertTrustAccountState } from "@/lib/domains/trust/services/trust-store";
import { getClientIp, getRequestDeviceHint, hashSignal } from "@/lib/domains/trust/utils";

type AuthSecurityDecision = {
  suspicious: boolean;
  reasonCodes: ReasonCode[];
  requiresStepUp: boolean;
};

export async function recordAuthSecurityEvent(params: {
  request: Request;
  userId: string;
  eventType: "auth_login" | "auth_signup" | "password_reset";
}) {
  const admin = createAdminClient();
  const ipHash = hashSignal(getClientIp(params.request));
  const deviceHash = hashSignal(getRequestDeviceHint(params.request));
  const userAgentHash = hashSignal(params.request.headers.get("user-agent") || "unknown");

  await admin.from("trust_security_events").insert({
    user_id: params.userId,
    event_type: params.eventType,
    ip_hash: ipHash,
    device_hash: deviceHash,
    user_agent_hash: userAgentHash,
    is_suspicious: false,
    reason_codes: [],
    metadata: {},
  });

  await admin.from("trust_device_signals").upsert(
    {
      user_id: params.userId,
      ip_hash: ipHash,
      device_hash: deviceHash,
      user_agent_hash: userAgentHash,
      last_seen_at: new Date().toISOString(),
      login_count: 1,
      metadata: {
        lastEventType: params.eventType,
      },
    },
    {
      onConflict: "user_id,device_hash,ip_hash",
    }
  );
}

export async function detectBanEvasionRisk(params: {
  request: Request;
  userId: string;
}): Promise<AuthSecurityDecision> {
  const admin = createAdminClient();
  const ipHash = hashSignal(getClientIp(params.request));
  const deviceHash = hashSignal(getRequestDeviceHint(params.request));
  const reasonCodes: ReasonCode[] = [];

  const [{ data: linkedDevices }, { data: flaggedAccounts }] = await Promise.all([
    admin.from("trust_device_signals").select("user_id").or(`device_hash.eq.${deviceHash},ip_hash.eq.${ipHash}`).limit(20),
    admin.from("trust_account_states").select("user_id,account_flag").in("account_flag", ["suspended", "under_review"]).limit(200),
  ]);

  const riskyUserIds = new Set((flaggedAccounts || []).map((row) => row.user_id));
  const hasMatchWithRisky =
    (linkedDevices || []).some((row) => row.user_id !== params.userId && riskyUserIds.has(row.user_id));

  if (hasMatchWithRisky) {
    reasonCodes.push(REASON_CODES.BAN_EVASION_LINKED_ACCOUNT);
  }

  const suspicious = reasonCodes.length > 0;
  if (suspicious) {
    await admin.from("trust_security_events").insert({
      user_id: params.userId,
      event_type: "ban_evasion_match",
      ip_hash: ipHash,
      device_hash: deviceHash,
      is_suspicious: true,
      reason_codes: reasonCodes,
      metadata: {},
    });

    const trustState = await getTrustAccountState(params.userId);
    await upsertTrustAccountState({
      ...trustState,
      accountFlag: trustState.accountFlag === "suspended" ? "suspended" : "under_review",
      riskScore: Math.max(trustState.riskScore, 70),
      riskLevel: "high",
      lastReasonCodes: Array.from(new Set([...(trustState.lastReasonCodes || []), ...reasonCodes])),
      restrictions: {
        ...(trustState.restrictions || {}),
        banEvasionWatch: true,
      },
    });
  }

  await appendTrustAuditLog({
    actorUserId: params.userId,
    eventType: "auth_security_evaluation",
    targetType: "account",
    targetId: params.userId,
    reasonCodes,
    ipHash,
    deviceHash,
    metadata: {
      suspicious,
      requiresStepUp: hasMatchWithRisky,
    },
  });

  return {
    suspicious,
    reasonCodes,
    requiresStepUp: hasMatchWithRisky,
  };
}

