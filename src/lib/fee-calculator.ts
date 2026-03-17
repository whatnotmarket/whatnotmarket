export type EscrowPlan = "standard" | "concierge";

export type PaymentMethod =
  | "eu_card"
  | "international_card"
  | "paypal"
  | "apple_google_pay"
  | "sepa"
  | "crypto";

export type CompetitorKey = "ourEscrow" | "escrowCom" | "cryptoExchange";

export type FeeTier = {
  min: number;
  max: number | null;
  rate: number;
  minimumFee?: number;
  customQuote?: boolean;
};

export type PaymentMethodConfig = {
  label: string;
  percentage: number;
  fixed: number;
  hasNetworkFee?: boolean;
};

export type EscrowFeeCalculation = {
  tier: FeeTier;
  rate: number;
  minFee: number;
  feeFromRate: number;
  fee: number;
  minimumApplied: boolean;
  customQuote: boolean;
};

export type PaymentFeeCalculation = {
  method: PaymentMethod;
  fee: number;
  percentageComponent: number;
  fixedComponent: number;
  hasNetworkFee: boolean;
};

export const MAX_SLIDER_AMOUNT = 10_000_000;
export const MIN_SLIDER_AMOUNT = 1_000;

export const escrowFeeTiers: Record<EscrowPlan, FeeTier[]> = {
  standard: [
    { min: 0, max: 5_000, rate: 0.022, minimumFee: 40 },
    { min: 5_000.01, max: 50_000, rate: 0.0205, minimumFee: 100 },
    { min: 50_000.01, max: 200_000, rate: 0.0165, minimumFee: 950 },
    { min: 200_000.01, max: 500_000, rate: 0.013, minimumFee: 3_200 },
    { min: 500_000.01, max: 1_000_000, rate: 0.0105, minimumFee: 6_500 },
    { min: 1_000_000.01, max: 3_000_000, rate: 0.009, minimumFee: 10_500 },
    { min: 3_000_000.01, max: 5_000_000, rate: 0.0085, minimumFee: 25_000 },
    { min: 5_000_000.01, max: 10_000_000, rate: 0.008, minimumFee: 40_000 },
    { min: 10_000_000.01, max: null, rate: 0.006, customQuote: true },
  ],
  concierge: [
    { min: 0, max: 5_000, rate: 0.044, minimumFee: 80 },
    { min: 5_000.01, max: 50_000, rate: 0.041 },
    { min: 50_000.01, max: 200_000, rate: 0.033 },
    { min: 200_000.01, max: 500_000, rate: 0.026 },
    { min: 500_000.01, max: 1_000_000, rate: 0.021 },
    { min: 1_000_000.01, max: 3_000_000, rate: 0.018 },
    { min: 3_000_000.01, max: 5_000_000, rate: 0.017 },
    { min: 5_000_000.01, max: 10_000_000, rate: 0.016 },
    { min: 10_000_000.01, max: null, rate: 0.012, customQuote: true },
  ],
};

export const paymentMethodConfig: Record<PaymentMethod, PaymentMethodConfig> = {
  eu_card: {
    label: "EU Credit / Debit Card",
    percentage: 0.014,
    fixed: 0.25,
  },
  international_card: {
    label: "International Card",
    percentage: 0.029,
    fixed: 0.25,
  },
  paypal: {
    label: "PayPal",
    percentage: 0.0349,
    fixed: 0.35,
  },
  apple_google_pay: {
    label: "Apple Pay / Google Pay",
    percentage: 0.014,
    fixed: 0,
  },
  sepa: {
    label: "SEPA Bank Transfer",
    percentage: 0,
    fixed: 1,
  },
  crypto: {
    label: "Crypto",
    percentage: 0.003,
    fixed: 0,
    hasNetworkFee: true,
  },
};

export const competitorFeeTiers: Record<Exclude<CompetitorKey, "ourEscrow">, FeeTier[]> = {
  escrowCom: [
    { min: 0, max: 5_000, rate: 0.026 },
    { min: 5_000.01, max: 50_000, rate: 0.024 },
    { min: 50_000.01, max: 200_000, rate: 0.019 },
    { min: 200_000.01, max: 500_000, rate: 0.015 },
    { min: 500_000.01, max: 1_000_000, rate: 0.012 },
    { min: 1_000_000.01, max: 3_000_000, rate: 0.01 },
    { min: 3_000_000.01, max: 5_000_000, rate: 0.0095 },
    { min: 5_000_000.01, max: 10_000_000, rate: 0.009 },
    { min: 10_000_000.01, max: null, rate: 0.007 },
  ],
  cryptoExchange: [
    { min: 0, max: 5_000, rate: 0.0254 },
    { min: 5_000.01, max: 50_000, rate: 0.0235 },
    { min: 50_000.01, max: 200_000, rate: 0.0185 },
    { min: 200_000.01, max: 500_000, rate: 0.0147 },
    { min: 500_000.01, max: 1_000_000, rate: 0.0117 },
    { min: 1_000_000.01, max: 3_000_000, rate: 0.0098 },
    { min: 3_000_000.01, max: 5_000_000, rate: 0.0093 },
    { min: 5_000_000.01, max: 10_000_000, rate: 0.0088 },
    { min: 10_000_000.01, max: null, rate: 0.0068 },
  ],
};

export function getTierForAmount(tiers: FeeTier[], amount: number): FeeTier {
  for (const tier of tiers) {
    const inLowerBound = amount >= tier.min;
    const inUpperBound = tier.max === null ? true : amount <= tier.max;
    if (inLowerBound && inUpperBound) {
      return tier;
    }
  }
  return tiers[tiers.length - 1];
}

export function calculateEscrowFee(amount: number, plan: EscrowPlan): EscrowFeeCalculation {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const tier = getTierForAmount(escrowFeeTiers[plan], safeAmount);
  const feeFromRate = safeAmount * tier.rate;
  const minFee = tier.minimumFee ?? 0;
  const fee = Math.max(feeFromRate, minFee);

  return {
    tier,
    rate: tier.rate,
    minFee,
    feeFromRate,
    fee,
    minimumApplied: minFee > 0 && feeFromRate < minFee,
    customQuote: Boolean(tier.customQuote),
  };
}

export function calculatePaymentFee(amount: number, method: PaymentMethod): PaymentFeeCalculation {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const config = paymentMethodConfig[method];
  const percentageComponent = safeAmount * config.percentage;
  const fixedComponent = config.fixed;

  return {
    method,
    fee: percentageComponent + fixedComponent,
    percentageComponent,
    fixedComponent,
    hasNetworkFee: Boolean(config.hasNetworkFee),
  };
}

export function calculateCompetitorEscrowFee(
  amount: number,
  competitor: Exclude<CompetitorKey, "ourEscrow">
) {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const tier = getTierForAmount(competitorFeeTiers[competitor], safeAmount);
  return {
    rate: tier.rate,
    fee: safeAmount * tier.rate,
    customQuote: Boolean(tier.customQuote),
  };
}

export function formatCurrency(value: number, currency: string = "EUR") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

export function parseCurrencyInput(raw: string) {
  const normalized = raw
    .trim()
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");

  if (!normalized) return 0;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function clampAmount(amount: number, min: number, max: number) {
  return Math.min(max, Math.max(min, amount));
}
