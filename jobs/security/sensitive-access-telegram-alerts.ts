import { runJobWithLifecycle } from "../_shared/run-job";
import { requireJobsSupabaseAdminClient } from "../_shared/supabase";
import type { JobResult } from "../_shared/types";

type SensitiveAttemptRow = {
  id: string;
  created_at: string;
  route_path: string;
  request_method: string;
  ip_address: string;
  reason: string;
  metadata: Record<string, unknown> | null;
  notification_attempts: number;
};

const MAX_BATCH = 100;
const TELEGRAM_MAX_USER_AGENT = 180;
const TELEGRAM_MAX_REFERER = 220;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function normalizeString(value: unknown) {
  return String(value ?? "").trim();
}

function isSchemaMissingError(message: string) {
  const normalized = normalizeString(message).toLowerCase();
  return (
    (normalized.includes("could not find the table") && normalized.includes("schema cache")) ||
    (normalized.includes("relation") && normalized.includes("does not exist"))
  );
}

function buildAlertMessage(row: SensitiveAttemptRow) {
  const createdAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(row.created_at));

  const userAgent = truncate(normalizeString(row.metadata?.userAgent), TELEGRAM_MAX_USER_AGENT);
  const referer = truncate(normalizeString(row.metadata?.referer), TELEGRAM_MAX_REFERER);
  const host = normalizeString(row.metadata?.host);

  const lines = [
    "\u{1F6A8} <b>Sensitive Access Attempt</b>",
    `\u{1F9ED} <b>Path:</b> <code>${escapeHtml(normalizeString(row.route_path) || "unknown")}</code>`,
    `\u{1F310} <b>IP:</b> <code>${escapeHtml(normalizeString(row.ip_address) || "unknown")}</code>`,
    `\u{1F9F1} <b>Method:</b> <code>${escapeHtml(normalizeString(row.request_method) || "GET")}</code>`,
    `\u{1F4DD} <b>Reason:</b> <code>${escapeHtml(normalizeString(row.reason) || "unknown")}</code>`,
    `\u{1F552} <b>Time:</b> ${escapeHtml(createdAt)} UTC`,
  ];

  if (host) lines.push(`\u{1F3E0} <b>Host:</b> <code>${escapeHtml(host)}</code>`);
  if (referer) lines.push(`\u{21AA}\u{FE0F} <b>Referer:</b> <code>${escapeHtml(referer)}</code>`);
  if (userAgent) lines.push(`\u{1F9E9} <b>User-Agent:</b> <code>${escapeHtml(userAgent)}</code>`);

  return lines.join("\n");
}

async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_SECURITY_BOT_TOKEN?.trim() || process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) {
    throw new Error("Missing TELEGRAM_SECURITY_BOT_TOKEN (or TELEGRAM_BOT_TOKEN) or TELEGRAM_CHAT_ID.");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram API HTTP ${response.status}`);
  }

  const payload = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!payload?.ok) {
    throw new Error(payload?.description || "Telegram API rejected the message.");
  }
}

export async function executeJob(): Promise<JobResult> {
  return runJobWithLifecycle({
    jobName: "security/sensitive-access-telegram-alerts",
    leaseSeconds: 10 * 60,
    notifyOnComplete: false,
    execute: async () => {
      const admin = await requireJobsSupabaseAdminClient();
      const batchSize = Math.max(
        1,
        Math.min(Number(process.env.CRON_SENSITIVE_ACCESS_ALERT_BATCH || "30"), MAX_BATCH)
      );

      const queryResponse = await admin
        .from("security_sensitive_access_attempts")
        .select("id,created_at,route_path,request_method,ip_address,reason,metadata,notification_attempts")
        .is("notified_at", null)
        .order("created_at", { ascending: true })
        .limit(batchSize);

      const queryError = queryResponse.error as { message: string } | null;

      if (queryError) {
        if (isSchemaMissingError(queryError.message)) {
          throw new Error(
            "Table public.security_sensitive_access_attempts is missing. Apply migration 20260320223000_security_sensitive_access_attempts.sql."
          );
        }
        throw new Error(`Unable to query sensitive access attempts: ${queryError.message}`);
      }

      const attempts = (queryResponse.data || []) as SensitiveAttemptRow[];
      if (attempts.length === 0) {
        return {
          message: "No pending sensitive access attempts to alert.",
          details: {
            fetched: 0,
            sent: 0,
          },
          metrics: {
            processed: 0,
            skipped: 1,
          },
        };
      }

      let sent = 0;
      let failed = 0;
      const failures: string[] = [];

      for (const row of attempts) {
        const attemptCount = Number.isFinite(row.notification_attempts) ? row.notification_attempts : 0;
        try {
          await sendTelegramAlert(buildAlertMessage(row));
          const { error: updateError } = await admin
            .from("security_sensitive_access_attempts")
            .update({
              notified_at: new Date().toISOString(),
              notification_error: null,
              notification_attempts: attemptCount + 1,
            })
            .eq("id", row.id);

          if (updateError) {
            throw new Error(`Unable to mark attempt as notified (${row.id}): ${updateError.message}`);
          }

          sent += 1;
        } catch (error) {
          failed += 1;
          const message = error instanceof Error ? error.message : String(error);
          failures.push(`${row.route_path} (${row.ip_address}): ${message}`);

          await admin
            .from("security_sensitive_access_attempts")
            .update({
              notification_error: truncate(message, 900),
              notification_attempts: attemptCount + 1,
            })
            .eq("id", row.id)
            .catch(() => null);
        }
      }

      const { count: pendingCount } = await admin
        .from("security_sensitive_access_attempts")
        .select("*", { count: "exact", head: true })
        .is("notified_at", null);

      if (failed > 0) {
        throw new Error(
          `Failed to notify ${failed}/${attempts.length} sensitive access attempts. ${failures
            .slice(0, 3)
            .join(" | ")}`
        );
      }

      return {
        message: `Sensitive access alerts sent (${sent}).`,
        details: {
          fetched: attempts.length,
          sent,
          pending_after_run: Number(pendingCount || 0),
        },
        metrics: {
          processed: attempts.length,
          failed: 0,
          skipped: 0,
          warnings: 0,
        },
      };
    },
  });
}
