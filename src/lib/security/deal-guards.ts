import type { DealStatus } from "@/types/trade";

export type DealTransitionAction =
  | "accept"
  | "reject"
  | "counter"
  | "cancel"
  | "fund_escrow"
  | "mark_shipped"
  | "complete"
  | "open_dispute"
  | "resolve_dispute";

export type DealTransitionResolution = "completed" | "cancelled";

type DealState = {
  buyer_id: string;
  seller_id: string;
  status: DealStatus;
  sender_id?: string | null;
  last_action_by?: string | null;
};

type EvaluateTransitionInput = {
  deal: DealState;
  actorId: string;
  action: DealTransitionAction;
  isAdmin: boolean;
  resolution?: DealTransitionResolution;
};

type EvaluateTransitionResult =
  | {
      allowed: true;
      nextStatus: DealStatus;
    }
  | {
      allowed: false;
      reason: string;
    };

const TERMINAL_STATUSES = new Set<DealStatus>(["completed", "cancelled", "offer_rejected"]);
const NEGOTIATION_STATUSES = new Set<DealStatus>([
  "offer_sent",
  "buyer_offer_sent",
  "seller_counter_offer",
  "buyer_counter_offer",
]);

function getLastActor(deal: DealState) {
  return deal.last_action_by || deal.sender_id || null;
}

export function evaluateDealTransition(input: EvaluateTransitionInput): EvaluateTransitionResult {
  const { deal, actorId, action, isAdmin } = input;
  const isBuyer = deal.buyer_id === actorId;
  const isSeller = deal.seller_id === actorId;
  const isParticipant = isBuyer || isSeller;

  if (!isParticipant && !isAdmin) {
    return { allowed: false, reason: "Only deal participants can transition this trade." };
  }

  if (action === "resolve_dispute") {
    if (!isAdmin) {
      return { allowed: false, reason: "Only admins can resolve disputes." };
    }
    if (deal.status !== "dispute") {
      return { allowed: false, reason: "Dispute resolution is only valid for disputed deals." };
    }

    return { allowed: true, nextStatus: input.resolution ?? "completed" };
  }

  if (TERMINAL_STATUSES.has(deal.status)) {
    return { allowed: false, reason: "Terminal deals cannot be changed." };
  }

  if (deal.status === "dispute") {
    return { allowed: false, reason: "Disputed deals require admin resolution." };
  }

  const lastActor = getLastActor(deal);
  const actorIsLast = lastActor === actorId;

  if (NEGOTIATION_STATUSES.has(deal.status)) {
    if (action === "cancel") {
      if (!actorIsLast) {
        return { allowed: false, reason: "Only the actor that sent the latest offer can cancel it." };
      }
      return { allowed: true, nextStatus: "cancelled" };
    }

    if (actorIsLast) {
      return { allowed: false, reason: "Wait for counterparty response before acting again." };
    }

    if (action === "accept") return { allowed: true, nextStatus: "offer_accepted" };
    if (action === "reject") return { allowed: true, nextStatus: "offer_rejected" };

    if (action === "counter") {
      if (isBuyer) return { allowed: true, nextStatus: "buyer_counter_offer" };
      if (isSeller) return { allowed: true, nextStatus: "seller_counter_offer" };
    }

    return { allowed: false, reason: `Action ${action} is invalid during negotiation.` };
  }

  if (deal.status === "offer_accepted") {
    if (action === "fund_escrow" && isBuyer) return { allowed: true, nextStatus: "escrow_funded" };
    if (action === "cancel" && isBuyer) return { allowed: true, nextStatus: "cancelled" };
    return { allowed: false, reason: "Only the buyer can fund or cancel after acceptance." };
  }

  if (deal.status === "verification") {
    if (action === "complete") return { allowed: true, nextStatus: "completed" };
    if (action === "cancel") return { allowed: true, nextStatus: "cancelled" };
    return { allowed: false, reason: "Only completion/cancel are allowed during verification." };
  }

  if (deal.status === "escrow_funded") {
    if (action === "mark_shipped" && isSeller) return { allowed: true, nextStatus: "shipped" };
    return { allowed: false, reason: "Only the seller can mark the item as shipped." };
  }

  if (deal.status === "shipped") {
    if (isBuyer && action === "complete") return { allowed: true, nextStatus: "completed" };
    if (isBuyer && action === "open_dispute") return { allowed: true, nextStatus: "dispute" };
    return { allowed: false, reason: "Only the buyer can complete shipment stage actions." };
  }

  return { allowed: false, reason: `Unsupported transition from status ${deal.status}.` };
}

export function normalizeDealAction(status: DealStatus): DealTransitionAction | null {
  if (status === "offer_accepted") return "accept";
  if (status === "offer_rejected") return "reject";
  if (status === "cancelled") return "cancel";
  if (status === "escrow_funded") return "fund_escrow";
  if (status === "shipped") return "mark_shipped";
  if (status === "completed") return "complete";
  if (status === "dispute") return "open_dispute";
  return null;
}
