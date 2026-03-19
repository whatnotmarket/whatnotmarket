import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import {
  maintenanceEarlyAccessAutoReplyHtml,
  maintenanceEarlyAccessAutoReplyText,
} from "@/lib/email-templates/maintenance-early-access";
import {
  MAINTENANCE_RETRY_AFTER_SECONDS,
  createMaintenanceHeaders,
  isMaintenanceModeEnabled,
} from "@/lib/maintenance";
import { checkRateLimitDetailed } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const earlyAccessSchema = z.object({
  email: z.string().trim().email().max(320),
  website: z.string().trim().max(200).optional().default(""),
});

function maintenanceJson(body: unknown, status = 200) {
  const headers = createMaintenanceHeaders();
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new NextResponse(JSON.stringify(body), { status, headers });
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

function getResendClient() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function resolveFromEmail() {
  return process.env.RESEND_FROM_EMAIL?.trim() || "";
}

function resolveNotificationTarget() {
  return process.env.RESEND_EARLY_ACCESS_TO_EMAIL?.trim() || "support@openlymarket.xyz";
}

export async function OPTIONS() {
  const headers = createMaintenanceHeaders();
  headers.set("Allow", "POST, OPTIONS");
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimitDetailed(request, { action: "maintenance_early_access" });
  if (!rateLimit.allowed) {
    const response = maintenanceJson({ ok: false, error: "Too many requests" }, 429);
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    response.headers.set("X-RateLimit-Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  if (rejectCrossOrigin(request)) {
    return maintenanceJson({ ok: false, error: "Forbidden" }, 403);
  }

  const parsed = earlyAccessSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return maintenanceJson({ ok: false, error: "Invalid payload" }, 400);
  }

  const payload = parsed.data;

  // Honeypot field for basic bot filtering.
  if (payload.website) {
    return maintenanceJson({ ok: true, message: "You are on the list." }, 200);
  }

  const resend = getResendClient();
  const from = resolveFromEmail();
  const to = resolveNotificationTarget();

  if (!resend || !from) {
    return maintenanceJson(
      {
        ok: false,
        error: "Early access is temporarily unavailable. Please contact support@openlymarket.xyz.",
      },
      503
    );
  }

  const nowIso = new Date().toISOString();
  const userAgent = request.headers.get("user-agent") || "unknown";
  const maintenanceFlag = isMaintenanceModeEnabled() ? "ON" : "OFF";

  try {
    const autoReplyResult = await resend.emails.send({
      from,
      to: payload.email,
      subject: "Welcome to Openly!",
      html: maintenanceEarlyAccessAutoReplyHtml,
      text: maintenanceEarlyAccessAutoReplyText,
    });

    if (autoReplyResult.error) {
      console.error("maintenance early-access auto-reply error", autoReplyResult.error);
      return maintenanceJson(
        {
          ok: false,
          error: "Unable to send confirmation right now. Please try again shortly.",
          retryAfter: MAINTENANCE_RETRY_AFTER_SECONDS,
        },
        503
      );
    }

    const internalResult = await resend.emails.send({
      from,
      to,
      replyTo: payload.email,
      subject: `OpenlyMarket Early Access Request - ${payload.email}`,
      text: [
        "New early-access request submitted from maintenance page.",
        "",
        `Email: ${payload.email}`,
        `Submitted At (UTC): ${nowIso}`,
        `Maintenance Mode: ${maintenanceFlag}`,
        `User-Agent: ${userAgent}`,
        "",
        "Grant reduced buyer/seller transaction fee for this early user if eligible.",
      ].join("\n"),
    });

    if (internalResult.error) {
      console.error("maintenance early-access internal notify error", internalResult.error);
    }

    return maintenanceJson({ ok: true, message: "You are on the list." }, 200);
  } catch (error) {
    console.error("maintenance early-access submit error", error);
    return maintenanceJson(
      {
        ok: false,
        error: "Unable to submit right now. Please try again shortly.",
        retryAfter: MAINTENANCE_RETRY_AFTER_SECONDS,
      },
      503
    );
  }
}
