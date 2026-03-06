import { NextResponse } from "next/server";
import { LRUCache } from "lru-cache";

const rateLimiter = new LRUCache<string, number>({
  max: 500,
  ttl: 60 * 1000, // 1 minute
});

export function checkRateLimit(req: Request, limit: number = 10) {
  // Use IP address for rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const key = `rate-limit:${ip}`; 
  const tokenCount = rateLimiter.get(key) || 0;

  if (tokenCount >= limit) { 
    return false;
  }

  rateLimiter.set(key, tokenCount + 1);
  return true;
}

export function RateLimitResponse() {
  return NextResponse.json(
    { ok: false, error: "Too many requests" },
    { status: 429 }
  );
}
