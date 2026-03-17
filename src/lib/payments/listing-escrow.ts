import "server-only";

export type ListingPaymentStatus =
  | "pending"
  | "funded_to_escrow"
  | "awaiting_release"
  | "released"
  | "failed"
  | "cancelled";

const allowedTransitions: Record<ListingPaymentStatus, ListingPaymentStatus[]> = {
  pending: ["funded_to_escrow", "awaiting_release", "failed", "cancelled"],
  funded_to_escrow: ["awaiting_release", "failed"],
  awaiting_release: ["released", "failed"],
  released: [],
  failed: [],
  cancelled: [],
};

export function canTransitionStatus(
  from: ListingPaymentStatus,
  to: ListingPaymentStatus
) {
  return allowedTransitions[from].includes(to);
}

export function buildEscrowReference() {
  return `escrow_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function toWeiHex(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }

  const value = BigInt(Math.round(amount * 1_000_000_000_000_000_000));
  return `0x${value.toString(16)}`;
}
