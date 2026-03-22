"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Gem,
  Globe,
  HandCoins,
  Landmark,
  Lock,
  MessagesSquare,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { Navbar } from "@/components/app/navigation/Navbar";
import { Badge } from "@/components/shared/ui/badge";
import { Button } from "@/components/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card";
import { Checkbox } from "@/components/shared/ui/checkbox";
import { Input } from "@/components/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/ui/tabs";
import { cn } from "@/lib/core/utils/utils";
import {
  MAX_SLIDER_AMOUNT,
  MIN_SLIDER_AMOUNT,
  calculateCompetitorEscrowFee,
  calculateEscrowFee,
  calculatePaymentFee,
  clampAmount,
  formatCurrency,
  formatPercent,
  parseCurrencyInput,
  paymentMethodConfig,
  type EscrowPlan,
  type PaymentMethod,
} from "@/lib/domains/payments/fee-calculator";

const sectionClass =
  "rounded-[28px] border border-white/10 bg-[#111214] p-5 md:p-8 shadow-[0_14px_50px_rgba(0,0,0,0.32)]";

const pricingRows = [
  ["â‚¬0 â€“ â‚¬5,000", "2.20% (â‚¬40 minimum)", "4.40% (â‚¬80 minimum)", "â‚¬5,000 â†’ â‚¬110", "EU Card 1.4% + â‚¬0.25 / Int Card 2.9% + â‚¬0.25 / PayPal 3.49% + â‚¬0.35 / Crypto 0.30% / SEPA â‚¬1"],
  ["â‚¬5,000.01 â€“ â‚¬50,000", "2.05% (â‚¬100 minimum)", "4.10%", "â‚¬20,000 â†’ â‚¬410", "Same payment fees"],
  ["â‚¬50,000.01 â€“ â‚¬200,000", "1.65% (â‚¬950 minimum)", "3.30%", "â‚¬100,000 â†’ â‚¬1,650", "Same payment fees"],
  ["â‚¬200,000.01 â€“ â‚¬500,000", "1.30% (â‚¬3,200 minimum)", "2.60%", "â‚¬300,000 â†’ â‚¬3,900", "Same payment fees"],
  ["â‚¬500,000.01 â€“ â‚¬1,000,000", "1.05% (â‚¬6,500 minimum)", "2.10%", "â‚¬750,000 â†’ â‚¬7,875", "Same payment fees"],
  ["â‚¬1,000,000.01 â€“ â‚¬3,000,000", "0.90% (â‚¬10,500 minimum)", "1.80%", "â‚¬2M â†’ â‚¬18,000", "Same payment fees"],
  ["â‚¬3,000,000.01 â€“ â‚¬5,000,000", "0.85% (â‚¬25,000 minimum)", "1.70%", "â‚¬4M â†’ â‚¬34,000", "Same payment fees"],
  ["â‚¬5,000,000.01 â€“ â‚¬10,000,000", "0.80% (â‚¬40,000 minimum)", "1.60%", "â‚¬8M â†’ â‚¬64,000", "Same payment fees"],
  ["â‚¬10,000,000.01+", "0.60% (Custom quote)", "1.20%", "â‚¬20M â†’ â‚¬120,000", "Same payment fees"],
] as const;

const competitorRows = [
  ["â‚¬0 â€“ â‚¬5,000", "2.20%", "2.60%", "2.54%", "â†“ 15% lower"],
  ["â‚¬5,000 â€“ â‚¬50,000", "2.05%", "2.40%", "2.35%", "â†“ 14% lower"],
  ["â‚¬50,000 â€“ â‚¬200,000", "1.65%", "1.90%", "1.85%", "â†“ 13% lower"],
  ["â‚¬200,000 â€“ â‚¬500,000", "1.30%", "1.50%", "1.47%", "â†“ 12% lower"],
  ["â‚¬500,000 â€“ â‚¬1,000,000", "1.05%", "1.20%", "1.17%", "â†“ 12% lower"],
  ["â‚¬1,000,000 â€“ â‚¬3,000,000", "0.90%", "1.00%", "0.98%", "â†“ 10% lower"],
  ["â‚¬3,000,000 â€“ â‚¬5,000,000", "0.85%", "0.95%", "0.93%", "â†“ 10% lower"],
  ["â‚¬5,000,000 â€“ â‚¬10,000,000", "0.80%", "0.90%", "0.88%", "â†“ 10% lower"],
  ["â‚¬10,000,000+", "0.60%", "0.70%", "0.68%", "â†“ 12% lower"],
] as const;

const realExamples = [
  { amount: 5000, ourRate: 0.022, our: 110, escrowRate: 0.026, escrow: 130, cryptoRate: 0.0254, crypto: 127, save: 20 },
  { amount: 50000, ourRate: 0.0165, our: 825, escrowRate: 0.019, escrow: 950, cryptoRate: 0.0185, crypto: 925, save: 125 },
  { amount: 250000, ourRate: 0.013, our: 3250, escrowRate: 0.015, escrow: 3750, cryptoRate: 0.0147, crypto: 3675, save: 500 },
  { amount: 1000000, ourRate: 0.009, our: 9000, escrowRate: 0.01, escrow: 10000, cryptoRate: 0.0098, crypto: 9800, save: 1000 },
  { amount: 5000000, ourRate: 0.008, our: 40000, escrowRate: 0.009, escrow: 45000, cryptoRate: 0.0088, crypto: 44000, save: 5000 },
] as const;

const presets = [5000, 50000, 250000, 1000000, 5000000] as const;

const supportedTransactions = [
  ["Domain name transfers", "Secure transfer of domain ownership between buyer and seller.", Globe],
  ["Business acquisitions", "Escrow for companies, shares, and business assets.", Building2],
  ["Vehicles and luxury goods", "Cars, motorcycles, watches, collectibles and high-value items.", Truck],
  ["Digital assets", "Software licenses, online assets, and digital property.", Wallet],
  ["Freelance and service agreements", "Release funds only once work is delivered.", Users],
  ["High-value private sales", "Trusted peer-to-peer transactions for substantial amounts.", Gem],
  ["Crypto related transactions", "Escrow support for eligible crypto-funded deals.", ShieldCheck],
] as const;

const currencyMethodMap = {
  EUR: {
    cards: ["Visa", "Mastercard", "American Express", "Discover", "Diners Club", "JCB", "UnionPay"],
    wallets: ["PayPal", "Apple Pay", "Google Pay", "Samsung Pay", "Amazon Pay", "Skrill", "Neteller"],
    bank: ["SEPA Bank Transfer", "SEPA Instant"],
    local: ["iDEAL", "Bancontact", "Sofort / Klarna Pay Now", "Giropay", "EPS"],
    crypto: ["BTC", "ETH", "LTC", "USDT", "USDC", "DAI"],
  },
  USD: {
    cards: ["Visa", "Mastercard", "American Express", "Discover", "Diners Club", "JCB", "UnionPay"],
    wallets: ["PayPal", "Apple Pay", "Google Pay", "Samsung Pay", "Amazon Pay", "Skrill", "Neteller"],
    bank: ["ACH Transfer", "Wire Transfer", "Fedwire"],
    local: ["Open Banking (where available)"],
    crypto: ["BTC", "ETH", "LTC", "USDT", "USDC", "DAI"],
  },
  AUD: {
    cards: ["Visa", "Mastercard", "American Express", "Discover", "Diners Club", "JCB", "UnionPay"],
    wallets: ["PayPal", "Apple Pay", "Google Pay", "Samsung Pay", "Amazon Pay", "Skrill", "Neteller"],
    bank: ["PayID", "NPP", "Bank Transfer"],
    local: ["POLi", "PayID"],
    crypto: ["BTC", "ETH", "LTC", "USDT", "USDC", "DAI"],
  },
  GBP: {
    cards: ["Visa", "Mastercard", "American Express", "Discover", "Diners Club", "JCB", "UnionPay"],
    wallets: ["PayPal", "Apple Pay", "Google Pay", "Samsung Pay", "Amazon Pay", "Skrill", "Neteller"],
    bank: ["Faster Payments", "CHAPS", "BACS"],
    local: ["Open Banking Payments", "Faster Payments"],
    crypto: ["BTC", "ETH", "LTC", "USDT", "USDC", "DAI"],
  },
  CAD: {
    cards: ["Visa", "Mastercard", "American Express", "Discover", "Diners Club", "JCB", "UnionPay"],
    wallets: ["PayPal", "Apple Pay", "Google Pay", "Samsung Pay", "Amazon Pay", "Skrill", "Neteller"],
    bank: ["Interac e-Transfer", "Wire Transfer"],
    local: ["Interac"],
    crypto: ["BTC", "ETH", "LTC", "USDT", "USDC", "DAI"],
  },
  BRL: {
    cards: ["Visa", "Mastercard", "American Express", "Discover", "Diners Club", "JCB", "UnionPay"],
    wallets: ["PayPal", "Mercado Pago", "PicPay", "Apple Pay / Google Pay (where available)"],
    bank: ["TED", "DOC", "PIX"],
    local: ["PIX", "Boleto BancÃ¡rio", "Mercado Pago", "PicPay"],
    crypto: ["BTC", "ETH", "LTC", "USDT", "USDC", "DAI"],
  },
} as const;

const paymentMethodRows = [
  ["Visa", "Card", "EUR, USD, GBP, AUD, CAD, BRL", "Fast checkout"],
  ["SEPA", "Bank Transfer", "EUR", "European transactions"],
  ["ACH", "Bank Transfer", "USD", "US domestic transfers"],
  ["PIX", "Local Payment", "BRL", "Instant Brazil payments"],
  ["Crypto", "Digital Asset", "Multi-currency equivalent", "Cross-border deals"],
] as const;

const trustAdvantages = [
  {
    title: "Transparent pricing",
    description: "Clear tiered pricing with no hidden fee layers at checkout.",
    icon: BadgeCheck,
  },
  {
    title: "Optional concierge handling",
    description: "Upgrade to dedicated transaction support for complex deals.",
    icon: Users,
  },
  {
    title: "Secure high-value transactions",
    description: "Built for digital assets, business transfers, and high-ticket sales.",
    icon: ShieldCheck,
  },
  {
    title: "Flexible global payments",
    description: "Cards, bank transfers, wallets, and crypto across key regions.",
    icon: CreditCard,
  },
] as const;

const whyChooseUsPoints = [
  "Lower fees on larger transactions",
  "Premium concierge for complex deals",
  "Multiple payment options",
  "Clear cost estimate before checkout",
] as const;

const howEscrowSteps = [
  {
    number: "01",
    title: "Buyer creates the transaction",
    description:
      "The buyer starts the transaction on our platform and defines the terms of the deal, including the transaction amount and delivery conditions.",
    icon: ClipboardList,
  },
  {
    number: "02",
    title: "Funds are secured",
    description:
      "The buyer sends the payment to our escrow account. The funds are securely held while the transaction progresses.",
    icon: Lock,
  },
  {
    number: "03",
    title: "Seller delivers",
    description:
      "The seller delivers the agreed product, service, or asset according to the transaction terms.",
    icon: Truck,
  },
  {
    number: "04",
    title: "Buyer reviews and approves",
    description:
      "The buyer confirms that the product or service matches the agreement.",
    icon: CheckCircle2,
  },
  {
    number: "05",
    title: "Funds are released",
    description:
      "Once the buyer approves the transaction, the escrow system releases the funds to the seller.",
    icon: Landmark,
  },
] as const;

const directPaymentPoints = [
  "Payment is sent directly to the seller",
  "Funds cannot easily be recovered if something goes wrong",
  "Limited proof of transaction terms",
  "Higher risk of fraud or disputes",
  "No neutral third party involved",
] as const;

const escrowTransactionPoints = [
  "Funds are securely held until transaction conditions are met",
  "Payment is released only after buyer approval",
  "All communication and terms are documented",
  "Dispute assistance available if needed",
  "Neutral platform managing the transaction",
] as const;

const escrowUseCases = [
  "High-value private sales",
  "Domain name transfers",
  "Buying or selling vehicles",
  "Freelance and remote services",
  "Digital asset transfers",
  "Business acquisitions",
] as const;

const paymentCategoryCards = [
  {
    title: "Cards",
    description:
      "Major credit and debit cards are supported for eligible transactions.",
    methods: [
      "Visa",
      "Mastercard",
      "American Express",
      "Discover",
      "Diners Club",
      "JCB",
      "UnionPay",
    ],
    currencies: ["EUR", "USD", "AUD", "GBP", "CAD", "BRL"],
    icon: CreditCard,
  },
  {
    title: "Digital wallets",
    description:
      "Digital wallets may be available depending on the transaction flow and payment region.",
    methods: [
      "PayPal",
      "Apple Pay",
      "Google Pay",
      "Samsung Pay",
      "Amazon Pay",
      "Skrill",
      "Neteller",
    ],
    currencies: ["EUR", "USD", "AUD", "GBP", "CAD", "BRL"],
    icon: Wallet,
  },
  {
    title: "Bank transfers",
    description:
      "Bank transfers are recommended for larger and lower-risk escrow transactions.",
    methods: ["SEPA", "ACH", "Wire", "Fedwire", "CHAPS", "BACS", "Interac", "PayID", "PIX"],
    currencies: ["EUR", "USD", "AUD", "GBP", "CAD", "BRL"],
    icon: Landmark,
  },
  {
    title: "Cryptocurrency",
    description:
      "Crypto payments may be supported for eligible transactions, subject to asset, network, and compliance review.",
    methods: ["BTC", "ETH", "LTC", "USDT", "USDC", "DAI"],
    currencies: ["Multi-network"],
    icon: ShieldCheck,
  },
] as const;

const highValuePaymentOptions = [
  "SWIFT Transfer",
  "International Wire Transfer",
  "Wise Transfer",
  "Revolut Business Transfer",
  "SEPA Corporate Payments",
] as const;

function sliderStep(value: number) {
  if (value < 10_000) return 100;
  if (value < 100_000) return 500;
  if (value < 1_000_000) return 5_000;
  if (value < 5_000_000) return 25_000;
  return 50_000;
}

function formatInputNumber(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value);
}

function SectionHeader({
  title,
  subtitle,
  detail,
}: {
  title: string;
  subtitle: string;
  detail?: string;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-2xl font-bold text-white">{title}</h3>
      <p className="text-zinc-300">{subtitle}</p>
      {detail ? <p className="text-sm text-zinc-400">{detail}</p> : null}
    </div>
  );
}

function CTA({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: {
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 md:p-6">
      <h4 className="text-xl font-bold text-white">{title}</h4>
      <p className="mt-2 text-zinc-300">{description}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild className="h-10 bg-white text-black hover:bg-zinc-200">
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
        <Button asChild variant="outline" className="h-10 border-zinc-600 text-white hover:bg-white/10">
          <Link href={secondaryHref}>{secondaryLabel}</Link>
        </Button>
      </div>
    </div>
  );
}

export function FeeCalculatorClient() {
  const [transactionAmount, setTransactionAmount] = useState(25_000);
  const [transactionAmountInput, setTransactionAmountInput] = useState("25,000");
  const [shippingAmount, setShippingAmount] = useState(0);
  const [shippingAmountInput, setShippingAmountInput] = useState("0");
  const [plan, setPlan] = useState<EscrowPlan>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("eu_card");

  const [savingsAmount, setSavingsAmount] = useState(250_000);
  const [savingsAmountInput, setSavingsAmountInput] = useState("250,000");
  const [savingsPlan, setSavingsPlan] = useState<EscrowPlan>("standard");
  const [savingsPaymentMethod, setSavingsPaymentMethod] = useState<PaymentMethod>("eu_card");

  const baseAmount = useMemo(
    () => Math.max(0, transactionAmount) + Math.max(0, shippingAmount),
    [shippingAmount, transactionAmount]
  );
  const escrowCalc = useMemo(() => calculateEscrowFee(baseAmount, plan), [baseAmount, plan]);
  const paymentCalc = useMemo(
    () => calculatePaymentFee(baseAmount, paymentMethod),
    [baseAmount, paymentMethod]
  );
  const totalFee = escrowCalc.fee + paymentCalc.fee;
  const totalCost = baseAmount + totalFee;
  const showCustomQuote = escrowCalc.customQuote || baseAmount > 10_000_000;
  const validAmount = transactionAmount > 0;

  const savingsEscrow = useMemo(
    () => calculateEscrowFee(savingsAmount, savingsPlan),
    [savingsAmount, savingsPlan]
  );
  const competitorEscrow = useMemo(
    () => calculateCompetitorEscrowFee(savingsAmount, "escrowCom"),
    [savingsAmount]
  );
  const competitorCrypto = useMemo(
    () => calculateCompetitorEscrowFee(savingsAmount, "cryptoExchange"),
    [savingsAmount]
  );
  const savingVsEscrow = competitorEscrow.fee - savingsEscrow.fee;
  const savingVsCrypto = competitorCrypto.fee - savingsEscrow.fee;
  const savingsMethodFee = useMemo(
    () => calculatePaymentFee(savingsAmount, savingsPaymentMethod),
    [savingsAmount, savingsPaymentMethod]
  );

  const onMoneyInput =
    (setInput: (value: string) => void, setValue: (value: number) => void, clamp = false) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextRaw = event.target.value;
      const parsed = parseCurrencyInput(nextRaw);
      setInput(nextRaw);
      setValue(clamp ? clampAmount(parsed, MIN_SLIDER_AMOUNT, MAX_SLIDER_AMOUNT) : parsed);
    };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white">
      <Navbar />
      <main className="mx-auto flex w-full max-w-[1380px] flex-col gap-8 px-4 py-8 md:px-6 lg:py-10">
        <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#161a24] via-[#12131a] to-[#0e0f14] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:p-10">
          <div className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative z-10 max-w-4xl space-y-4">
            <Badge className="bg-white/10 text-white">Transparent pricing Â· No hidden fees</Badge>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
              Calculate your escrow fee instantly
            </h1>
            <p className="max-w-3xl text-base text-zinc-300 sm:text-lg">
              See exactly what your transaction will cost before you start. Estimate escrow, processing,
              and total cost in seconds.
            </p>
            <p className="text-sm text-zinc-400">
              Built for both everyday deals and high-value transactions with transparent, scalable pricing.
            </p>
          </div>
        </section>

        <section id="fee-calculator-main" className={cn(sectionClass, "space-y-6")}>
          <SectionHeader
            title="Escrow fee calculator"
            subtitle="Real-time estimate for your transaction."
            detail="Transparent pricing with immediate calculations and clear fee breakdown."
          />

          <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader>
                <CardTitle className="text-white">Transaction inputs</CardTitle>
                <CardDescription>Set amount, plan, payment method and shipping.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-200">Transaction Amount (EUR)</label>
                  <Input
                    value={transactionAmountInput}
                    onChange={onMoneyInput(setTransactionAmountInput, setTransactionAmount)}
                    onBlur={() => setTransactionAmountInput(formatInputNumber(transactionAmount))}
                    inputMode="decimal"
                    placeholder="e.g. 25,000"
                    className="h-11 border-zinc-700 bg-zinc-900 text-base text-white"
                  />
                  <p className="text-xs text-zinc-500">Formatted: {formatCurrency(transactionAmount)}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-200">Transaction Type</label>
                  <Select value={plan} onValueChange={(value) => setPlan(value as EscrowPlan)}>
                    <SelectTrigger className="h-11 w-full border-zinc-700 bg-zinc-900 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="concierge">Concierge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-200">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                    <SelectTrigger className="h-11 w-full border-zinc-700 bg-zinc-900 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(paymentMethodConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-200">Shipping Amount (optional)</label>
                  <Input
                    value={shippingAmountInput}
                    onChange={onMoneyInput(setShippingAmountInput, setShippingAmount)}
                    onBlur={() => setShippingAmountInput(formatInputNumber(shippingAmount))}
                    inputMode="decimal"
                    placeholder="0"
                    className="h-11 border-zinc-700 bg-zinc-900 text-base text-white"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2">
                  <Checkbox
                    id="include-concierge"
                    checked={plan === "concierge"}
                    onCheckedChange={(checked) => setPlan(checked ? "concierge" : "standard")}
                  />
                  <label htmlFor="include-concierge" className="text-sm text-zinc-300">
                    Include concierge fee
                  </label>
                </div>

                {!validAmount ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                    Enter a valid transaction amount to calculate your estimate.
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader>
                <CardTitle className="text-white">Estimated result</CardTitle>
                <CardDescription>Premium, transparent fee breakdown.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4 text-sm">
                  <div className="flex items-center justify-between py-1 text-zinc-300">
                    <span>Transaction amount</span>
                    <span>{formatCurrency(transactionAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-zinc-300">
                    <span>Shipping</span>
                    <span>{formatCurrency(shippingAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-zinc-300">
                    <span>Selected plan</span>
                    <span className="capitalize">{plan}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-zinc-300">
                    <span>Escrow fee ({formatPercent(escrowCalc.rate)})</span>
                    <span>{formatCurrency(escrowCalc.fee)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-zinc-300">
                    <span>Payment processing fee</span>
                    <span>{formatCurrency(paymentCalc.fee)}</span>
                  </div>
                  {paymentCalc.hasNetworkFee ? (
                    <div className="flex items-center justify-between py-1 text-zinc-400">
                      <span>Network fee</span>
                      <span>+ variable network cost</span>
                    </div>
                  ) : null}
                  <div className="my-2 h-px bg-white/10" />
                  <div className="flex items-center justify-between py-1 text-base font-semibold text-white">
                    <span>Estimated total fee</span>
                    <span>{formatCurrency(totalFee)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-lg font-black text-white">
                    <span>Total amount to pay</span>
                    <span>{formatCurrency(totalCost)}</span>
                  </div>
                </div>

                {escrowCalc.minimumApplied ? (
                  <p className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-200">
                    Minimum fee applied for this tier ({formatCurrency(escrowCalc.minFee)}).
                  </p>
                ) : null}

                {showCustomQuote ? (
                  <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 p-3">
                    <p className="text-sm font-semibold text-emerald-200">
                      Custom pricing available for high-volume transactions.
                    </p>
                    <p className="mt-1 text-xs text-emerald-100/80">
                      Estimated rate shown for guidance. Contact sales for a custom quote.
                    </p>
                    <Button asChild className="mt-3 h-9 bg-emerald-500 text-black hover:bg-emerald-400">
                      <Link href="/contact">Request custom quote</Link>
                    </Button>
                  </div>
                ) : null}

                <p className="text-xs text-zinc-500">
                  Final fees may vary based on transaction review and payment network costs.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className={sectionClass}>
          <SectionHeader
            title="Escrow pricing table"
            subtitle="Authoritative tier structure for standard and concierge escrow."
          />
          <Table className="mt-4 hidden min-w-[1080px] md:table">
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-zinc-200">Transaction Amount (Merchandise + Shipping)</TableHead>
                <TableHead className="text-zinc-200">Standard</TableHead>
                <TableHead className="text-zinc-200">Concierge</TableHead>
                <TableHead className="text-zinc-200">Escrow Fee Example</TableHead>
                <TableHead className="text-zinc-200">Payment Method Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricingRows.map((row) => (
                <TableRow key={row[0]} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-semibold text-white">{row[0]}</TableCell>
                  <TableCell className="text-zinc-300">{row[1]}</TableCell>
                  <TableCell className="text-zinc-300">{row[2]}</TableCell>
                  <TableCell className="text-zinc-300">{row[3]}</TableCell>
                  <TableCell className="max-w-[360px] whitespace-normal text-zinc-400">{row[4]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 grid gap-3 md:hidden">
            {pricingRows.map((row) => (
              <Card key={row[0]} className="bg-[#0e0f11] ring-white/10">
                <CardHeader>
                  <CardTitle className="text-sm text-white">{row[0]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-zinc-300">
                  <p><span className="text-zinc-400">Standard:</span> {row[1]}</p>
                  <p><span className="text-zinc-400">Concierge:</span> {row[2]}</p>
                  <p><span className="text-zinc-400">Example:</span> {row[3]}</p>
                  <p className="text-zinc-500">{row[4]}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className={cn(sectionClass, "space-y-6")}>
          <SectionHeader
            title="Why clients choose our pricing"
            subtitle="Built to maximize clarity, trust, and execution speed across every deal size."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {trustAdvantages.map((item) => (
              <Card key={item.title} className="bg-[#0d0f12] ring-white/10">
                <CardHeader className="pb-2">
                  <item.icon className="mb-2 h-5 w-5 text-blue-300" />
                  <CardTitle className="text-base text-white">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-400">{item.description}</CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
            <p className="text-sm font-semibold text-white">Why clients choose us</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {whyChooseUsPoints.map((point) => (
                <div key={point} className="flex items-center gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={cn(sectionClass, "space-y-5")}>
          <SectionHeader
            title="Scalable pricing strategy for high-volume transactions"
            subtitle="Our fee model is engineered for both small transactions and enterprise-level deal flow."
          />

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardContent className="space-y-3 p-5 text-sm text-zinc-300">
                <p>
                  Fee percentages decrease as transaction value grows, helping repeat clients and high-volume
                  users reduce cost per deal while keeping security and operational quality high.
                </p>
                <p>
                  This pricing structure supports enterprise workflows across M&A deals, domain transfers,
                  luxury goods, vehicles, and other high-ticket transaction categories.
                </p>
                <p>
                  For larger deals, custom pricing can be evaluated to align volume, complexity, and support
                  requirements.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader>
                <CardTitle className="text-white">Built for retention and repeat volume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-300">
                <div className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 text-blue-300" />
                  <span>Lower effective fees as transaction size increases.</span>
                </div>
                <div className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 text-blue-300" />
                  <span>Concierge support for complex and multi-party structures.</span>
                </div>
                <div className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 text-blue-300" />
                  <span>Operational safeguards built for high-value deal confidence.</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-10 bg-white text-black hover:bg-zinc-200">
              <Link href="/market">Start a transaction</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 border-zinc-600 text-white hover:bg-white/10">
              <Link href="/contact">Contact sales</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 border-zinc-600 text-white hover:bg-white/10">
              <Link href="/contact">Request custom quote</Link>
            </Button>
          </div>
        </section>

        <section className={cn(sectionClass, "space-y-6")}>
          <SectionHeader
            title="What is Concierge Escrow?"
            subtitle="A premium escrow service for complex or high-value transactions."
            detail="Concierge escrow provides additional assistance and transaction management for deals that require more oversight, verification, or coordination between parties."
          />

          <div className="space-y-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 md:p-5 text-zinc-300">
            <p>
              With Concierge Escrow, our team actively assists in managing the transaction process. This
              includes coordinating communication between buyer and seller, verifying transaction details, and
              helping ensure that the deal progresses smoothly from start to completion.
            </p>
            <p>
              While standard escrow is designed for straightforward transactions, concierge escrow is
              recommended when deals require extra attention, documentation review, or multi-step delivery
              processes.
            </p>
          </div>

          <h4 className="text-lg font-semibold text-white">When concierge escrow is recommended</h4>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader className="pb-1">
                <HandCoins className="mb-2 h-5 w-5 text-blue-300" />
                <CardTitle className="text-sm text-white">High-value transactions</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400">
                Deals involving large financial amounts or sensitive assets.
              </CardContent>
            </Card>
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader className="pb-1">
                <Globe className="mb-2 h-5 w-5 text-blue-300" />
                <CardTitle className="text-sm text-white">Domain name transfers</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400">
                Coordination with registrars and ownership verification.
              </CardContent>
            </Card>
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader className="pb-1">
                <Building2 className="mb-2 h-5 w-5 text-blue-300" />
                <CardTitle className="text-sm text-white">Business acquisitions</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400">
                Transactions involving company assets or ownership changes.
              </CardContent>
            </Card>
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader className="pb-1">
                <Truck className="mb-2 h-5 w-5 text-blue-300" />
                <CardTitle className="text-sm text-white">Luxury goods or vehicles</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400">
                Verification, shipping coordination, or inspection support.
              </CardContent>
            </Card>
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader className="pb-1">
                <ClipboardList className="mb-2 h-5 w-5 text-blue-300" />
                <CardTitle className="text-sm text-white">Multi-step transactions</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400">
                Payment, verification, and delivery handled in stages.
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader>
                <CardTitle className="text-white">What concierge escrow includes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-300">
                {[
                  "Dedicated transaction support",
                  "Manual verification of transaction details",
                  "Assistance coordinating buyer and seller",
                  "Support for complex delivery processes",
                  "Priority customer support",
                  "Guidance through each transaction stage",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    <span>{point}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader>
                <CardTitle className="text-white">Standard vs Concierge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border border-white/10 bg-zinc-900 p-3 text-zinc-300">
                  <p className="font-semibold text-white">Standard Escrow</p>
                  <p className="mt-1">Self-service setup Â· Automated processing Â· Ideal for straightforward deals Â· Lower fee</p>
                </div>
                <div className="rounded-lg border border-blue-500/35 bg-blue-500/10 p-3 text-zinc-100">
                  <p className="font-semibold text-white">Concierge Escrow</p>
                  <p className="mt-1">Dedicated assistance Â· Manual verification Â· Ideal for complex/high-value deals Â· Premium fee</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 text-sm text-zinc-300">
            Our concierge team is experienced in managing complex escrow transactions across digital assets,
            high-value goods, and business deals.
          </p>

          <CTA
            title="Need help with a complex transaction?"
            description="Our concierge team can guide you through every step."
            primaryLabel="Start a Concierge Transaction"
            primaryHref="/market"
            secondaryLabel="Contact Support"
            secondaryHref="/contact"
          />
        </section>

        <section className={cn(sectionClass, "space-y-5")}>
          <SectionHeader
            title="Transparent pricing. Lower fees."
            subtitle="See how our escrow fees compare with other leading platforms."
            detail="Our pricing structure is designed to support both small transactions and high-value deals, with lower percentage fees as transaction size increases."
          />

          <div className="hidden overflow-x-auto rounded-xl border border-white/10 md:block">
            <Table className="min-w-[900px] bg-[#0d0f12]">
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-zinc-200">Transaction Amount</TableHead>
                  <TableHead className="text-blue-200">
                    <div className="flex items-center gap-2">
                      Our Escrow <Badge className="bg-blue-500 text-white">Best value</Badge>
                    </div>
                  </TableHead>
                  <TableHead className="text-zinc-200">Escrow.com</TableHead>
                  <TableHead className="text-zinc-200">CryptoExchange</TableHead>
                  <TableHead className="text-zinc-200">Estimated Savings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitorRows.map((row) => (
                  <TableRow key={row[0]} className="border-white/10 hover:bg-white/5">
                    <TableCell className="font-semibold text-white">{row[0]}</TableCell>
                    <TableCell className="font-semibold text-blue-200">{row[1]}</TableCell>
                    <TableCell className="text-zinc-300">{row[2]}</TableCell>
                    <TableCell className="text-zinc-300">{row[3]}</TableCell>
                    <TableCell className="font-semibold text-emerald-300">{row[4]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {competitorRows.map((row) => (
              <Card key={row[0]} className="bg-[#0e0f11] ring-white/10">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm text-white">{row[0]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-zinc-300">
                  <div className="flex items-center justify-between"><span>Our Escrow</span><span className="font-semibold text-blue-200">{row[1]}</span></div>
                  <div className="flex items-center justify-between"><span>Escrow.com</span><span>{row[2]}</span></div>
                  <div className="flex items-center justify-between"><span>CryptoExchange</span><span>{row[3]}</span></div>
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-center text-emerald-300">{row[4]}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-xs text-zinc-500">
            Competitor pricing based on publicly available fee structures. Actual fees may vary depending on
            payment method, transaction type, and additional services.
          </p>

          <CTA
            title="Start your escrow transaction today"
            description="Calculate your fees instantly and secure your transaction with our trusted escrow service."
            primaryLabel="Start Transaction"
            primaryHref="/market"
            secondaryLabel="Calculate Your Fee"
            secondaryHref="#fee-calculator-main"
          />
        </section>

        <section className={cn(sectionClass, "space-y-5")}>
          <SectionHeader
            title="See how much you could save"
            subtitle="Based on the same transaction value across major escrow providers."
            detail="These examples illustrate estimated escrow fees for typical transaction sizes."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {realExamples.map((example) => (
              <Card key={example.amount} className="bg-[#0d0f12] ring-white/10">
                <CardHeader>
                  <CardTitle className="text-white">{formatCurrency(example.amount)} transaction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-lg border border-blue-500/35 bg-blue-500/10 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-100">Our Escrow ({formatPercent(example.ourRate)})</span>
                      <Badge className="bg-blue-500 text-white">Lower fees</Badge>
                    </div>
                    <p className="mt-1 text-lg font-bold text-white">{formatCurrency(example.our)}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-zinc-900 p-3 text-zinc-300">
                    <div className="flex items-center justify-between">
                      <span>Escrow.com ({formatPercent(example.escrowRate)})</span>
                      <span className="font-semibold text-white">{formatCurrency(example.escrow)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>CryptoExchange ({formatPercent(example.cryptoRate)})</span>
                      <span className="font-semibold text-white">{formatCurrency(example.crypto)}</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-center text-emerald-300">
                    You save up to {formatCurrency(example.save)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-xs text-zinc-500">
            Competitor pricing based on publicly available fee schedules. Actual costs may vary depending on
            payment method and transaction structure.
          </p>

          <CTA
            title="Calculate your escrow fee in seconds"
            description="Use our fee calculator to see the exact cost for your transaction."
            primaryLabel="Start a transaction"
            primaryHref="/market"
            secondaryLabel="Calculate your fee"
            secondaryHref="#fee-calculator-main"
          />
        </section>

        <section className={cn(sectionClass, "space-y-6")}>
          <SectionHeader
            title="See your savings instantly"
            subtitle="Move the slider to compare your estimated escrow fees against other leading providers."
            detail="Our pricing is designed to stay competitive across both everyday and high-value transactions."
          />

          <div className="grid gap-5 xl:grid-cols-[1.06fr_0.94fr]">
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader>
                <CardTitle className="text-white">Savings calculator vs competitors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSavingsAmount(preset);
                        setSavingsAmountInput(formatInputNumber(preset));
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                        savingsAmount === preset
                          ? "border-blue-400 bg-blue-500/20 text-blue-100"
                          : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                      )}
                    >
                      {formatCurrency(preset)}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-200">Transaction amount</label>
                  <Input
                    value={savingsAmountInput}
                    onChange={onMoneyInput(setSavingsAmountInput, setSavingsAmount, true)}
                    onBlur={() => setSavingsAmountInput(formatInputNumber(savingsAmount))}
                    className="h-11 border-zinc-700 bg-zinc-900 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min={MIN_SLIDER_AMOUNT}
                    max={MAX_SLIDER_AMOUNT}
                    step={sliderStep(savingsAmount)}
                    value={savingsAmount}
                    onChange={(event) => {
                      const next = Number.parseInt(event.target.value, 10);
                      const value = Number.isFinite(next) ? next : MIN_SLIDER_AMOUNT;
                      setSavingsAmount(value);
                      setSavingsAmountInput(formatInputNumber(value));
                    }}
                    className="h-2 w-full cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{formatCurrency(MIN_SLIDER_AMOUNT)}</span>
                    <span>{formatCurrency(MAX_SLIDER_AMOUNT)}</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-200">Plan</label>
                    <Select value={savingsPlan} onValueChange={(value) => setSavingsPlan(value as EscrowPlan)}>
                      <SelectTrigger className="h-11 w-full border-zinc-700 bg-zinc-900 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="concierge">Concierge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-200">Payment method</label>
                    <Select
                      value={savingsPaymentMethod}
                      onValueChange={(value) => setSavingsPaymentMethod(value as PaymentMethod)}
                    >
                      <SelectTrigger className="h-11 w-full border-zinc-700 bg-zinc-900 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(paymentMethodConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-xs text-zinc-500">
                  Payment method fees shown apply to our platform estimate.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader>
                <CardTitle className="text-white">Live comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-blue-500/35 bg-blue-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-blue-100">Our estimated fee</p>
                    <Badge className="bg-blue-500 text-white">Best value</Badge>
                  </div>
                  <p className="mt-1 text-2xl font-black text-white">{formatCurrency(savingsEscrow.fee)}</p>
                  <p className="mt-1 text-xs text-blue-100/80">
                    Escrow {formatPercent(savingsEscrow.rate)} + processing {formatCurrency(savingsMethodFee.fee)}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-zinc-900 p-3 text-zinc-300">
                  <div className="flex items-center justify-between text-sm">
                    <span>Escrow.com estimated fee</span>
                    <span className="font-semibold text-white">{formatCurrency(competitorEscrow.fee)}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-zinc-900 p-3 text-zinc-300">
                  <div className="flex items-center justify-between text-sm">
                    <span>CryptoExchange estimated fee</span>
                    <span className="font-semibold text-white">{formatCurrency(competitorCrypto.fee)}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
                  {savingVsEscrow >= 0 ? (
                    <span className="text-emerald-300">You save {formatCurrency(savingVsEscrow)} vs Escrow.com</span>
                  ) : (
                    <span className="text-amber-300">Concierge premium vs Escrow.com: {formatCurrency(Math.abs(savingVsEscrow))}</span>
                  )}
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
                  {savingVsCrypto >= 0 ? (
                    <span className="text-emerald-300">You save {formatCurrency(savingVsCrypto)} vs CryptoExchange</span>
                  ) : (
                    <span className="text-amber-300">Concierge premium vs CryptoExchange: {formatCurrency(Math.abs(savingVsCrypto))}</span>
                  )}
                </div>

                {savingsEscrow.customQuote ? (
                  <div className="rounded-lg border border-blue-500/35 bg-blue-500/10 p-3">
                    <p className="text-sm font-semibold text-blue-100">
                      Custom pricing available for high-volume transactions.
                    </p>
                    <Button asChild className="mt-3 h-9 bg-white text-black hover:bg-zinc-200">
                      <Link href="/contact">Request custom quote</Link>
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-zinc-500">
            Competitor comparisons are based on publicly available standard fee schedules and may not include
            additional payment or service-related charges.
          </p>

          <CTA
            title="Ready to secure your transaction?"
            description="Calculate your exact escrow cost and start with confidence."
            primaryLabel="Start Transaction"
            primaryHref="/market"
            secondaryLabel="Contact Sales"
            secondaryHref="/contact"
          />
        </section>

        <section className={cn(sectionClass, "space-y-5")}>
          <SectionHeader
            title="Types of transactions we support"
            subtitle="Our escrow platform is designed to securely handle a wide range of transactions."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {supportedTransactions.map(([title, text, Icon]) => (
              <Card key={title} className="bg-[#0d0f12] ring-white/10">
                <CardHeader>
                  <Icon className="mb-2 h-5 w-5 text-blue-300" />
                  <CardTitle className="text-white">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-400">{text}</CardContent>
              </Card>
            ))}
          </div>

          <CTA
            title="Start a secure transaction today"
            description="Use escrow for transparent terms, protected funds, and trusted execution."
            primaryLabel="Start Transaction"
            primaryHref="/market"
            secondaryLabel="Learn how escrow works"
            secondaryHref="/secure-transaction"
          />
        </section>

        <section className={cn(sectionClass, "space-y-5")}>
          <SectionHeader
            title="All communication happens on our platform"
            subtitle="Secure messaging between buyer and seller ensures transparency and protection."
          />

          <div className="space-y-3 text-zinc-300">
            <p>
              To ensure maximum transparency and security, all communication between buyer and seller must
              take place within the secure chat provided on our platform.
            </p>
            <p>
              Our escrow system records the entire conversation and transaction process, helping our team
              verify agreements and resolve potential disputes.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 md:p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
              <h4 className="text-lg font-bold text-amber-200">Important</h4>
            </div>
            <p className="mt-2 text-sm text-amber-100">
              Only conversations that occur inside the platform&apos;s secure messaging system are covered by
              our escrow protection.
            </p>
            <p className="mt-2 text-sm text-amber-100">
              Any agreements, instructions, or negotiations that take place outside the platform are not
              covered by escrow protection.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["Full conversation history", "Every step of the transaction is documented."],
              ["Improved dispute resolution", "Our team can review the entire agreement process."],
              ["Transparency for both parties", "Buyer and seller always see the same information."],
              ["Safer transactions", "Reduced risk of fraud or misunderstandings."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-zinc-300">
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-1 text-zinc-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={cn(sectionClass, "space-y-5")}>
          <SectionHeader
            title="Escrow Protection for every transaction"
            subtitle="A portion of our escrow fees contributes to the protection of transactions on the platform."
          />

          <div className="space-y-3 text-zinc-300">
            <p>
              Our escrow service includes a protection mechanism designed to safeguard transactions
              conducted through our platform.
            </p>
            <p>
              A portion of the escrow fees collected is allocated to support operational safeguards and
              dispute resolution processes.
            </p>
            <p>
              This helps ensure that transactions are handled securely and that issues can be addressed
              fairly if they arise.
            </p>
          </div>

          <h4 className="text-lg font-semibold text-white">What escrow protection helps with</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader className="pb-1">
                <BadgeCheck className="mb-2 h-5 w-5 text-blue-300" />
                <CardTitle className="text-sm text-white">Transaction verification</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400">
                Helping ensure transaction terms are clear and documented.
              </CardContent>
            </Card>
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader className="pb-1">
                <MessagesSquare className="mb-2 h-5 w-5 text-blue-300" />
                <CardTitle className="text-sm text-white">Dispute assistance</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400">
                Support if disagreements arise between buyer and seller.
              </CardContent>
            </Card>
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader className="pb-1">
                <Lock className="mb-2 h-5 w-5 text-blue-300" />
                <CardTitle className="text-sm text-white">Secure payment handling</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400">
                Funds are held securely until transaction conditions are met.
              </CardContent>
            </Card>
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader className="pb-1">
                <ShieldCheck className="mb-2 h-5 w-5 text-blue-300" />
                <CardTitle className="text-sm text-white">Platform monitoring</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400">
                Transactions are monitored to reduce fraud risks.
              </CardContent>
            </Card>
          </div>

          <p className="rounded-xl border border-white/10 bg-zinc-900/70 p-4 text-sm text-zinc-300">
            Escrow protection applies only to transactions conducted and documented within the platform,
            including communications through the official messaging system.
          </p>
          <p className="text-sm text-zinc-300">
            Our goal is to provide a secure and transparent environment where both buyers and sellers can
            complete transactions with confidence.
          </p>

          <CTA
            title="Secure your transaction today"
            description="Start securely with transparent terms, protected funds, and clear transaction flow."
            primaryLabel="Start Transaction"
            primaryHref="/market"
            secondaryLabel="Calculate Fees"
            secondaryHref="#fee-calculator-main"
          />
        </section>

        <section className={cn(sectionClass, "space-y-6")}>
          <SectionHeader
            title="How escrow works"
            subtitle="A simple and secure process designed to protect both buyers and sellers."
            detail="Our escrow system ensures that funds are held securely until all transaction conditions are met."
          />

          <div className="relative">
            <div className="pointer-events-none absolute left-10 right-10 top-8 hidden h-px bg-white/10 lg:block" />
            <div className="grid gap-4 lg:grid-cols-5">
              {howEscrowSteps.map((step) => (
                <Card key={step.number} className="bg-[#0d0f12] ring-white/10">
                  <CardHeader className="space-y-3 pb-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-white/10 text-zinc-200">
                        Step {step.number}
                      </Badge>
                      <step.icon className="h-5 w-5 text-blue-300" />
                    </div>
                    <CardTitle className="text-sm text-white">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-zinc-400">{step.description}</CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 text-sm text-zinc-300">
            <p>
              Throughout the entire process, communication between buyer and seller takes place through the
              platform&apos;s secure messaging system.
            </p>
            <p className="mt-2 text-zinc-400">
              This ensures transparency and helps protect both parties.
            </p>
          </div>

          <CTA
            title="Start your secure transaction"
            description="Create an escrow transaction in minutes and protect both sides of the deal."
            primaryLabel="Start Transaction"
            primaryHref="/market"
            secondaryLabel="Calculate Fees"
            secondaryHref="#fee-calculator-main"
          />
        </section>

        <section className={cn(sectionClass, "space-y-6")}>
          <SectionHeader
            title="Why use escrow instead of direct payment?"
            subtitle="Escrow protects both buyers and sellers during a transaction."
            detail="When transactions happen directly between two parties, there is often a risk that one side may not fulfill the agreement. Escrow helps remove that risk by securely holding the payment until the agreed conditions are completed."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="bg-[#0d0f12] ring-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertTriangle className="h-5 w-5 text-amber-300" />
                  Direct Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-300">
                {directPaymentPoints.map((point) => (
                  <div key={point} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-zinc-500" />
                    <span>{point}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-blue-500/30 bg-blue-500/10 ring-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ShieldCheck className="h-5 w-5 text-blue-200" />
                  Escrow Transaction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-100">
                {escrowTransactionPoints.map((point) => (
                  <div key={point} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    <span>{point}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#0d0f12] ring-white/10">
            <CardHeader>
              <CardTitle className="text-white">When escrow is most useful</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {escrowUseCases.map((item) => (
                <Badge key={item} variant="secondary" className="bg-white/10 text-zinc-200">
                  {item}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <p className="text-sm text-zinc-300">
            Our escrow platform helps reduce risk for both sides by acting as a neutral and secure
            intermediary.
          </p>

          <CTA
            title="Protect your next transaction"
            description="Use escrow to ensure a secure and transparent transaction process."
            primaryLabel="Start Transaction"
            primaryHref="/market"
            secondaryLabel="Calculate Fees"
            secondaryHref="#fee-calculator-main"
          />
        </section>

        <section className={cn(sectionClass, "space-y-6")}>
          <SectionHeader
            title="Accepted payment methods"
            subtitle="We support a wide range of global and local payment methods for secure escrow transactions."
            detail="Available payment options may vary depending on transaction type, region, verification status, and risk review."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {paymentCategoryCards.map((category) => (
              <Card key={category.title} className="bg-[#0d0f12] ring-white/10">
                <CardHeader className="pb-2">
                  <category.icon className="mb-2 h-5 w-5 text-blue-300" />
                  <CardTitle className="text-base text-white">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {category.methods.map((method) => (
                      <Badge key={method} variant="secondary" className="bg-white/10 text-zinc-200">
                        {method}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {category.currencies.map((currency) => (
                      <Badge key={`${category.title}-${currency}`} className="bg-blue-500/20 text-blue-100">
                        {currency}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
            <h4 className="text-base font-semibold text-white">Regional payment support by currency</h4>
            <Tabs defaultValue="EUR" className="mt-4">
              <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto bg-zinc-900/80 p-1.5">
                {Object.keys(currencyMethodMap).map((currency) => (
                  <TabsTrigger
                    key={currency}
                    value={currency}
                    className="rounded-md border border-white/10 data-[state=active]:border-blue-400 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-100"
                  >
                    {currency}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(currencyMethodMap).map(([currency, methods]) => (
                <TabsContent key={currency} value={currency} className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="bg-[#0d0f12] ring-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white">Cards and wallets</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-zinc-300">
                        <p className="text-zinc-400">Cards: {methods.cards.join(", ")}</p>
                        <p className="text-zinc-400">Wallets: {methods.wallets.join(", ")}</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#0d0f12] ring-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white">Bank transfers ({currency})</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-zinc-300">
                        <div className="flex flex-wrap gap-1.5">
                          {methods.bank.map((method) => (
                            <Badge key={`${currency}-${method}`} variant="secondary" className="bg-white/10 text-zinc-200">
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#0d0f12] ring-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white">Local payment methods</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-zinc-300">
                        <div className="flex flex-wrap gap-1.5">
                          {methods.local.map((method) => (
                            <Badge key={`${currency}-local-${method}`} variant="secondary" className="bg-white/10 text-zinc-200">
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#0d0f12] ring-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white">Crypto (eligible transactions)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-zinc-300">
                        <div className="flex flex-wrap gap-1.5">
                          {methods.crypto.map((asset) => (
                            <Badge key={`${currency}-crypto-${asset}`} variant="secondary" className="bg-white/10 text-zinc-200">
                              {asset}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="space-y-3">
            <h4 className="text-base font-semibold text-white">Payment method overview</h4>
            <div className="hidden overflow-x-auto rounded-xl border border-white/10 md:block">
              <Table className="min-w-[760px] bg-[#0d0f12]">
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-zinc-200">Payment Method</TableHead>
                    <TableHead className="text-zinc-200">Type</TableHead>
                    <TableHead className="text-zinc-200">Supported Currencies</TableHead>
                    <TableHead className="text-zinc-200">Best For</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethodRows.map((row) => (
                    <TableRow key={row[0]} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-semibold text-white">{row[0]}</TableCell>
                      <TableCell className="text-zinc-300">{row[1]}</TableCell>
                      <TableCell className="text-zinc-300">{row[2]}</TableCell>
                      <TableCell className="text-zinc-300">{row[3]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 md:hidden">
              {paymentMethodRows.map((row) => (
                <Card key={row[0]} className="bg-[#0e0f11] ring-white/10">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm text-white">{row[0]}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs text-zinc-300">
                    <p><span className="text-zinc-400">Type:</span> {row[1]}</p>
                    <p><span className="text-zinc-400">Currencies:</span> {row[2]}</p>
                    <p><span className="text-zinc-400">Best for:</span> {row[3]}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="bg-[#0d0f12] ring-white/10">
            <CardHeader>
              <CardTitle className="text-white">Business and high-value payment options</CardTitle>
              <CardDescription>
                Recommended for large escrow transactions, international settlements, and business deals.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {highValuePaymentOptions.map((option) => (
                <Badge key={option} variant="secondary" className="bg-white/10 text-zinc-200">
                  {option}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
            <h4 className="text-sm font-semibold text-white">Payment availability and transaction review</h4>
            <p className="mt-2 text-sm text-zinc-300">
              Supported payment methods may vary depending on transaction size, asset type, jurisdiction,
              verification status, and internal risk checks.
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Certain payment methods may be restricted for higher-risk transactions or available only for
              verified users.
            </p>
          </div>

          <p className="rounded-xl border border-white/10 bg-zinc-900/70 p-4 text-sm text-zinc-300">
            For maximum transparency and protection, all transaction communication and terms must remain
            within the platform.
          </p>

          <CTA
            title="Start your transaction with a supported payment method"
            description="Choose the payment option that fits your transaction and complete the process securely through our escrow platform."
            primaryLabel="Start Transaction"
            primaryHref="/market"
            secondaryLabel="Calculate Fees"
            secondaryHref="#fee-calculator-main"
          />
        </section>
      </main>
    </div>
  );
}


