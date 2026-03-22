import assert from "node:assert/strict";
import test from "node:test";
import {
isInviteCodeDirectLoginEnabled,
shouldAllowBridgeUserCreation,
} from "../../src/lib/domains/security/auth-guards";

test("signin mode never allows bridge user creation", () => {
  assert.equal(shouldAllowBridgeUserCreation("signin"), false);
});

test("signup mode allows bridge user creation", () => {
  assert.equal(shouldAllowBridgeUserCreation("signup"), true);
});

test("invite direct login is disabled in production unless explicitly enabled", () => {
  const env = process.env as unknown as Record<string, string | undefined>;
  const previousNodeEnv = env.NODE_ENV;
  const previousInviteToggle = env.ENABLE_INVITE_CODE_LOGIN;

  env.NODE_ENV = "production";
  env.ENABLE_INVITE_CODE_LOGIN = "false";
  assert.equal(isInviteCodeDirectLoginEnabled(), false);

  env.ENABLE_INVITE_CODE_LOGIN = "true";
  assert.equal(isInviteCodeDirectLoginEnabled(), true);

  env.NODE_ENV = "development";
  env.ENABLE_INVITE_CODE_LOGIN = "false";
  assert.equal(isInviteCodeDirectLoginEnabled(), true);

  env.NODE_ENV = previousNodeEnv;
  env.ENABLE_INVITE_CODE_LOGIN = previousInviteToggle;
});

