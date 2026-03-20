import type { JobResult } from "./types";

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

export function buildTelegramMessage(result: JobResult) {
  const statusLabel = result.status === "success" ? "[OK]" : result.status === "skipped" ? "[SKIP]" : "[FAIL]";
  const lines = [
    `${statusLabel} CRON JOB: ${result.jobName}`,
    `STATUS: ${result.status.toUpperCase()}`,
    `Duration: ${result.metrics.duration}ms`,
    `Processed: ${result.metrics.processed}`,
    `Failed: ${result.metrics.failed}`,
    `Skipped: ${result.metrics.skipped}`,
    `Warnings: ${result.metrics.warnings}`,
    `Memory: ${result.metrics.memoryMb.toFixed(2)} MB`,
    `Message: ${result.message}`,
    `Time: ${new Date().toLocaleString("it-IT")}`,
  ];

  if (typeof result.metrics.apiCallsRemaining === "number") {
    lines.push(`API calls remaining: ${result.metrics.apiCallsRemaining}`);
  }

  if (result.error) {
    lines.push(`Error: ${result.error.message}`);
  }

  if (result.details && Object.keys(result.details).length > 0) {
    const detailsText = truncate(JSON.stringify(result.details), 1200);
    lines.push(`Details: ${detailsText}`);
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