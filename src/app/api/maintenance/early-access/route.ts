import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createAdminClient } from "@/lib/supabase-admin";
import { normalizeEmail as normalizeEmailAddress } from "@/utils/emailNormalizer";
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

const EMAIL_ALREADY_REGISTERED_MESSAGE = "This email is already in early access.";
const DISPOSABLE_EMAIL_MESSAGE = "We don't accept disposable E-mail";
const DISPOSABLE_BLOCKLIST_PATH = resolve(
  process.cwd(),
  "src/app/maintenance/disposable_email_blocklist.conf"
);
const ALLOWLIST_PATH = resolve(process.cwd(), "src/app/maintenance/allowlist.conf");
const EMAIL_PATTERN_BLOCKLIST_PATH = resolve(
  process.cwd(),
  "src/app/maintenance/email_pattern_blocklist.conf"
);

const earlyAccessSchema = z.object({
  email: z.string().trim().email().max(320),
  website: z.string().trim().max(200).optional().default(""),
});

type LeadStatus = "pending" | "confirmed" | "email_failed";

type EarlyAccessLeadRow = {
  id: string;
  email: string;
  email_normalized: string;
  status: LeadStatus;
  created_at: string;
};

function parseDomainList(content: string) {
  const domains = new Set<string>();
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const candidate = line.trim().toLowerCase();
    if (!candidate || candidate.startsWith("#")) continue;

    const normalized = normalizeDomain(candidate);
    if (!normalized) continue;
    domains.add(normalized);
  }

  return domains;
}

function loadDomainSet(filePath: string) {
  try {
    const content = readFileSync(filePath, "utf8");
    return parseDomainList(content);
  } catch (error) {
    console.error(`failed to read domain list: ${filePath}`, error);
    return new Set<string>();
  }
}

const DISPOSABLE_DOMAIN_BLOCKLIST = loadDomainSet(DISPOSABLE_BLOCKLIST_PATH);
const EMAIL_ALLOWLIST = loadDomainSet(ALLOWLIST_PATH);

function parseRegexList(content: string) {
  const patterns: RegExp[] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const candidate = line.trim();
    if (!candidate || candidate.startsWith("#")) continue;
    try {
      patterns.push(new RegExp(candidate, "i"));
    } catch (error) {
      console.error("invalid email pattern rule ignored", { candidate, error });
    }
  }

  return patterns;
}

function loadRegexSet(filePath: string) {
  try {
    const content = readFileSync(filePath, "utf8");
    return parseRegexList(content);
  } catch (error) {
    console.error(`failed to read regex rules: ${filePath}`, error);
    return [] as RegExp[];
  }
}

const EMAIL_PATTERN_BLOCKLIST = loadRegexSet(EMAIL_PATTERN_BLOCKLIST_PATH);

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

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^@+/, "").replace(/\.+$/, "");
}

function getEmailDomain(email: string) {
  const atIndex = email.lastIndexOf("@");
  if (atIndex <= 0 || atIndex >= email.length - 1) {
    return "";
  }
  return normalizeDomain(email.slice(atIndex + 1));
}

function isDomainAllowed(domain: string) {
  const labels = domain.split(".").filter(Boolean);
  for (let i = 0; i < labels.length - 1; i += 1) {
    const candidate = labels.slice(i).join(".");
    if (EMAIL_ALLOWLIST.has(candidate)) {
      return true;
    }
  }
  return false;
}

function isDomainBlocked(domain: string) {
  const labels = domain.split(".").filter(Boolean);
  for (let i = 0; i < labels.length - 1; i += 1) {
    const candidate = labels.slice(i).join(".");
    if (DISPOSABLE_DOMAIN_BLOCKLIST.has(candidate)) {
      return true;
    }
  }
  return false;
}

function isDisposableEmail(normalizedEmail: string) {
  const domain = getEmailDomain(normalizedEmail);
  if (!domain) return false;
  if (isDomainAllowed(domain)) return false;
  return isDomainBlocked(domain);
}

function hasInvalidEmailShape(normalizedEmail: string) {
  const atIndex = normalizedEmail.lastIndexOf("@");
  if (atIndex <= 0 || atIndex >= normalizedEmail.length - 1) {
    return true;
  }

  const local = normalizedEmail.slice(0, atIndex);
  const domain = normalizedEmail.slice(atIndex + 1);

  if (local.length > 64 || domain.length > 253) return true;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return true;
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return true;
  if (!domain.includes(".")) return true;

  const labels = domain.split(".");
  for (const label of labels) {
    if (!label || label.length > 63) return true;
    if (label.startsWith("-") || label.endsWith("-")) return true;
    if (!/^[a-z0-9-]+$/i.test(label)) return true;
  }

  const tld = labels[labels.length - 1];
  if (!/^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i.test(tld)) {
    return true;
  }

  return false;
}

function matchesBlockedEmailPattern(normalizedEmail: string) {
  for (const pattern of EMAIL_PATTERN_BLOCKLIST) {
    if (pattern.test(normalizedEmail)) {
      return true;
    }
  }
  return false;
}

function getClientIp(request: Request) {
  const direct = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip");
  if (direct) return direct.trim();
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) return "unknown";
  return forwardedFor.split(",")[0]?.trim() || "unknown";
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  return "code" in error && String((error as { code?: string }).code) === "23505";
}

async function getOrCreateLead({
  request,
  rawEmail,
  normalizedEmail,
}: {
  request: Request;
  rawEmail: string;
  normalizedEmail: string;
}): Promise<
  | { ok: true; lead: EarlyAccessLeadRow }
  | { ok: false; status: number; error: string }
> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      status: 503,
      error: "Early access service is temporarily unavailable.",
    };
  }

  const { data: existing, error: selectError } = await admin
    .from("maintenance_early_access_leads")
    .select("id,email,email_normalized,status,created_at")
    .eq("email_normalized", normalizedEmail)
    .maybeSingle<EarlyAccessLeadRow>();

  if (selectError) {
    return { ok: false, status: 503, error: "Unable to process the request right now." };
  }

  if (existing && existing.status !== "email_failed") {
    return { ok: false, status: 409, error: EMAIL_ALREADY_REGISTERED_MESSAGE };
  }

  if (existing && existing.status === "email_failed") {
    return { ok: true, lead: existing };
  }

  const metadata = {
    userAgent: request.headers.get("user-agent") || "unknown",
    ip: getClientIp(request),
  };

  const { data: created, error: insertError } = await admin
    .from("maintenance_early_access_leads")
    .insert({
      email: rawEmail,
      email_normalized: normalizedEmail,
      source: "maintenance_page",
      status: "pending",
      metadata,
      updated_at: new Date().toISOString(),
    })
    .select("id,email,email_normalized,status,created_at")
    .single<EarlyAccessLeadRow>();

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      return { ok: false, status: 409, error: EMAIL_ALREADY_REGISTERED_MESSAGE };
    }
    return { ok: false, status: 503, error: "Unable to process the request right now." };
  }

  return { ok: true, lead: created };
}

async function updateLeadStatus(leadId: string, status: LeadStatus, lastError: string | null) {
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const payload: {
      status: LeadStatus;
      updated_at: string;
      last_error: string | null;
      confirmed_at?: string;
    } = {
      status,
      updated_at: now,
      last_error: lastError,
    };
    if (status === "confirmed") {
      payload.confirmed_at = now;
    }

    await admin
      .from("maintenance_early_access_leads")
      .update(payload)
      .eq("id", leadId);
  } catch (error) {
    console.error("maintenance early-access lead status update failed", error);
  }
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
    return maintenanceJson({ ok: false, error: "Please enter a valid email address." }, 400);
  }

  const payload = parsed.data;
  const rawEmail = payload.email.trim();
  const normalizedEmailData = normalizeEmailAddress(rawEmail);
  const normalizedEmail = normalizedEmailData.normalized;

  // Honeypot field for basic bot filtering.
  if (payload.website) {
    return maintenanceJson({ ok: true, message: "You are on the list." }, 200);
  }

  if (hasInvalidEmailShape(normalizedEmail) || matchesBlockedEmailPattern(normalizedEmail)) {
    return maintenanceJson({ ok: false, error: "Please enter a valid email address." }, 400);
  }

  if (isDisposableEmail(normalizedEmail)) {
    return maintenanceJson({ ok: false, error: DISPOSABLE_EMAIL_MESSAGE }, 400);
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

  const leadResult = await getOrCreateLead({
    request,
    rawEmail,
    normalizedEmail,
  });

  if (!leadResult.ok) {
    return maintenanceJson({ ok: false, error: leadResult.error }, leadResult.status);
  }

  const leadId = leadResult.lead.id;
  const nowIso = new Date().toISOString();
  const userAgent = request.headers.get("user-agent") || "unknown";
  const maintenanceFlag = isMaintenanceModeEnabled() ? "ON" : "OFF";

  try {
    const autoReplyResult = await resend.emails.send({
      from,
      to: rawEmail,
      subject: "Welcome to Openly!",
      html: maintenanceEarlyAccessAutoReplyHtml,
      text: maintenanceEarlyAccessAutoReplyText,
    });

    if (autoReplyResult.error) {
      console.error("maintenance early-access auto-reply error", autoReplyResult.error);
      await updateLeadStatus(leadId, "email_failed", String(autoReplyResult.error.message || "auto_reply_failed"));
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
      replyTo: rawEmail,
      subject: `OpenlyMarket Early Access Request - ${normalizedEmail}`,
      text: [
        "New early-access request submitted from maintenance page.",
        "",
        `Email: ${normalizedEmail}`,
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

    await updateLeadStatus(leadId, "confirmed", null);
    return maintenanceJson({ ok: true, message: "You are on the list." }, 200);
  } catch (error) {
    console.error("maintenance early-access submit error", error);
    await updateLeadStatus(leadId, "email_failed", String((error as { message?: string }).message || "unknown_error"));
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
