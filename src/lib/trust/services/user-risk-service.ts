import { createAdminClient } from "@/lib/supabase-admin";
import { calculateUserRiskScore } from "@/lib/trust/scoring/user-risk";
import { evaluateUserRiskPolicy } from "@/lib/trust/policy/engine";
import { getTrustAccountState, saveRiskEvent, upsertRiskSnapshot, upsertTrustAccountState } from "@/lib/trust/services/trust-store";
import type { PolicyDecision, UserRiskSignals } from "@/lib/trust/types";
import { toHoursFromNow } from "@/lib/trust/utils";

type ProfileRiskRow = {
  id: string;
  created_at: string;
  account_status: string | null;
  updated_at: string | null;
};

type CountResult = {
  count: number | null;
};

export async function collectUserRiskSignals(userId: string): Promise<UserRiskSignals> {
  const admin = createAdminClient();

  const now = Date.now();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [profileResp, trustState, listingCountResp, messageCountResp, reportCountResp, blockedMsgResp, deviceRowsResp, securityEventsResp, abuseSignupResp, disputeResp, refundResp] =
    await Promise.all([
      admin.from("profiles").select("id,created_at,account_status,updated_at").eq("id", userId).maybeSingle<ProfileRiskRow>(),
      getTrustAccountState(userId),
      admin.from("requests").select("id", { count: "exact", head: true }).eq("created_by", userId).gte("created_at", oneDayAgo),
      Promise.all([
        admin.from("chat_messages").select("id", { count: "exact", head: true }).eq("sender_id", userId).gte("created_at", oneDayAgo),
        admin.from("global_chat_messages").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", oneDayAgo),
      ]),
      admin.from("trust_reports").select("id", { count: "exact", head: true }).eq("target_type", "user").eq("target_id", userId).gte("created_at", thirtyDaysAgo),
      admin.from("trust_risk_events").select("id", { count: "exact", head: true }).eq("entity_type", "conversation").eq("actor_user_id", userId).eq("blocked", true).gte("created_at", thirtyDaysAgo),
      admin.from("trust_device_signals").select("device_hash").eq("user_id", userId).gte("last_seen_at", thirtyDaysAgo),
      admin.from("trust_security_events").select("event_type,is_suspicious").eq("user_id", userId).gte("created_at", thirtyDaysAgo),
      admin.from("security_abuse_events").select("id", { count: "exact", head: true }).eq("action", "auth_wallet_verify").eq("blocked", true).gte("created_at", sevenDaysAgo),
      admin.from("deals").select("id,status", { count: "exact" }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).gte("created_at", thirtyDaysAgo),
      admin.from("payment_intents").select("id,status", { count: "exact" }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).gte("created_at", thirtyDaysAgo),
    ]);

  const profile = profileResp.data;
  const accountAgeHours = toHoursFromNow(profile?.created_at);
  const listingCount = Number(listingCountResp.count || 0);

  const privateMessagesCount = Number((messageCountResp[0] as CountResult).count || 0);
  const globalMessagesCount = Number((messageCountResp[1] as CountResult).count || 0);
  const messagesSentLast24h = privateMessagesCount + globalMessagesCount;

  const reportsReceivedLast30d = Number(reportCountResp.count || 0);
  const suspiciousConversationBlocksLast30d = Number(blockedMsgResp.count || 0);

  const uniqueDeviceCountLast30d = new Set((deviceRowsResp.data || []).map((row) => row.device_hash)).size;
  const suspiciousEvents = (securityEventsResp.data || []).filter((event) => event.is_suspicious);
  const anomalousLoginCountLast7d = suspiciousEvents.filter((event) => event.event_type === "auth_login").length;
  const geoDeviceMismatchCountLast30d = suspiciousEvents.filter((event) =>
    ["geo_mismatch", "impossible_travel"].includes(event.event_type)
  ).length;
  const vpnProxyTorEventsLast30d = suspiciousEvents.filter((event) => event.event_type === "vpn_proxy_tor").length;
  const signupAttemptsFromIpLast24h = Number(abuseSignupResp.count || 0);

  const dealRows = disputeResp.data || [];
  const dealTotal = dealRows.length || 0;
  const disputedDeals = dealRows.filter((deal) => deal.status === "cancelled").length;
  const disputeRate = dealTotal > 0 ? disputedDeals / dealTotal : 0;

  const paymentRows = refundResp.data || [];
  const paymentTotal = paymentRows.length || 0;
  const refunds = paymentRows.filter((payment) => payment.status === "refunded").length;
  const refundRate = paymentTotal > 0 ? refunds / paymentTotal : 0;

  const repeatOffender =
    profile?.account_status === "banned" ||
    profile?.account_status === "suspended" ||
    trustState.accountFlag === "suspended";

  return {
    accountAgeHours,
    emailVerified: trustState.emailVerified,
    phoneVerified: trustState.phoneVerified,
    kycVerified: trustState.kycStatus === "verified",
    uniqueDeviceCountLast30d,
    anomalousLoginCountLast7d,
    listingsCreatedLast24h: listingCount,
    messagesSentLast24h,
    reportsReceivedLast30d,
    suspiciousConversationBlocksLast30d,
    profileMutationsLast24h: profile?.updated_at ? (toHoursFromNow(profile.updated_at) <= 24 ? 1 : 0) : 0,
    geoDeviceMismatchCountLast30d,
    vpnProxyTorEventsLast30d,
    disputeRate,
    refundRate,
    signupAttemptsFromIpLast24h,
    multiAccountDeviceMatchesLast30d: Math.max(0, uniqueDeviceCountLast30d - 2),
    repeatOffender,
  };
}

export async function evaluateAndPersistUserRisk(userId: string): Promise<{
  signals: UserRiskSignals;
  score: ReturnType<typeof calculateUserRiskScore>;
  policy: PolicyDecision;
}> {
  const trustState = await getTrustAccountState(userId);
  const signals = await collectUserRiskSignals(userId);
  const score = calculateUserRiskScore(signals);
  const policy = evaluateUserRiskPolicy(score);

  const trustScore = Math.max(0, Math.min(100, 100 - score.score));

  await Promise.all([
    upsertRiskSnapshot({
      entityType: "user",
      entityId: userId,
      score: score.score,
      level: score.level,
      reasonCodes: score.reasonCodes,
      details: { signals, policyAction: policy.action },
    }),
    saveRiskEvent({
      entityType: "user",
      entityId: userId,
      actorUserId: userId,
      score: score.score,
      level: score.level,
      reasonCodes: score.reasonCodes,
      blocked: policy.blocked,
      action: policy.action,
      details: { signals, policy },
    }),
    upsertTrustAccountState({
      ...trustState,
      userId,
      riskScore: score.score,
      riskLevel: score.level,
      trustScore,
      accountFlag: policy.nextAccountFlag || trustState.accountFlag,
      lastReasonCodes: score.reasonCodes,
      restrictions: {
        ...(trustState.restrictions || {}),
        requiresVerification: policy.requiresVerification,
        requiresManualReview: policy.requiresManualReview,
      },
    }),
  ]);

  return { signals, score, policy };
}
