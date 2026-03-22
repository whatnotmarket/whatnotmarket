import assert from "node:assert/strict";
import test from "node:test";
import {
containsDisallowedLink,
isCanonicalRoomId,
isParticipantInRoom,
normalizeChatContent,
} from "../../src/lib/domains/security/chat-guards";

const ROOM_ID = "11111111-1111-4111-8111-111111111111_22222222-2222-4222-8222-222222222222";

test("canonical room id is validated with two UUID participants", () => {
  assert.equal(isCanonicalRoomId(ROOM_ID), true);
  assert.equal(isCanonicalRoomId("not-a-room"), false);
  assert.equal(
    isCanonicalRoomId(
      "11111111-1111-4111-8111-111111111111_22222222-2222-4222-8222-222222222222_extra"
    ),
    false
  );
});

test("room participation check only accepts explicit room members", () => {
  assert.equal(isParticipantInRoom(ROOM_ID, "11111111-1111-4111-8111-111111111111"), true);
  assert.equal(isParticipantInRoom(ROOM_ID, "33333333-3333-4333-8333-333333333333"), false);
});

test("disallowed link detection catches phishing-like content", () => {
  assert.equal(containsDisallowedLink("hello world"), false);
  assert.equal(containsDisallowedLink("visit https://evil.test now"), true);
  assert.equal(containsDisallowedLink("secure.example.com/pay"), true);
});

test("chat content normalization trims and normalizes line endings", () => {
  assert.equal(normalizeChatContent("  hi\r\nthere  "), "hi\nthere");
});


