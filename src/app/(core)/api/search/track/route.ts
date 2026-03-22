import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type TrackPayload = {
  query?: string;
  scope?: string | null;
  source?: string | null;
  selectedItemId?: string | null;
  intent?: string | null;
  entities?: Record<string, unknown> | null;
};

const VALID_SCOPES = new Set(["users", "services", "products", "wallet", "pages", "verified-sellers"]);
const MAX_QUERY_LENGTH = 120;
const SESSION_COOKIE_NAME = "wm_search_sid";
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function normalizeQuery(value: unknown): { queryText: string; queryNorm: string } | null {
  const queryText = String(value ?? "").trim();
  if (queryText.length < 2 || queryText.length > MAX_QUERY_LENGTH) return null;
  const queryNorm = queryText.toLowerCase().replace(/\s+/g, " ");
  return { queryText, queryNorm };
}

function normalizeSessionKey(value: unknown): string | null {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  if (normalized.length < 16 || normalized.length > 80) return null;
  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as TrackPayload;
    const normalized = normalizeQuery(payload.query);
    if (!normalized) {
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    const scope = String(payload.scope || "").trim().toLowerCase();
    const source = String(payload.source || "cmdk").trim().slice(0, 32) || "cmdk";
    const selectedItemId = String(payload.selectedItemId || "").trim().slice(0, 128) || null;
    const intent = String(payload.intent || "").trim().slice(0, 32) || null;
    const entities = payload.entities && typeof payload.entities === "object" ? payload.entities : {};
    const currentSessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const existingSessionKey = normalizeSessionKey(currentSessionCookie);
    const sessionKey = existingSessionKey || crypto.randomUUID().toLowerCase();

    const admin = createAdminClient();
    const insertPayload = {
      query_text: normalized.queryText,
      query_norm: normalized.queryNorm,
      scope: VALID_SCOPES.has(scope) ? scope : null,
      source,
      selected_item_id: selectedItemId,
      intent,
      entities,
      session_key: sessionKey,
    };

    const insertResult = await admin.from("search_query_events").insert(insertPayload);
    if (insertResult.error && insertResult.error.message.toLowerCase().includes("session_key")) {
      const legacyPayload = {
        query_text: insertPayload.query_text,
        query_norm: insertPayload.query_norm,
        scope: insertPayload.scope,
        source: insertPayload.source,
        selected_item_id: insertPayload.selected_item_id,
        intent: insertPayload.intent,
        entities: insertPayload.entities,
      };
      await admin.from("search_query_events").insert(legacyPayload);
    }

    const response = NextResponse.json({ ok: true }, { status: 200 });
    if (!existingSessionKey) {
      response.cookies.set(SESSION_COOKIE_NAME, sessionKey, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
      });
    }

    return response;
  } catch {
    return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
  }
}

