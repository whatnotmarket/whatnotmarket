import { v4 as uuidv4 } from "uuid";
import { NETWORKS, CURRENCIES, Network, Currency } from "./catalog";

export interface PaymentIntent {
  dealId: string;
  amount: number;
  payCurrency: Currency;
  payNetwork: Network;
  expiresAt: Date;
}

export interface PaymentResult {
  depositAddress: string;
  memoTag?: string;
  adapterPaymentId: string;
}

export interface PaymentStatus {
  status: "created" | "awaiting_payment" | "detected" | "confirming" | "funded" | "released" | "refunded" | "failed";
  confirmations: number;
  txHash?: string;
  receivedAmount?: number;
}

export interface PayoutParams {
  dealId: string;
  amount: number;
  payoutCurrency: Currency;
  payoutNetwork: Network;
  payoutAddress: string;
  memoTag?: string;
}

export interface PayoutResult {
  payoutTxHash: string;
}

export interface PaymentsAdapter {
  createPaymentIntent(params: PaymentIntent): Promise<PaymentResult>;
  getPaymentStatus(adapterPaymentId: string): Promise<PaymentStatus>;
  createPayout(params: PayoutParams): Promise<PayoutResult>;
  refund(params: any): Promise<any>;
}

// Mock Adapter Implementation
export class MockPaymentsAdapter implements PaymentsAdapter {
  async createPaymentIntent(params: PaymentIntent): Promise<PaymentResult> {
    // Deterministic mock address based on deal ID for demo consistency
    const prefix = params.payNetwork.type === "EVM" ? "0x" : "bc1";
    const address = `${prefix}${params.dealId.replace(/-/g, "").substring(0, 38)}`;
    
    return {
      depositAddress: address,
      adapterPaymentId: `pi_${uuidv4()}`,
    };
  }

  async getPaymentStatus(adapterPaymentId: string): Promise<PaymentStatus> {
    // In a real implementation, this would query an indexer or provider API
    // For MVP demo, we'll return a static status or simulate one based on time/db state
    // The actual "live" updates will come from the client polling an API route that updates the DB
    return {
      status: "awaiting_payment",
      confirmations: 0,
    };
  }

  async createPayout(params: PayoutParams): Promise<PayoutResult> {
    console.log("Processing payout:", params);
    return {
      payoutTxHash: `0x${uuidv4().replace(/-/g, "")}`,
    };
  }

  async refund(params: any): Promise<any> {
    return { refundTxHash: `0x${uuidv4().replace(/-/g, "")}` };
  }
}

export const paymentsAdapter = new MockPaymentsAdapter();
