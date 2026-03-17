import test from "node:test";
import assert from "node:assert/strict";
import {
  RateLimitResponse,
  checkRateLimitDetailed,
  resetRateLimitStateForTests,
} from "../../src/lib/rate-limit";

function makeRequest(ip: string, userAgent: string) {
  return new Request("https://example.test/api", {
    headers: {
      "x-forwarded-for": ip,
      "user-agent": userAgent,
    },
  });
}

test("scoped rate limit blocks after limit is reached", () => {
  resetRateLimitStateForTests();
  const req = makeRequest("203.0.113.10", "unit-test-agent");

  const first = checkRateLimitDetailed(req, { action: "auth_wallet_verify", limit: 2, windowMs: 60_000 });
  const second = checkRateLimitDetailed(req, { action: "auth_wallet_verify", limit: 2, windowMs: 60_000 });
  const third = checkRateLimitDetailed(req, { action: "auth_wallet_verify", limit: 2, windowMs: 60_000 });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
  assert.ok(third.retryAfterSeconds >= 1);
});

test("identifier creates an independent bucket for same IP", () => {
  resetRateLimitStateForTests();
  const req = makeRequest("203.0.113.20", "unit-test-agent");

  const userOneFirst = checkRateLimitDetailed(req, {
    action: "follow_toggle",
    identifier: "user-1",
    limit: 1,
    windowMs: 60_000,
  });
  const userOneSecond = checkRateLimitDetailed(req, {
    action: "follow_toggle",
    identifier: "user-1",
    limit: 1,
    windowMs: 60_000,
  });
  const userTwoFirst = checkRateLimitDetailed(req, {
    action: "follow_toggle",
    identifier: "user-2",
    limit: 1,
    windowMs: 60_000,
  });

  assert.equal(userOneFirst.allowed, true);
  assert.equal(userOneSecond.allowed, false);
  assert.equal(userTwoFirst.allowed, true);
});

test("rate limit response exposes retry headers", async () => {
  const response = RateLimitResponse({
    allowed: false,
    limit: 5,
    remaining: 0,
    retryAfterSeconds: 17,
    resetAt: Date.now() + 17_000,
  });

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "17");
  assert.equal(response.headers.get("X-RateLimit-Retry-After"), "17");
});
