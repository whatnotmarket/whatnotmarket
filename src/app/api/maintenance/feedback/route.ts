import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const feedbackSchema = z.object({
  message: z.string().trim().min(6).max(1000),
  page: z.string().trim().max(200).optional().default("/maintenance"),
});

function escapeHtml(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function rejectCrossOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const originHost = new URL(origin).host;
    const requestHost = new URL(request.url).host;
    return originHost !== requestHost;
  } catch {
    return true;
  }
}

function getClientIp(request: Request) {
  const direct = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip");
  if (direct) return direct.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function resolveTelegramToken() {
  return (
    process.env.TELEGRAM_MAINTENANCE_BOT_TOKEN?.trim() ||
    process.env.TELEGRAM_SECURITY_BOT_TOKEN?.trim() ||
    process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    ""
  );
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimitDetailed(request, { action: "maintenance_feedback" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  if (rejectCrossOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const token = resolveTelegramToken();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() || "";
  if (!token || !chatId) {
    const missing: string[] = [];
    if (!token) {
      missing.push(
        "TELEGRAM_MAINTENANCE_BOT_TOKEN (or TELEGRAM_SECURITY_BOT_TOKEN / TELEGRAM_BOT_TOKEN)"
      );
    }
    if (!chatId) {
      missing.push("TELEGRAM_CHAT_ID");
    }

    return NextResponse.json(
      {
        ok: false,
        error: `Maintenance feedback integration is not configured. Missing: ${missing.join(", ")}`,
      },
      { status: 503 }
    );
  }

  let parsed: z.infer<typeof feedbackSchema>;
  try {
    const body = await request.json();
    parsed = feedbackSchema.parse(body);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid feedback payload." }, { status: 400 });
  }

  const userAgent = String(request.headers.get("user-agent") || "unknown").slice(0, 220);
  const ip = getClientIp(request);
  const nowIso = new Date().toISOString();

  const textLines = [
    "\u{1F527} <b>Maintenance Feedback</b>",
    "",
    `<b>Message:</b>`,
    `<pre>${escapeHtml(parsed.message)}</pre>`,
    `<b>Page:</b> <code>${escapeHtml(parsed.page)}</code>`,
    `<b>IP:</b> <code>${escapeHtml(ip)}</code>`,
    `<b>User-Agent:</b> <code>${escapeHtml(userAgent)}</code>`,
    `<b>Time:</b> <code>${escapeHtml(nowIso)}</code>`,
  ];

  const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: textLines.join("\n"),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!telegramResponse.ok) {
    return NextResponse.json(
      { ok: false, error: `Telegram API error (${telegramResponse.status}).` },
      { status: 502 }
    );
  }

  const telegramPayload = (await telegramResponse.json().catch(() => null)) as
    | { ok?: boolean; description?: string }
    | null;

  if (!telegramPayload?.ok) {
    return NextResponse.json(
      { ok: false, error: telegramPayload?.description || "Telegram rejected the request." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, message: "Feedback sent. Thanks!" }, { status: 200 });
}
