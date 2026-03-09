"use client";

import { useState } from "react";
import { ProductUrlInput } from "@/components/buy-with-crypto/ProductUrlInput";
import { ProxyOrderForm } from "@/components/buy-with-crypto/ProxyOrderForm";
import { OrderSummaryCard } from "@/components/buy-with-crypto/OrderSummaryCard";
import { CryptoPaymentGateway } from "@/components/buy-with-crypto/CryptoPaymentGateway";
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, CheckCircle2, Copy } from "lucide-react";
import Link from "next/link";
import { CopyMap } from "@/lib/copy-system";
import { calculateOrderCost } from "@/lib/pricing";

type Step = "input" | "details" | "payment" | "confirmed";

type ProxyOrderDetails = {
  quantity: number;
  options: string;
  pickupDetails: {
    city: string;
    country: string;
    region: string;
  };
  notes: string;
  price: number;
};

type CreateOrderResponse = {
  ok: boolean;
  orderId?: string;
  trackingId?: string;
  error?: string;
};

const PAYMENT_CURRENCY = "USDC";
const PAYMENT_NETWORK = "ERC20";

export function BuyWithCryptoClient({ copy }: { copy: CopyMap }) {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [orderDetails, setOrderDetails] = useState<ProxyOrderDetails | null>(null);
  const [orderId, setOrderId] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [copied, setCopied] = useState(false);

  const input = copy["input"] || {};
  const details = copy["details"] || {};
  const payment = copy["payment"] || {};
  const confirmed = copy["confirmed"] || {};
  const actions = copy["actions"] || {};

  const pricing = orderDetails
    ? calculateOrderCost(orderDetails.price, orderDetails.quantity)
    : null;
  const trackingLink = trackingId ? `/track/${trackingId}` : "/track";

  const handleUrlSubmit = (submittedUrl: string) => {
    setUrl(submittedUrl);
    setStep("details");
  };

  const handleDetailsSubmit = (submittedDetails: ProxyOrderDetails) => {
    setOrderDetails(submittedDetails);
    setStep("payment");
  };

  const handlePaymentSuccess = async () => {
    if (!orderDetails) return;

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productUrl: url,
          price: orderDetails.price,
          quantity: orderDetails.quantity,
          currency: PAYMENT_CURRENCY,
          network: PAYMENT_NETWORK,
          city: orderDetails.pickupDetails.city,
          country: orderDetails.pickupDetails.country,
          region: orderDetails.pickupDetails.region,
          totalPaid: pricing?.total ?? 0,
        }),
      });

      const data = (await res.json()) as CreateOrderResponse;
      if (!data.ok || !data.orderId || !data.trackingId) {
        console.error("Failed to create order", data.error || "Unknown response");
        return;
      }

      setOrderId(data.orderId);
      setTrackingId(data.trackingId);
      setStep("confirmed");
    } catch (error) {
      console.error("Failed to create order", error);
    }
  };

  const copyTrackingLink = () => {
    if (!trackingId) return;

    navigator.clipboard.writeText(`https://whatnotmarket.app/track/${trackingId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white">
      <Navbar />

      <main className="relative mx-auto max-w-4xl space-y-12 px-4 py-12">
        <div className="pointer-events-none absolute top-0 left-1/2 h-[500px] w-full -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />

        {step !== "input" && step !== "confirmed" && (
          <button
            onClick={() => setStep(step === "payment" ? "details" : "input")}
            className="absolute top-4 left-4 flex items-center gap-2 text-zinc-500 transition-colors hover:text-white md:left-0"
          >
            <ArrowLeft className="h-4 w-4" />
            {actions.back || "Back"}
          </button>
        )}

        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex min-h-[60vh] w-full flex-col items-center justify-center"
            >
              <ProductUrlInput
                onUrlSubmit={handleUrlSubmit}
                placeholderText={input.placeholder}
                buttonText={input.button}
              />
            </motion.div>
          )}

          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <h1 className="mb-8 text-center text-3xl font-bold">
                {details.title || "Conferma Dettagli"}
              </h1>
              <div className="grid gap-8 md:grid-cols-2">
                <ProxyOrderForm initialUrl={url} onSubmit={handleDetailsSubmit} />
                <div className="hidden md:block">
                  <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-[#1C1C1E] p-6 text-zinc-500">
                    Product Preview
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "payment" && orderDetails && pricing && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <h1 className="mb-8 text-center text-3xl font-bold">
                {payment.title || "Pagamento Sicuro"}
              </h1>
              <div className="grid gap-8 md:grid-cols-[1fr_350px]">
                <CryptoPaymentGateway
                  amount={pricing.total}
                  currency={PAYMENT_CURRENCY}
                  network={PAYMENT_NETWORK}
                  onSuccess={handlePaymentSuccess}
                />
                <OrderSummaryCard
                  productPrice={orderDetails.price}
                  quantity={orderDetails.quantity}
                  currency="USD"
                />
              </div>
            </motion.div>
          )}

          {step === "confirmed" && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto w-full max-w-md"
            >
              <Squircle
                radius={32}
                smoothing={1}
                className="w-full shadow-2xl shadow-emerald-900/20"
                innerClassName="bg-[#1C1C1E] border border-emerald-500/20 p-8 text-center"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>

                <h2 className="mb-2 text-2xl font-bold text-white">
                  {confirmed.title || "Ordine Creato!"}
                </h2>
                <p className="mb-8 text-zinc-400">
                  {confirmed.subtitle ||
                    "Il tuo ordine proxy e' stato avviato. Segui lo stato con il tracking ID."}
                </p>

                <div className="mb-8 space-y-3">
                  <div className="rounded-xl border border-white/5 bg-black/30 p-4 text-left">
                    <p className="mb-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                      Order ID
                    </p>
                    <code className="font-mono text-sm text-white">{orderId}</code>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 p-4">
                    <code className="text-lg font-mono text-emerald-400">{trackingId}</code>
                    <button
                      onClick={copyTrackingLink}
                      className="rounded-lg p-2 transition-colors hover:bg-white/10"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Copy className="h-5 w-5 text-zinc-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    asChild
                    className="h-12 w-full rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                  >
                    <Link href={trackingLink}>{actions.track_order || "Traccia Ordine"}</Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full text-zinc-400 hover:text-white">
                    <Link href="/market">{actions.back_home || "Torna alla Home"}</Link>
                  </Button>
                </div>
              </Squircle>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
