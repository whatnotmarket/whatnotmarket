import assert from "node:assert/strict";
import test from "node:test";
import { hasCanonicalAdminAccess } from "../../src/lib/domains/security/admin-guards";

test("canonical admin access depends only on authoritative is_admin", () => {
  assert.equal(hasCanonicalAdminAccess({ is_admin: true }), true);
  assert.equal(hasCanonicalAdminAccess({ is_admin: false }), false);
  assert.equal(hasCanonicalAdminAccess(null), false);
});

