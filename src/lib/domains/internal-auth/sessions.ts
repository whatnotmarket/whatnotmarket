import "server-only";

import { createHash, randomBytes } from "crypto";
import type { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";

const DEFAULT_SESSION_COOKIE_NAME = "om_internal_session";
const DEFAULT_SESSION_TTL_DAYS = 30;

function getSessionCookieName() {
  return process.env.INTERNAL_IDENTITY_SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE_NAME;
}

function getSessionTtlDays() {
  const parsed = Number.parseInt(
    process.env.INTERNAL_IDENTITY_SESSION_TTL_DAYS || "",
    10
  );

  if (Number.isFinite(parsed) && parsed > 0 && parsed <= 365) {
    return parsed;
  }
  return DEFAULT_SESSION_TTL_DAYS;
}

function getSessionSecret() {
  const value = process.env.INTERNAL_IDENTITY_SESSION_SECRET;
  if (value) return value;

  if (process.env.NODE_ENV === "production") {
    throw new Error("INTERNAL_IDENTITY_SESSION_SECRET is required in production.");
  }

  return "dev-internal-session-secret-change-me";
}

export function hashInternalSessionToken(token: string) {
  return createHash("sha256")
    .update(`${getSessionSecret()}:${token}`)
    .digest("hex");
}

export function buildInternalSession() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashInternalSessionToken(token);
  const expiresAt = new Date(Date.now() + getSessionTtlDays() * 24 * 60 * 60 * 1000);

  return {
    token,
    tokenHash,
    expiresAt,
  };
}

export async function createInternalIdentitySession(identityId: string) {
  const admin = createAdminClient();
  const { token, tokenHash, expiresAt } = buildInternalSession();

  const { error } = await admin.from("internal_identity_sessions").insert({
    identity_id: identityId,
    session_token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error(`Unable to create internal session: ${error.message}`);
  }

  return { token, expiresAt };
}

export function setInternalSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(getSessionCookieName(), token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  });
}


