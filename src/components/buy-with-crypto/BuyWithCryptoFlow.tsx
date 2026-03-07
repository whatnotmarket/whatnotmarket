"use client";

import { useState, useRef } from "react";
import { ProductUrlInput } from "@/components/buy-with-crypto/ProductUrlInput";
import { BuyAnywhereWizard } from "@/components/buy-with-crypto/wizard/BuyAnywhereWizard";
import { WizardData } from "@/components/buy-with-crypto/wizard/types";
import { OrderSummaryCard } from "@/components/buy-with-crypto/OrderSummaryCard";
import { CryptoPaymentGateway } from "@/components/buy-with-crypto/CryptoPaymentGateway";
import { Squircle } from "@/components/ui/Squircle";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { analytics } from "@/lib/analytics";

type Step = "input" | "details" | "payment" | "confirmed";

export function BuyWithCryptoFlow() {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<WizardData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success">("pending");
  const [orderId, setOrderId] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleUrlSubmit = (submittedUrl: string, data?: any) => {
    setUrl(submittedUrl);
    analytics.track("proxy_order_url_submitted", { url: submittedUrl });
    if (data) {
      setPreviewData(data);
    }
    setStep("details");
    setTimeout(scrollToTop, 100);
  };

  const handleDetailsSubmit = (details: WizardData) => {
    setOrderDetails(details);
    analytics.track("proxy_order_details_submitted", {
      quantity: details.quantity,
      price: details.price,
      currency: details.currency,
      network: details.network,
    });
    setStep("payment");
    setTimeout(scrollToTop, 100);
  };

  const handlePaymentSuccess = async () => {
    setPaymentStatus("success");
    
    // Create order via API
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productUrl: url,
          ...orderDetails,
          totalPaid: (orderDetails?.price || 0) * (orderDetails?.quantity || 1) * 1.1 + 15 + 5 // Recalculate or pass from previous step
        })
      });
      
      const data = await res.json();
      if (data.ok) {
        setOrderId(data.orderId);
        setTrackingId(data.trackingId);
        analytics.track("proxy_order_payment_completed", {
          orderId: data.orderId,
          amount: (orderDetails?.price || 0) * (orderDetails?.quantity || 1) * 1.1 + 15 + 5,
          currency: orderDetails?.currency,
        });
        setStep("confirmed");
      }
    } catch (e) {
      console.error("Failed to create order", e);
      analytics.track("proxy_order_creation_failed", { error: String(e) });
    }
  };

  const copyTrackingLink = () => {
    navigator.clipboard.writeText(`https://whatnotmarket.app/track/${trackingId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetFlow = () => {
    setStep("input");
    setUrl("");
    setPreviewData(null);
    setOrderDetails(null);
    setPaymentStatus("pending");
    setOrderId("");
    setTrackingId("");
  };

  return (
    <div className="w-full relative">
      {/* Back button hidden for details step as wizard has its own navigation */}
      {step !== "input" && step !== "details" && step !== "confirmed" && (
        <button
          onClick={() => setStep(step === "payment" ? "details" : "input")}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors absolute top-0 left-0 z-20"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div
            key="input"
            // Remove initial animation so it's ready immediately
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
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
            className="w-full"
          >
            <BuyAnywhereWizard
              onSubmit={handleDetailsSubmit}
              onCancel={() => setStep("input")}
              initialUrl={url}
              initialData={previewData}
            />
          </motion.div>
        )}

        {step === "payment" && orderDetails && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="w-full grid md:grid-cols-2 gap-8 items-start pt-8"
          >
            <div className="space-y-8">
              <div className="sticky top-8">
                <OrderSummaryCard
                  productPrice={orderDetails.price || 0}
                  quantity={orderDetails.quantity}
                  currency="USD"
                />
              </div>
            </div>
            
            <div className="space-y-8">
              <CryptoPaymentGateway
                amount={(orderDetails.price || 0) * orderDetails.quantity * 1.1 + 15 + 5}
                currency={orderDetails.currency || "USDC"}
                network={orderDetails.network}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          </motion.div>
        )}

        {step === "confirmed" && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full space-y-12 pt-8"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg viewBox="0 0 1024 1024" className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M512 64a448 448 0 110 896 448 448 0 010-896zm-55.808 536.384l-99.52-99.584a38.4 38.4 0 10-54.336 54.336l126.72 126.72a38.272 38.272 0 0054.336 0l262.4-262.464a38.4 38.4 0 10-54.272-54.336L456.192 600.384z"></path></svg>
              </div>
              <h2 className="text-3xl font-bold text-white">Order Confirmed!</h2>
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
                      https://whatnotmarket.app/track/{trackingId}
                    </div>
                    <Button
                      onClick={copyTrackingLink}
                      className="shrink-0 bg-white text-black hover:bg-zinc-200"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Share this link to view real-time updates. No account required.
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

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={resetFlow}
                  className="bg-zinc-800 text-white px-8 py-3 font-bold hover:bg-zinc-700 transition-colors rounded-xl"
                >
                  Start New Order
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
