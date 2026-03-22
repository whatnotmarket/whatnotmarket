import "server-only";

import { createHmac,randomUUID,timingSafeEqual } from "crypto";

const DEFAULT_TTL_SECONDS = 2 * 60 * 60;

function getOnboardingSessionSecret() {
  const value = process.env.INTERNAL_ONBOARDING_SESSION_SECRET;
  if (value) return value;

  if (process.env.NODE_ENV === "production") {
    throw new Error("INTERNAL_ONBOARDING_SESSION_SECRET is required in production.");
  }

  return "dev-internal-onboarding-session-secret-change-me";
}

function signPayload(payload: string) {
  return createHmac("sha256", getOnboardingSessionSecret())
    .update(payload)
    .digest("base64url");
}

function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createOnboardingSessionProof() {
  const sessionId = randomUUID();
  const exp = Math.floor(Date.now() / 1000) + DEFAULT_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ sid: sessionId, exp }), "utf8").toString("base64url");
  const sig = signPayload(payload);
  return {
    sessionId,
    onboardingSessionToken: `${payload}.${sig}`,
  };
}

export function verifyOnboardingSessionProof(input: {
  sessionId: string;
  token: string;
}) {
  const sessionId = String(input.sessionId || "").trim();
  const token = String(input.token || "").trim();
  if (!sessionId || !token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expectedSig = signPayload(payload);
  if (!constantTimeEqual(signature, expectedSig)) return false;

  let decoded: { sid?: string; exp?: number } | null = null;
  try {
    decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sid?: string;
      exp?: number;
    };
  } catch {
    return false;
  }

  if (!decoded?.sid || !decoded?.exp) return false;
  if (decoded.sid !== sessionId) return false;
  if (decoded.exp < Math.floor(Date.now() / 1000)) return false;
  return true;
}

