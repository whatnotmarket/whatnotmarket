import test from "node:test";
import assert from "node:assert/strict";
import { evaluateFollowToggle } from "../../src/lib/domains/security/follow-guards";

test("follow toggle allows valid actor -> target follow", () => {
  const result = evaluateFollowToggle({
    actorUserId: "8b8094f4-4827-465b-8689-55138f26e87d",
    targetUserId: "9ca16f2f-c534-4ea4-9a12-324b1fac3651",
    action: "follow",
  });

  assert.deepEqual(result, { allowed: true });
});

test("follow toggle rejects self-follow attempts", () => {
  const result = evaluateFollowToggle({
    actorUserId: "8b8094f4-4827-465b-8689-55138f26e87d",
    targetUserId: "8b8094f4-4827-465b-8689-55138f26e87d",
    action: "follow",
  });

  assert.equal(result.allowed, false);
  if (!result.allowed) {
    assert.match(result.reason, /self-follow/i);
  }
});

test("follow toggle rejects missing ids", () => {
  const result = evaluateFollowToggle({
    actorUserId: "",
    targetUserId: "9ca16f2f-c534-4ea4-9a12-324b1fac3651",
    action: "unfollow",
  });

  assert.equal(result.allowed, false);
  if (!result.allowed) {
    assert.match(result.reason, /required/i);
  }
});

