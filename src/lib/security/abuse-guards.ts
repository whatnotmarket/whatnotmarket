import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { evaluateAbuseSnapshot, type AbuseSnapshot } from "@/lib/security/abuse-scoring";

const ABUSE_RETRY_AFTER_SECONDS = 120;
const ABUSE_HASH_SALT = process.env.ABUSE_SIGNAL_SALT || "swaprmarket-abuse-v1";
const DEFAULT_ENDPOINT_GROUP = "generic";

export type AbuseGuardResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  riskScore: number;
  reason: string | null;
};

type AbuseEventRow = {
  user_id: string | null;
  action: string;
};

type EnforceAbuseGuardOptions = {
  request: Request;
  action: string;
  endpointGroup?: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

function nowIsoMinus(ms: number) {
  return new Date(Date.now() - ms).toISOString();
}

function getClientIp(req: Request) {
  const headersToCheck = ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"];
  for (const header of headersToCheck) {
    const raw = req.headers.get(header);
    if (!raw) continue;
    const first = raw.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

function getDeviceHint(req: Request) {
  const explicit =
    req.headers.get("x-device-id") ||
    req.headers.get("x-client-fingerprint") ||
    req.headers.get("x-device-fingerprint");
  if (explicit) return explicit.slice(0, 200);

  const ua = req.headers.get("user-agent") || "unknown-ua";
  const lang = req.headers.get("accept-language") || "unknown-lang";
  const platform = req.headers.get("sec-ch-ua-platform") || "unknown-platform";
  return `${ua}|${lang}|${platform}`.slice(0, 500);
}

function hashSignal(value: string) {
  return createHash("sha256").update(`${ABUSE_HASH_SALT}:${value}`).digest("hex");
}

function toUniqueCount<T>(rows: T[] | null | undefined, pick: (row: T) => string | null | undefined) {
  if (!rows || rows.length === 0) return 0;
  const set = new Set<string>();
  for (const row of rows) {
    const value = pick(row);
    if (value) set.add(value);
  }
  return set.size;
}

export async function enforceAbuseGuard({
  request,
  action,
  endpointGroup = DEFAULT_ENDPOINT_GROUP,
  userId = null,
  metadata = {},
}: EnforceAbuseGuardOptions): Promise<AbuseGuardResult> {
  const admin = createAdminClient();
  const ipHash = hashSignal(getClientIp(request));
  const deviceHash = hashSignal(getDeviceHint(request));
  const oneMinuteAgo = nowIsoMinus(60_000);
  const tenMinutesAgo = nowIsoMinus(10 * 60_000);
  const thirtyMinutesAgo = nowIsoMinus(30 * 60_000);
  const oneHourAgo = nowIsoMinus(60 * 60_000);

  let snapshot: AbuseSnapshot = {
    ipHitsLastMinute: 0,
    deviceHitsLastTenMinutes: 0,
    userHitsLastTenMinutes: 0,
    uniqueUsersOnIpLastHour: 0,
    uniqueUsersOnDeviceLastHour: 0,
    endpointFanoutLastTenMinutes: 0,
    blockedHitsLastThirtyMinutes: 0,
  };

  try {
    const [ipBurst, deviceBurst, userBurst, ipUsersRows, deviceUsersRows, fanoutRows, blockedRows] =
      await Promise.all([
        admin
          .from("security_abuse_events")
          .select("id", { count: "exact", head: true })
          .eq("ip_hash", ipHash)
          .gte("created_at", oneMinuteAgo),
        admin
          .from("security_abuse_events")
          .select("id", { count: "exact", head: true })
          .eq("device_hash", deviceHash)
          .gte("created_at", tenMinutesAgo),
        userId
          ? admin
              .from("security_abuse_events")
              .select("id", { count: "exact", head: true })
              .eq("user_id", userId)
              .gte("created_at", tenMinutesAgo)
          : Promise.resolve({ count: 0 } as { count: number | null }),
        admin
          .from("security_abuse_events")
          .select("user_id")
          .eq("ip_hash", ipHash)
          .not("user_id", "is", null)
          .gte("created_at", oneHourAgo)
          .limit(1000),
        admin
          .from("security_abuse_events")
          .select("user_id")
          .eq("device_hash", deviceHash)
          .not("user_id", "is", null)
          .gte("created_at", oneHourAgo)
          .limit(1000),
        userId
          ? admin
              .from("security_abuse_events")
              .select("action")
              .eq("user_id", userId)
              .gte("created_at", tenMinutesAgo)
              .limit(300)
          : admin
              .from("security_abuse_events")
              .select("action")
              .eq("ip_hash", ipHash)
              .gte("created_at", tenMinutesAgo)
              .limit(300),
        admin
          .from("security_abuse_events")
          .select("id", { count: "exact", head: true })
          .eq("ip_hash", ipHash)
          .eq("blocked", true)
          .gte("created_at", thirtyMinutesAgo),
      ]);

    snapshot = {
      ipHitsLastMinute: Number(ipBurst.count || 0),
      deviceHitsLastTenMinutes: Number(deviceBurst.count || 0),
      userHitsLastTenMinutes: Number(userBurst.count || 0),
      uniqueUsersOnIpLastHour: toUniqueCount(ipUsersRows.data, (row) => (row as { user_id?: string | null }).user_id),
      uniqueUsersOnDeviceLastHour: toUniqueCount(
        deviceUsersRows.data,
        (row) => (row as { user_id?: string | null }).user_id
      ),
      endpointFanoutLastTenMinutes: toUniqueCount(fanoutRows.data as AbuseEventRow[] | undefined, (row) => row.action),
      blockedHitsLastThirtyMinutes: Number(blockedRows.count || 0),
    };
  } catch (error) {
    console.error("[abuse-guard] snapshot fetch failed", error);
  }

  const decision = evaluateAbuseSnapshot(snapshot);

  try {
    await admin.from("security_abuse_events").insert({
      action,
      endpoint_group: endpointGroup,
      user_id: userId,
      ip_hash: ipHash,
      device_hash: deviceHash,
      blocked: decision.blocked,
      risk_score: decision.score,
      metadata: {
        ...metadata,
        snapshot,
      },
    });
  } catch (error) {
    console.error("[abuse-guard] event insert failed", error);
  }

  return {
    allowed: !decision.blocked,
    retryAfterSeconds: ABUSE_RETRY_AFTER_SECONDS,
    riskScore: decision.score,
    reason: decision.reason,
  };
}

export function AbuseGuardResponse(result: AbuseGuardResult) {
  const retryAfter = String(result.retryAfterSeconds || ABUSE_RETRY_AFTER_SECONDS);
  return NextResponse.json(
    {
      ok: false,
      error: "Too many suspicious requests",
      reason: result.reason || "Request blocked by abuse protection",
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfter,
        "X-Abuse-Risk-Score": String(result.riskScore || 0),
      },
    }
  );
}
