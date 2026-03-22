import assert from "node:assert/strict";
import test from "node:test";
import { isInboxRoute,shouldSkipModeration } from "../../src/lib/domains/moderation/moderation.skip";

test("isInboxRoute detects private inbox and DM endpoints", () => {
  assert.equal(isInboxRoute("/inbox"), true);
  assert.equal(isInboxRoute("/inbox/thread/abc"), true);
  assert.equal(isInboxRoute("/api/chat/messages"), true);
  assert.equal(isInboxRoute("/api/chat/messages/send"), true);
  assert.equal(isInboxRoute("/marketplace"), false);
  assert.equal(isInboxRoute("/api/requests/create"), false);
});

test("shouldSkipModeration skips when context points to inbox/private routing", () => {
  const skipByPath = shouldSkipModeration({
    targetType: "generic_public_text",
    text: "hello",
    context: { pathname: "/inbox" },
  });
  assert.equal(skipByPath.skip, true);
  assert.equal(skipByPath.skippedBecauseInbox, true);
  assert.equal(skipByPath.reasonCode, "INBOX_ROUTE_EXCLUDED");

  const skipByFlag = shouldSkipModeration({
    targetType: "generic_public_text",
    text: "hello",
    context: { pathname: "/market", isPrivateMessage: true },
  });
  assert.equal(skipByFlag.skip, true);
  assert.equal(skipByFlag.skippedBecauseInbox, true);
  assert.equal(skipByFlag.reasonCode, "INBOX_ROUTE_EXCLUDED");

  const noSkip = shouldSkipModeration({
    targetType: "listing_description",
    text: "normal listing text",
    context: { pathname: "/api/requests/create" },
  });
  assert.equal(noSkip.skip, false);
  assert.equal(noSkip.skippedBecauseInbox, false);
  assert.equal(noSkip.reasonCode, null);
});

