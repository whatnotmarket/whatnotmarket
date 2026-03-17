import "server-only";

import { randomBytes } from "crypto";

const FALLBACK_INTERNAL_AUTH_EMAIL_DOMAIN = "identity.openly.local";

function getInternalAuthEmailDomain() {
  const raw = String(
    process.env.INTERNAL_AUTH_EMAIL_DOMAIN || FALLBACK_INTERNAL_AUTH_EMAIL_DOMAIN
  )
    .trim()
    .toLowerCase()
    .replace(/^@+/, "");

  if (!raw || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(raw)) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("INTERNAL_AUTH_EMAIL_DOMAIN is missing or invalid.");
    }

    return FALLBACK_INTERNAL_AUTH_EMAIL_DOMAIN;
  }

  return raw;
}

function randomSuffix() {
  return randomBytes(3).toString("hex");
}

export function generateInternalAuthEmail(username: string) {
  const domain = getInternalAuthEmailDomain();
  return `${username}-${randomSuffix()}@${domain}`;
}
