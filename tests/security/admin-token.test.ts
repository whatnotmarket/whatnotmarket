import test from "node:test";
import assert from "node:assert/strict";
import { signToken, verifyToken } from "../../src/lib/domains/auth/auth";

test("admin JWT lifetime is short-lived (<= 1 hour)", async () => {
  process.env.ADMIN_JWT_SECRET = "test-admin-secret-for-unit-tests";

  const token = await signToken({ role: "admin", sub: "user-1" });
  const payload = await verifyToken(token);

  assert.ok(payload);
  assert.equal(payload?.role, "admin");
  assert.equal(typeof payload?.iat, "number");
  assert.equal(typeof payload?.exp, "number");

  const ttlSeconds = (payload!.exp as number) - (payload!.iat as number);
  assert.ok(ttlSeconds <= 3600, `expected <= 3600s, got ${ttlSeconds}`);
});

