import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTrackingPath,
  generateOrderId,
  generateTrackingAccessToken,
  generateTrackingId,
  isTrackingAccessAllowed,
} from "../../src/lib/domains/security/order-tracking-guards";

test("order and tracking identifiers use opaque high-entropy formats", () => {
  const orderId = generateOrderId();
  const trackingId = generateTrackingId();
  const token = generateTrackingAccessToken();

  assert.match(orderId, /^[A-F0-9]{18}$/);
  assert.match(trackingId, /^TRK-[A-F0-9]{18}$/);
  assert.ok(token.length >= 32);
});

test("tracking path always includes access token query", () => {
  const path = buildTrackingPath("TRK-ABC123", "token123");
  assert.equal(path, "/track/TRK-ABC123?access=token123");
});

test("tracking access comparison is strict and timing-safe compatible", () => {
  assert.equal(isTrackingAccessAllowed("same-token", "same-token"), true);
  assert.equal(isTrackingAccessAllowed("same-token", "different-token"), false);
  assert.equal(isTrackingAccessAllowed(null, "same-token"), false);
});


