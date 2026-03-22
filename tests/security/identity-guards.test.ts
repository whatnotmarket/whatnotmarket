import assert from "node:assert/strict";
import test from "node:test";
import {
isReservedProfileHandle,
normalizeProfileHandle,
} from "../../src/lib/domains/security/identity-guards";

test("normalize profile handle strips dangerous prefixes and symbols", () => {
  assert.equal(normalizeProfileHandle(" @Support!! "), "support");
  assert.equal(normalizeProfileHandle("TeAm___"), "team___");
});

test("reserved handles are blocked for impersonation reduction", () => {
  assert.equal(isReservedProfileHandle("support"), true);
  assert.equal(isReservedProfileHandle("@OPENLYMARKET"), true);
  assert.equal(isReservedProfileHandle("trusted_seller_123"), false);
});


