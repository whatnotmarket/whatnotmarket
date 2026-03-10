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
import { ArrowLeft, Copy, Check } from "lucide-react";
import Link from "next/link";

type Step = "input" | "details" | "payment" | "confirmed";
type ProxyOrderDetails = {
  price: number;
  quantity: number;
  currency?: string;
  network?: string;
  paymentMethod?: string;
  [key: string]: unknown;
};

export default function BuyWithCryptoPage() {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [orderDetails, setOrderDetails] = useState<ProxyOrderDetails | null>(null);
  const [orderId, setOrderId] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [trackingAccessToken, setTrackingAccessToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

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
            Back
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
              <ProductUrlInput onUrlSubmit={handleUrlSubmit} />
            </motion.div>
          )}

          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Configure Order</h2>
                <p className="text-zinc-400">Review details and confirm price.</p>
              </div>
              <ProxyOrderForm onSubmit={handleDetailsSubmit} productUrl={url} />
            </motion.div>
          )}

          {step === "payment" && orderDetails && orderId && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full grid md:grid-cols-2 gap-8 items-start"
            >
              <div className="space-y-8">
                <div className="sticky top-8">
                  <OrderSummaryCard
                    productPrice={orderDetails.price}
                    quantity={orderDetails.quantity}
                    currency="USD"
                  />
                </div>
              </div>
              
              <div className="space-y-8">
                <CryptoPaymentGateway
                  orderId={orderId}
                  orderAccessToken={trackingAccessToken}
                  amount={orderDetails.price * orderDetails.quantity * 1.1 + 15 + 5} // Includes 10% fee + $15 shipping + $5 network
                  currency="USDC"
                  onSuccess={handlePaymentSuccess}
                />
              </div>
            </motion.div>
          )}

          {step === "confirmed" && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg viewBox="0 0 1024 1024" className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M512 64a448 448 0 110 896 448 448 0 010-896zm-55.808 536.384l-99.52-99.584a38.4 38.4 0 10-54.336 54.336l126.72 126.72a38.272 38.272 0 0054.336 0l262.4-262.464a38.4 38.4 0 10-54.272-54.336L456.192 600.384z"></path></svg>
                </div>
                <h2 className="text-3xl font-bold">Order Confirmed!</h2>
                <p className="text-zinc-400 max-w-md mx-auto">
                  Your proxy order is created. You can track updates using the link below.
                </p>
              </div>

              <div className="max-w-xl mx-auto space-y-8">
                {/* Tracking Link Block */}
                <Squircle
                  radius={20}
                  smoothing={1}
                  innerClassName="bg-[#1C1C1E] p-6 space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Tracking Link</label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-zinc-300 font-semibold text-sm truncate">
                        {`https://whatnotmarket.app/track/${trackingId}?access=***`}
                      </div>
                      <Button
                        onClick={copyTrackingLink}
                        className="shrink-0 bg-white text-black hover:bg-zinc-200"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Keep this link private. Anyone with it can view order updates.
                    </p>
                  </div>
                </Squircle>

                {/* Initial Status */}
                <div className="relative pl-8 border-l-2 border-emerald-500 space-y-4">
                  <div className="space-y-1">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-emerald-500" />
                    <h4 className="font-bold text-white">Payment Confirmed</h4>
                    <p className="text-sm text-zinc-400">We have received your payment.</p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-[41px] top-2 w-4 h-4 rounded-full bg-black border-2 border-zinc-700 animate-pulse" />
                    <h4 className="font-bold text-emerald-400">Order Processing</h4>
                    <p className="text-sm text-zinc-400">We are processing your order...</p>
                  </div>
                </div>

                <div className="flex justify-center pt-8">
                  <Link href="/market">
                    <Squircle
                      radius={20}
                      smoothing={1}
                      innerClassName="bg-white text-black px-8 py-3 font-bold hover:bg-zinc-200 transition-colors"
                    >
                      Return to Market
                    </Squircle>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
