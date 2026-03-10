import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateFundingSubmission,
  evaluateOrderTxBinding,
} from "../../src/lib/security/payment-guards";

test("funding submission is allowed for pending payments with no existing tx hash", () => {
  const result = evaluateFundingSubmission({
    status: "pending",
    existingTxHash: null,
    incomingTxHash: "0xabc",
  });

  assert.deepEqual(result, { allowed: true, idempotent: false });
});

test("funding submission is idempotent when same tx hash is submitted twice", () => {
  const result = evaluateFundingSubmission({
    status: "pending",
    existingTxHash: "0xABC",
    incomingTxHash: "0xabc",
  });

  assert.deepEqual(result, { allowed: true, idempotent: true });
});

test("funding submission rejects different tx hash once one is already attached", () => {
  const result = evaluateFundingSubmission({
    status: "pending",
    existingTxHash: "0xabc",
    incomingTxHash: "0xdef",
  });

  assert.equal(result.allowed, false);
  if (!result.allowed) {
    assert.match(result.reason, /already submitted/i);
  }
});

test("funding submission rejects non-pending status", () => {
  const result = evaluateFundingSubmission({
    status: "released",
    existingTxHash: null,
    incomingTxHash: "0xabc",
  });

  assert.equal(result.allowed, false);
  if (!result.allowed) {
    assert.match(result.reason, /released/);
  }
});

test("order tx binding accepts first tx", () => {
  const result = evaluateOrderTxBinding(null, "0xabc");
  assert.deepEqual(result, { bindable: true, idempotent: false });
});

test("order tx binding is idempotent for same tx", () => {
  const result = evaluateOrderTxBinding("0xABC", "0xabc");
  assert.deepEqual(result, { bindable: true, idempotent: true });
});

test("order tx binding rejects a second different tx", () => {
  const result = evaluateOrderTxBinding("0xabc", "0xdef");
  assert.equal(result.bindable, false);
  if (!result.bindable) {
    assert.match(result.reason, /already has a different verified payment/i);
  }
});
