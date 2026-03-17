import { randomBytes, randomUUID, timingSafeEqual } from "crypto";

function toBase64UrlBuffer(value: string) {
  return Buffer.from(value, "utf8");
}

export function generateOrderId() {
  return randomUUID().replace(/-/g, "").slice(0, 18).toUpperCase();
}

export function generateTrackingId() {
  return `TRK-${randomBytes(9).toString("hex").toUpperCase()}`;
}

export function generateTrackingAccessToken() {
  return randomBytes(24).toString("base64url");
}

export function buildTrackingPath(trackingId: string, accessToken: string) {
  return `/track/${encodeURIComponent(trackingId)}?access=${encodeURIComponent(accessToken)}`;
}

export function isTrackingAccessAllowed(expectedToken: string | null | undefined, providedToken: string | null | undefined) {
  if (!expectedToken || !providedToken) {
    return false;
  }

  const expectedBuffer = toBase64UrlBuffer(expectedToken);
  const providedBuffer = toBase64UrlBuffer(providedToken);
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

