import type { JobResult } from "./types";

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusMeta(status: JobResult["status"]) {
  if (status === "success") return { icon: "🟢", label: "SUCCESS" };
  if (status === "skipped") return { icon: "🟡", label: "SKIPPED" };
  return { icon: "🔴", label: "FAILURE" };
}

export function buildTelegramMessage(result: JobResult) {
  const status = statusMeta(result.status);
  const detailsJson =
    result.details && Object.keys(result.details).length > 0
      ? truncate(JSON.stringify(result.details, null, 2), 1400)
      : "";

  const timestamp = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(new Date());

  const lines = [
    `<b>${status.icon} CRON JOB: ${escapeHtml(result.jobName)}</b>`,
    `${status.icon} <b>Status:</b> ${status.label}`,
    "",
    "<b>Execution</b>",
    `⏱ <b>Duration:</b> ${result.metrics.duration}ms`,
    `📦 <b>Processed:</b> ${result.metrics.processed}`,
    `❌ <b>Failed:</b> ${result.metrics.failed}`,
    `⏭ <b>Skipped:</b> ${result.metrics.skipped}`,
    `⚠️ <b>Warnings:</b> ${result.metrics.warnings}`,
    `🧠 <b>Memory:</b> ${result.metrics.memoryMb.toFixed(2)} MB`,
    `💬 <b>Message:</b> ${escapeHtml(result.message)}`,
    `🕒 <b>Time:</b> ${escapeHtml(timestamp)} UTC`,
  ];

  if (typeof result.metrics.apiCallsRemaining === "number") {
    lines.push(`📉 <b>API calls remaining:</b> ${result.metrics.apiCallsRemaining}`);
  }

  if (result.error) {
    lines.push(`🚨 <b>Error:</b> ${escapeHtml(truncate(result.error.message, 500))}`);
  }

  if (detailsJson) {
    lines.push("");
    lines.push("<b>Details</b>");
    lines.push(`<pre>${escapeHtml(detailsJson)}</pre>`);
  }

  return lines.join("\n");
}

export async function sendTelegramNotification(result: JobResult): Promise<{
  sent: boolean;
  reason?: string;
}> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return {
      sent: false,
      reason: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID",
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: buildTelegramMessage(result),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    return {
      sent: false,
      reason: `Telegram API HTTP ${response.status}`,
    };
  }

  const payload = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!payload?.ok) {
    return {
      sent: false,
      reason: payload?.description || "Telegram API rejected the message",
    };
  }

  return { sent: true };
}
