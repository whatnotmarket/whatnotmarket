export type FundingSubmissionInput = {
  status: string;
  existingTxHash: string | null;
  incomingTxHash: string;
};

export type FundingSubmissionResult =
  | { allowed: true; idempotent: false }
  | { allowed: true; idempotent: true }
  | { allowed: false; reason: string };

export function evaluateFundingSubmission(input: FundingSubmissionInput): FundingSubmissionResult {
  if (input.status !== "pending") {
    return {
      allowed: false,
      reason: `Cannot submit funding proof in status ${input.status}`,
    };
  }

  if (!input.existingTxHash) {
    return { allowed: true, idempotent: false };
  }

  if (input.existingTxHash.toLowerCase() === input.incomingTxHash.toLowerCase()) {
    return { allowed: true, idempotent: true };
  }

  return {
    allowed: false,
    reason: "A different tx hash was already submitted for this payment",
  };
}

export type OrderTxBindingResult =
  | { bindable: true; idempotent: false }
  | { bindable: true; idempotent: true }
  | { bindable: false; reason: string };

export function evaluateOrderTxBinding(
  existingOrderTxHash: string | null,
  incomingTxHash: string
): OrderTxBindingResult {
  if (!existingOrderTxHash) {
    return { bindable: true, idempotent: false };
  }

  if (existingOrderTxHash.toLowerCase() === incomingTxHash.toLowerCase()) {
    return { bindable: true, idempotent: true };
  }

  return {
    bindable: false,
    reason: "Order already has a different verified payment transaction.",
  };
}
