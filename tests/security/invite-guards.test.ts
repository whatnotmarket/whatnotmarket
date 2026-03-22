import test from "node:test";
import assert from "node:assert/strict";
import { enforceRequiredInvite } from "../../src/lib/domains/security/invite-guards";

test("required invite fails when code is missing", () => {
  const result = enforceRequiredInvite({
    isValid: true,
    normalizedCode: null,
    inviteType: null,
    reason: "ok",
  });

  assert.equal(result.isValid, false);
  assert.equal(result.reason, "missing");
});

test("required invite keeps invalid resolutions untouched", () => {
  const result = enforceRequiredInvite({
    isValid: false,
    normalizedCode: "CODE",
    inviteType: "buyer",
    reason: "expired",
  });

  assert.equal(result.isValid, false);
  assert.equal(result.reason, "expired");
});

test("required invite enforces allowed invite type", () => {
  const result = enforceRequiredInvite(
    {
      isValid: true,
      normalizedCode: "SELL2026",
      inviteType: "seller",
      reason: "ok",
    },
    { allowedTypes: ["buyer"] }
  );

  assert.equal(result.isValid, false);
  assert.equal(result.reason, "type_mismatch");
});

test("required invite accepts valid allowed type", () => {
  const result = enforceRequiredInvite(
    {
      isValid: true,
      normalizedCode: "BUY2026",
      inviteType: "buyer",
      reason: "ok",
    },
    { allowedTypes: ["buyer"] }
  );

  assert.equal(result.isValid, true);
  assert.equal(result.reason, "ok");
});

