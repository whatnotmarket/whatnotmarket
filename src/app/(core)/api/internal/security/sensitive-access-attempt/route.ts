import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AttemptPayload = {
  path?: unknown;
  method?: unknown;
  ip?: unknown;
  reason?: unknown;
  metadata?: unknown;
};

const MAX_PATH_LEN = 300;
const MAX_METHOD_LEN = 16;
const MAX_IP_LEN = 128;
const MAX_REASON_LEN = 120;
const MAX_METADATA_STR_LEN = 500;

function normalizeString(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function safeConstantEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function buildMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const metadata: Record<string, unknown> = {};

  const userAgent = normalizeString(raw.userAgent, MAX_METADATA_STR_LEN);
  if (userAgent) metadata.userAgent = userAgent;

  const referer = normalizeString(raw.referer, MAX_METADATA_STR_LEN);
  if (referer) metadata.referer = referer;

  const host = normalizeString(raw.host, 200);
  if (host) metadata.host = host;

  const blocked = raw.blocked;
  if (typeof blocked === "boolean") metadata.blocked = blocked;

  return metadata;
}

export async function POST(request: Request) {
  const expectedToken = process.env.INTERNAL_SECURITY_ALERT_TOKEN?.trim() || "";
  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, error: "Internal security alert endpoint is not configured." },
      { status: 503 }
    );
  }

  const providedToken = request.headers.get("x-internal-security-token")?.trim() || "";
  if (!providedToken || !safeConstantEqual(providedToken, expectedToken)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: AttemptPayload = {};
  try {
    body = (await request.json()) as AttemptPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const routePath = normalizeString(body.path, MAX_PATH_LEN);
  const requestMethod = normalizeString(body.method, MAX_METHOD_LEN).toUpperCase() || "GET";
  const ipAddress = normalizeString(body.ip, MAX_IP_LEN);
  const reason = normalizeString(body.reason, MAX_REASON_LEN);
  const metadata = buildMetadata(body.metadata);

  if (!routePath || !routePath.startsWith("/")) {
    return NextResponse.json({ ok: false, error: "Field path must be an absolute route path." }, { status: 400 });
  }

  if (!ipAddress) {
    return NextResponse.json({ ok: false, error: "Field ip is required." }, { status: 400 });
  }

  if (!reason) {
    return NextResponse.json({ ok: false, error: "Field reason is required." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("security_sensitive_access_attempts").insert({
      route_path: routePath,
      request_method: requestMethod,
      ip_address: ipAddress,
      reason,
      metadata,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: `Unable to persist sensitive access attempt: ${message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

