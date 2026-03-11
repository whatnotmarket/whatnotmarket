import { createHash } from "crypto";
import type { ReasonCode } from "@/lib/trust/reason-codes";
import type { ReasonWeight } from "@/lib/trust/types";

const HASH_SALT = process.env.ABUSE_SIGNAL_SALT || "openlymarket-trust-v1";

export function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function addReason(
  reasons: ReasonWeight[],
  code: ReasonCode,
  weight: number,
  detail?: string
) {
  if (weight <= 0) return;
  reasons.push({ code, weight, detail });
}

export function dedupeReasonCodes(reasons: ReasonWeight[]) {
  return Array.from(new Set(reasons.map((reason) => reason.code)));
}

export function hashSignal(value: string) {
  return createHash("sha256").update(`${HASH_SALT}:${value}`).digest("hex");
}

export function getClientIp(req: Request) {
  const headersToCheck = ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"];
  for (const header of headersToCheck) {
    const raw = req.headers.get(header);
    if (!raw) continue;
    const first = raw.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

export function getRequestDeviceHint(req: Request) {
  const explicit =
    req.headers.get("x-device-id") ||
    req.headers.get("x-client-fingerprint") ||
    req.headers.get("x-device-fingerprint");
  if (explicit) return explicit.slice(0, 300);

  const ua = req.headers.get("user-agent") || "unknown-ua";
  const lang = req.headers.get("accept-language") || "unknown-lang";
  const platform = req.headers.get("sec-ch-ua-platform") || "unknown-platform";
  return `${ua}|${lang}|${platform}`.slice(0, 600);
}

export function safeArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}

export function normalizeWhitespace(text: string) {
  return String(text || "").replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

export function toHoursFromNow(timestampIso: string | null | undefined) {
  if (!timestampIso) return 0;
  const ts = new Date(timestampIso).getTime();
  if (!Number.isFinite(ts)) return 0;
  return Math.max(0, Math.floor((Date.now() - ts) / 3_600_000));
}

export function jaccardSimilarity(leftText: string, rightText: string) {
  const left = new Set(
    normalizeWhitespace(leftText)
      .toLowerCase()
      .split(" ")
      .filter((token) => token.length >= 3)
  );
  const right = new Set(
    normalizeWhitespace(rightText)
      .toLowerCase()
      .split(" ")
      .filter((token) => token.length >= 3)
  );

  if (left.size === 0 || right.size === 0) return 0;

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  const union = left.size + right.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

