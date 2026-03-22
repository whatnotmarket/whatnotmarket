import { TRUST_SAFETY_CONFIG } from "@/lib/domains/trust/config";
import { detectChatPatternSignals,redactExternalContact } from "@/lib/domains/trust/detection";
import { evaluateConversationRiskPolicy } from "@/lib/domains/trust/policy/engine";
import { calculateConversationRiskScore } from "@/lib/domains/trust/scoring/conversation-risk";
import { createModerationCase,getTrustAccountState,saveRiskEvent,upsertRiskSnapshot } from "@/lib/domains/trust/services/trust-store";
import type { ConversationPolicyDecision,ConversationRiskSignals,RiskScoreResult } from "@/lib/domains/trust/types";
import { normalizeWhitespace,toHoursFromNow } from "@/lib/domains/trust/utils";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";

type ProfileCreatedAtRow = {
  created_at: string;
};

type ChatSafetyInput = {
  senderId: string;
  conversationId: string;
  roomType: "direct_chat" | "global_chat";
  message: string;
  repeatedTemplateCountLast6h: number;
  massOutreachRecipientsLast6h: number;
};

export async function evaluateConversationMessageSafety(
  input: ChatSafetyInput
): Promise<{
  normalizedMessage: string;
  redactedMessage: string;
  signals: ConversationRiskSignals;
  score: RiskScoreResult<ConversationRiskSignals>;
  decision: ConversationPolicyDecision;
}> {
  const admin = createAdminClient();

  const [trustState, profileResp] = await Promise.all([
    getTrustAccountState(input.senderId),
    admin.from("profiles").select("created_at").eq("id", input.senderId).maybeSingle<ProfileCreatedAtRow>(),
  ]);

  const patternSignals = detectChatPatternSignals(input.message);
  const accountAgeHours = toHoursFromNow(profileResp.data?.created_at);

  const signals: ConversationRiskSignals = {
    senderAccountAgeHours: accountAgeHours,
    senderRiskScore: trustState.riskScore,
    containsExternalLink: patternSignals.containsExternalLink,
    containsEmail: patternSignals.containsEmail,
    containsPhone: patternSignals.containsPhone,
    containsExternalHandle: patternSignals.containsExternalHandle,
    offPlatformRedirectSignal: patternSignals.offPlatformRedirectSignal,
    depositOrAdvancePaymentSignal: patternSignals.depositOrAdvancePaymentSignal,
    urgencyManipulationSignal: patternSignals.urgencyManipulationSignal,
    phishingSignal: patternSignals.phishingSignal,
    repeatedTemplateCountLast6h: input.repeatedTemplateCountLast6h,
    massOutreachRecipientsLast6h: input.massOutreachRecipientsLast6h,
  };

  const score = calculateConversationRiskScore(signals);
  const decision = evaluateConversationRiskPolicy(score, trustState.accountFlag);

  const normalizedMessage = normalizeWhitespace(input.message);
  const forceRedactionForNewAccount =
    TRUST_SAFETY_CONFIG.onboarding.blockExternalContactsForNewAccounts &&
    accountAgeHours <= TRUST_SAFETY_CONFIG.onboarding.newAccountWindowHours &&
    patternSignals.externalContactCount > 0;

  const redactedMessage =
    decision.redactionRequired || forceRedactionForNewAccount
      ? redactExternalContact(normalizedMessage)
      : normalizedMessage;

  return {
    normalizedMessage,
    redactedMessage,
    signals,
    score,
    decision,
  };
}

export async function persistConversationSafetyDecision(params: {
  conversationId: string;
  senderId: string;
  roomType: "direct_chat" | "global_chat";
  score: RiskScoreResult<ConversationRiskSignals>;
  decision: ConversationPolicyDecision;
  signals: ConversationRiskSignals;
}) {
  const entityId = `${params.roomType}:${params.conversationId}`;
  await Promise.all([
    upsertRiskSnapshot({
      entityType: "conversation",
      entityId,
      score: params.score.score,
      level: params.score.level,
      reasonCodes: params.score.reasonCodes,
      details: {
        roomType: params.roomType,
        moderationMode: params.decision.moderationMode,
        signals: params.signals,
      },
    }),
    saveRiskEvent({
      entityType: "conversation",
      entityId,
      actorUserId: params.senderId,
      score: params.score.score,
      level: params.score.level,
      reasonCodes: params.score.reasonCodes,
      blocked: params.decision.blocked,
      action: params.decision.action,
      details: {
        roomType: params.roomType,
        moderationMode: params.decision.moderationMode,
        signals: params.signals,
      },
    }),
  ]);

  if (params.decision.requiresManualReview || params.decision.moderationMode === "hard_block") {
    await createModerationCase({
      entityType: "conversation",
      entityId,
      priority: params.score.level === "critical" ? 5 : params.score.level === "high" ? 4 : 3,
      riskScore: params.score.score,
      riskLevel: params.score.level,
      reasonCodes: params.score.reasonCodes,
      summary: "Conversation flagged by trust policy",
      notes: `Auto-created from chat moderation. Mode=${params.decision.moderationMode}`,
    });
  }
}

export async function collectConversationVelocitySignals(params: {
  senderId: string;
  normalizedMessage: string;
  roomType: "direct_chat" | "global_chat";
}) {
  const admin = createAdminClient();
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  if (params.roomType === "direct_chat") {
    const [sameTemplateResp, outreachResp] = await Promise.all([
      admin
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", params.senderId)
        .eq("content", params.normalizedMessage)
        .gte("created_at", sixHoursAgo),
      admin
        .from("chat_messages")
        .select("room_id")
        .eq("sender_id", params.senderId)
        .gte("created_at", sixHoursAgo),
    ]);

    const repeatedTemplateCountLast6h = Number(sameTemplateResp.count || 0);
    const uniqueRecipients = new Set((outreachResp.data || []).map((row) => row.room_id)).size;
    return {
      repeatedTemplateCountLast6h,
      massOutreachRecipientsLast6h: uniqueRecipients,
    };
  }

  const [sameTemplateResp, outreachResp] = await Promise.all([
    admin
      .from("global_chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", params.senderId)
      .eq("message_normalized", params.normalizedMessage.toLowerCase())
      .gte("created_at", sixHoursAgo),
    admin
      .from("global_chat_messages")
      .select("room")
      .eq("user_id", params.senderId)
      .gte("created_at", sixHoursAgo),
  ]);

  const repeatedTemplateCountLast6h = Number(sameTemplateResp.count || 0);
  const uniqueRecipients = new Set((outreachResp.data || []).map((row) => row.room)).size;
  return {
    repeatedTemplateCountLast6h,
    massOutreachRecipientsLast6h: uniqueRecipients,
  };
}

