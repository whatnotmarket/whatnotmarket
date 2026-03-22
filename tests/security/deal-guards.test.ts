import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateDealTransition,
  normalizeDealAction,
} from "../../src/lib/domains/security/deal-guards";

const buyerId = "buyer-1";
const sellerId = "seller-1";

test("counterparty can accept negotiation offers", () => {
  const result = evaluateDealTransition({
    deal: {
      buyer_id: buyerId,
      seller_id: sellerId,
      status: "buyer_offer_sent",
      sender_id: buyerId,
      last_action_by: buyerId,
    },
    actorId: sellerId,
    action: "accept",
    isAdmin: false,
  });

  assert.deepEqual(result, { allowed: true, nextStatus: "offer_accepted" });
});

test("same actor cannot act twice in negotiation loop", () => {
  const result = evaluateDealTransition({
    deal: {
      buyer_id: buyerId,
      seller_id: sellerId,
      status: "buyer_offer_sent",
      sender_id: buyerId,
      last_action_by: buyerId,
    },
    actorId: buyerId,
    action: "accept",
    isAdmin: false,
  });

  assert.equal(result.allowed, false);
  if (!result.allowed) {
    assert.match(result.reason, /wait for counterparty/i);
  }
});

test("buyer can fund escrow only after offer acceptance", () => {
  const result = evaluateDealTransition({
    deal: {
      buyer_id: buyerId,
      seller_id: sellerId,
      status: "offer_accepted",
      sender_id: sellerId,
      last_action_by: sellerId,
    },
    actorId: buyerId,
    action: "fund_escrow",
    isAdmin: false,
  });

  assert.deepEqual(result, { allowed: true, nextStatus: "escrow_funded" });
});

test("seller cannot complete shipped order", () => {
  const result = evaluateDealTransition({
    deal: {
      buyer_id: buyerId,
      seller_id: sellerId,
      status: "shipped",
      sender_id: sellerId,
      last_action_by: sellerId,
    },
    actorId: sellerId,
    action: "complete",
    isAdmin: false,
  });

  assert.equal(result.allowed, false);
});

test("legacy verification deals can only be completed or cancelled", () => {
  const completeResult = evaluateDealTransition({
    deal: {
      buyer_id: buyerId,
      seller_id: sellerId,
      status: "verification",
      sender_id: sellerId,
      last_action_by: sellerId,
    },
    actorId: buyerId,
    action: "complete",
    isAdmin: false,
  });
  assert.deepEqual(completeResult, { allowed: true, nextStatus: "completed" });

  const denied = evaluateDealTransition({
    deal: {
      buyer_id: buyerId,
      seller_id: sellerId,
      status: "verification",
      sender_id: sellerId,
      last_action_by: sellerId,
    },
    actorId: buyerId,
    action: "open_dispute",
    isAdmin: false,
  });
  assert.equal(denied.allowed, false);
});

test("only admin can resolve disputes", () => {
  const denied = evaluateDealTransition({
    deal: {
      buyer_id: buyerId,
      seller_id: sellerId,
      status: "dispute",
      sender_id: buyerId,
      last_action_by: buyerId,
    },
    actorId: buyerId,
    action: "resolve_dispute",
    isAdmin: false,
  });
  assert.equal(denied.allowed, false);

  const allowed = evaluateDealTransition({
    deal: {
      buyer_id: buyerId,
      seller_id: sellerId,
      status: "dispute",
      sender_id: buyerId,
      last_action_by: buyerId,
    },
    actorId: "admin-1",
    action: "resolve_dispute",
    isAdmin: true,
    resolution: "cancelled",
  });
  assert.deepEqual(allowed, { allowed: true, nextStatus: "cancelled" });
});

test("status to action normalization maps supported statuses", () => {
  assert.equal(normalizeDealAction("offer_accepted"), "accept");
  assert.equal(normalizeDealAction("completed"), "complete");
  assert.equal(normalizeDealAction("buyer_counter_offer"), null);
});

