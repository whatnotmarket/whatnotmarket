import { createAdminClient } from "@/lib/supabase-admin";
import { REASON_CODES, type ReasonCode } from "@/lib/trust/reason-codes";
import { getClientIp, getRequestDeviceHint, hashSignal } from "@/lib/trust/utils";

type AuthAbuseAction = "signup" | "signin" | "password_reset";

export type AuthAbuseDecision = {
  allowed: boolean;
  requiresChallenge: boolean;
  reasonCodes: ReasonCode[];
  retryAfterSeconds: number;
};

export async function enforceAuthAbuseMiddleware(params: {
  request: Request;
  action: AuthAbuseAction;
  userId?: string | null;
}): Promise<AuthAbuseDecision> {
  const admin = createAdminClient();
  const ipHash = hashSignal(getClientIp(params.request));
  const deviceHash = hashSignal(getRequestDeviceHint(params.request));
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [ipAttemptsResp, deviceAttemptsResp, blockedAttemptsResp] = await Promise.all([
    admin
      .from("security_abuse_events")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", oneHourAgo),
    admin
      .from("security_abuse_events")
      .select("id", { count: "exact", head: true })
      .eq("device_hash", deviceHash)
      .gte("created_at", oneHourAgo),
    admin
      .from("security_abuse_events")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .eq("blocked", true)
      .gte("created_at", oneHourAgo),
  ]);

  const ipAttempts = Number(ipAttemptsResp.count || 0);
  const deviceAttempts = Number(deviceAttemptsResp.count || 0);
  const blockedAttempts = Number(blockedAttemptsResp.count || 0);

  const reasonCodes: ReasonCode[] = [];
  if (ipAttempts >= 30 || deviceAttempts >= 30) {
    reasonCodes.push(REASON_CODES.EXCESSIVE_SIGNUP_ATTEMPTS);
  }
  if (blockedAttempts >= 6) {
    reasonCodes.push(REASON_CODES.ABUSE_GUARD_TRIGGERED);
  }
  if (params.action === "password_reset" && (ipAttempts >= 12 || deviceAttempts >= 12)) {
    reasonCodes.push(REASON_CODES.EXCESSIVE_PASSWORD_RESET_ATTEMPTS);
  }

  const allowed = blockedAttempts < 12 && ipAttempts < 60 && deviceAttempts < 60;
  const requiresChallenge = reasonCodes.length > 0 || ipAttempts >= 20 || deviceAttempts >= 20;

  return {
    allowed,
    requiresChallenge,
    reasonCodes,
    retryAfterSeconds: allowed ? 0 : 120,
  };
}
