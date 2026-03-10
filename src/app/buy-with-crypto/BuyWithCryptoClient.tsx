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
import { ArrowLeft, CheckCircle2, Copy, Check } from "lucide-react";
import Link from "next/link";
import { CopyMap } from "@/lib/copy-system";

type Step = "input" | "details" | "payment" | "confirmed";
type ProxyOrderDetails = {
  price: number;
  quantity: number;
  paymentMethod?: string;
  currency?: string;
  network?: string;
  [key: string]: unknown;
};

export function BuyWithCryptoClient({ copy }: { copy: CopyMap }) {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [orderDetails, setOrderDetails] = useState<ProxyOrderDetails | null>(null);
  const [orderId, setOrderId] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [trackingAccessToken, setTrackingAccessToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const input = copy['input'] || {};
  const details = copy['details'] || {};
  const payment = copy['payment'] || {};
  const confirmed = copy['confirmed'] || {};
  const actions = copy['actions'] || {};

  const handleUrlSubmit = (submittedUrl: string) => {
    setUrl(submittedUrl);
    setStep("details");
  };

  const handleDetailsSubmit = async (details: ProxyOrderDetails) => {
    if (isCreatingOrder) return;
    setIsCreatingOrder(true);
    setOrderDetails(details);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productUrl: url,
          ...details,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            orderId?: string;
            trackingId?: string;
            trackingAccessToken?: string;
            error?: string;
          }
        | null;
      if (!res.ok || !data?.ok || !data.orderId || !data.trackingId || !data.trackingAccessToken) {
        throw new Error(data?.error || "Unable to create order");
      }
      setOrderId(data.orderId);
      setTrackingId(data.trackingId);
      setTrackingAccessToken(data.trackingAccessToken);
      setStep("payment");
    } catch (e) {
      console.error("Failed to create order", e);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setStep("confirmed");
  };

  const copyTrackingLink = () => {
    const accessQuery = trackingAccessToken ? `?access=${encodeURIComponent(trackingAccessToken)}` : "";
    navigator.clipboard.writeText(`https://whatnotmarket.app/track/${trackingId}${accessQuery}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-12 space-y-12 relative">
        {/* Background Ambient Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Back Button */}
        {step !== "input" && step !== "confirmed" && (
          <button
            onClick={() => setStep(step === "payment" ? "details" : "input")}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors absolute top-4 left-4 md:left-0"
          >
            <ArrowLeft className="w-4 h-4" />
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
              className="w-full flex flex-col items-center justify-center min-h-[60vh]"
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
              <h1 className="text-3xl font-bold text-center mb-8">{details.title || "Conferma Dettagli"}</h1>
              <div className="grid md:grid-cols-2 gap-8">
                <ProxyOrderForm productUrl={url} onSubmit={handleDetailsSubmit} />
                <div className="hidden md:block">
                   {/* Placeholder for preview or info */}
                   <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 h-full flex items-center justify-center text-zinc-500">
                      Product Preview
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "payment" && orderDetails && orderId && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <h1 className="text-3xl font-bold text-center mb-8">{payment.title || "Pagamento Sicuro"}</h1>
              <div className="grid md:grid-cols-[1fr_350px] gap-8">
                <CryptoPaymentGateway 
                  orderId={orderId}
                  orderAccessToken={trackingAccessToken}
                  amount={orderDetails.price * orderDetails.quantity * 1.1 + 20} // Mock calc
                  currency={orderDetails.paymentMethod || "USDT"}
                  onSuccess={handlePaymentSuccess} 
                />
                <OrderSummaryCard 
  productPrice={orderDetails.price}
  quantity={orderDetails.quantity}
  currency={orderDetails.paymentMethod || "USDT"}
/>
              </div>
            </motion.div>
          )}

          {step === "confirmed" && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md mx-auto"
            >
              <Squircle
                radius={32}
                smoothing={1}
                className="w-full shadow-2xl shadow-emerald-900/20"
                innerClassName="bg-[#1C1C1E] border border-emerald-500/20 p-8 text-center"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">{confirmed.title || "Ordine Creato!"}</h2>
                <p className="text-zinc-400 mb-8">
                  {confirmed.subtitle || "Il tuo ordine proxy è stato avviato. Segui lo stato con il tracking ID."}
                </p>

                <div className="bg-black/30 rounded-xl p-4 mb-8 flex items-center justify-between border border-white/5">
                  <code className="text-emerald-400 font-mono text-lg">{trackingId || "TRK-12345678"}</code>
                  <button 
                    onClick={copyTrackingLink}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-zinc-400" />}
                  </button>
                </div>

                <div className="space-y-3">
                  <Button asChild className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
                    <Link
                      href={`/track/${encodeURIComponent(trackingId)}?access=${encodeURIComponent(trackingAccessToken)}`}
                    >
                      {actions.track_order || "Traccia Ordine"}
                    </Link>
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
