import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { LRUCache } from "lru-cache";

type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitAction =
  | "default"
  | "admin_login"
  | "admin_follow_test"
  | "order_create"
  | "payment_verify_tx"
  | "auth_wallet_challenge"
  | "auth_wallet_verify"
  | "auth_telegram_verify"
  | "wallet_link_challenge"
  | "wallet_link_verify"
  | "invite_role_lookup"
  | "invite_admin_login"
  | "invite_buyer_login"
  | "telegram_profile_lookup"
  | "follow_toggle"
  | "chat_message_post"
  | "global_chat_post"
  | "request_create"
  | "offer_create"
  | "offer_accept"
  | "deal_create"
  | "deal_transition"
  | "listing_payment_create"
  | "listing_payment_fund"
  | "listing_payment_cancel";

export type RateLimitOptions = {
  action?: RateLimitAction;
  identifier?: string | null;
  limit?: number;
  windowMs?: number;
};

export type RateLimitCheckResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
};

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 60_000,
};

const RATE_LIMIT_CONFIGS: Record<RateLimitAction, RateLimitConfig> = {
  default: DEFAULT_RATE_LIMIT,
  admin_login: { limit: 5, windowMs: 5 * 60_000 },
  admin_follow_test: { limit: 12, windowMs: 60_000 },
  order_create: { limit: 8, windowMs: 60_000 },
  payment_verify_tx: { limit: 10, windowMs: 60_000 },
  auth_wallet_challenge: { limit: 8, windowMs: 60_000 },
  auth_wallet_verify: { limit: 8, windowMs: 60_000 },
  auth_telegram_verify: { limit: 8, windowMs: 60_000 },
  wallet_link_challenge: { limit: 8, windowMs: 60_000 },
  wallet_link_verify: { limit: 8, windowMs: 60_000 },
  invite_role_lookup: { limit: 8, windowMs: 60_000 },
  invite_admin_login: { limit: 10, windowMs: 60_000 },
  invite_buyer_login: { limit: 10, windowMs: 60_000 },
  telegram_profile_lookup: { limit: 24, windowMs: 60_000 },
  follow_toggle: { limit: 20, windowMs: 60_000 },
  chat_message_post: { limit: 40, windowMs: 60_000 },
  global_chat_post: { limit: 24, windowMs: 60_000 },
  request_create: { limit: 10, windowMs: 60_000 },
  offer_create: { limit: 15, windowMs: 60_000 },
  offer_accept: { limit: 12, windowMs: 60_000 },
  deal_create: { limit: 12, windowMs: 60_000 },
  deal_transition: { limit: 20, windowMs: 60_000 },
  listing_payment_create: { limit: 10, windowMs: 60_000 },
  listing_payment_fund: { limit: 12, windowMs: 60_000 },
  listing_payment_cancel: { limit: 12, windowMs: 60_000 },
};

const rateLimiter = new LRUCache<string, RateLimitEntry>({
  max: 20_000,
  ttlAutopurge: true,
});

function getClientIp(req: Request) {
  const headersToCheck = ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"];
  for (const header of headersToCheck) {
    const raw = req.headers.get(header);
    if (!raw) continue;
    const first = raw.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

function buildFingerprint(req: Request, identifier?: string | null) {
  const ip = getClientIp(req);
  const userAgent = String(req.headers.get("user-agent") || "unknown").slice(0, 200);
  const identity = String(identifier || "anonymous");
  return createHash("sha256").update(`${ip}|${userAgent}|${identity}`).digest("hex");
}

function resolveConfig(options?: RateLimitOptions, numericLimit?: number): RateLimitConfig {
  if (typeof numericLimit === "number") {
    return { limit: numericLimit, windowMs: DEFAULT_RATE_LIMIT.windowMs };
  }

  const action = options?.action || "default";
  const fromAction = RATE_LIMIT_CONFIGS[action] || DEFAULT_RATE_LIMIT;
  return {
    limit: options?.limit ?? fromAction.limit,
    windowMs: options?.windowMs ?? fromAction.windowMs,
  };
}

function consumeRateLimitToken(req: Request, options?: RateLimitOptions, numericLimit?: number): RateLimitCheckResult {
  const action = options?.action || "default";
  const config = resolveConfig(options, numericLimit);
  const now = Date.now();
  const fingerprint = buildFingerprint(req, options?.identifier);
  const cacheKey = `rate-limit:v2:${action}:${fingerprint}`;

  const current = rateLimiter.get(cacheKey);
  const active =
    current && current.resetAt > now
      ? current
      : {
          count: 0,
          resetAt: now + config.windowMs,
        };

  if (active.count >= config.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((active.resetAt - now) / 1000));
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      retryAfterSeconds,
      resetAt: active.resetAt,
    };
  }

  const nextCount = active.count + 1;
  const remaining = Math.max(config.limit - nextCount, 0);
  rateLimiter.set(
    cacheKey,
    {
      count: nextCount,
      resetAt: active.resetAt,
    },
    { ttl: Math.max(1, active.resetAt - now) }
  );

  return {
    allowed: true,
    limit: config.limit,
    remaining,
    retryAfterSeconds: 0,
    resetAt: active.resetAt,
  };
}

export function checkRateLimitDetailed(
  req: Request,
  optionsOrLimit: RateLimitOptions | number = { action: "default" }
): RateLimitCheckResult {
  if (typeof optionsOrLimit === "number") {
    return consumeRateLimitToken(req, undefined, optionsOrLimit);
  }

  return consumeRateLimitToken(req, optionsOrLimit);
}

export function checkRateLimit(req: Request, optionsOrLimit: RateLimitOptions | number = DEFAULT_RATE_LIMIT.limit) {
  return checkRateLimitDetailed(req, optionsOrLimit).allowed;
}

export function RateLimitResponse(result?: RateLimitCheckResult) {
  const retryAfter = String(result?.retryAfterSeconds || 60);
  return NextResponse.json(
    { ok: false, error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfter,
        "X-RateLimit-Retry-After": retryAfter,
      },
    }
  );
}

export function resetRateLimitStateForTests() {
  rateLimiter.clear();
}
