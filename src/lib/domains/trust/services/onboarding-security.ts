import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { TRUST_SAFETY_CONFIG } from "@/lib/domains/trust/config";
import { getTrustAccountState } from "@/lib/domains/trust/services/trust-store";
import { toHoursFromNow } from "@/lib/domains/trust/utils";

type ActionGuardAction = "create_listing" | "send_message" | "create_offer";

export type ActionGuardDecision = {
  allowed: boolean;
  code: string | null;
  message: string | null;
};

type ProfileAgeRow = {
  created_at: string;
  email: string | null;
};

export async function enforceActionGuard(userId: string, action: ActionGuardAction): Promise<ActionGuardDecision> {
  const admin = createAdminClient();
  const [trustState, profileResp] = await Promise.all([
    getTrustAccountState(userId),
    admin.from("profiles").select("created_at,email").eq("id", userId).maybeSingle<ProfileAgeRow>(),
  ]);

  if (trustState.accountFlag === "suspended") {
    return {
      allowed: false,
      code: "ACCOUNT_SUSPENDED",
      message: "Account temporaneamente sospeso per motivi di sicurezza.",
    };
  }

  const accountAgeHours = toHoursFromNow(profileResp.data?.created_at);
  const isNewAccount = accountAgeHours <= TRUST_SAFETY_CONFIG.onboarding.newAccountWindowHours;

  if (!trustState.emailVerified && !profileResp.data?.email) {
    return {
      allowed: false,
      code: "EMAIL_VERIFICATION_REQUIRED",
      message: "Verifica l'email per continuare.",
    };
  }

  const now = Date.now();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  if (!isNewAccount) {
    return { allowed: true, code: null, message: null };
  }

  if (action === "create_listing") {
    const { count } = await admin
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("created_by", userId)
      .gte("created_at", oneDayAgo);

    if (Number(count || 0) >= TRUST_SAFETY_CONFIG.onboarding.dailyListingLimitForNewAccount) {
      return {
        allowed: false,
        code: "NEW_ACCOUNT_LISTING_LIMIT",
        message: "Account nuovo: limite annunci giornaliero raggiunto.",
      };
    }
  }

  if (action === "send_message") {
    const [privateCountResp, globalCountResp] = await Promise.all([
      admin.from("chat_messages").select("id", { count: "exact", head: true }).eq("sender_id", userId).gte("created_at", oneDayAgo),
      admin.from("global_chat_messages").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", oneDayAgo),
    ]);
    const total = Number(privateCountResp.count || 0) + Number(globalCountResp.count || 0);

    if (total >= TRUST_SAFETY_CONFIG.onboarding.dailyMessageLimitForNewAccount) {
      return {
        allowed: false,
        code: "NEW_ACCOUNT_MESSAGE_LIMIT",
        message: "Account nuovo: limite messaggi giornaliero raggiunto.",
      };
    }
  }

  if (action === "create_offer") {
    const { count } = await admin
      .from("offers")
      .select("id", { count: "exact", head: true })
      .eq("created_by", userId)
      .gte("created_at", oneDayAgo);

    if (Number(count || 0) >= TRUST_SAFETY_CONFIG.onboarding.dailyOfferLimitForNewAccount) {
      return {
        allowed: false,
        code: "NEW_ACCOUNT_OFFER_LIMIT",
        message: "Account nuovo: limite offerte giornaliero raggiunto.",
      };
    }
  }

  if (trustState.accountFlag === "under_review") {
    return {
      allowed: false,
      code: "UNDER_REVIEW_RESTRICTION",
      message: "Account in revisione sicurezza. Riprova piu tardi.",
    };
  }

  return {
    allowed: true,
    code: null,
    message: null,
  };
}

