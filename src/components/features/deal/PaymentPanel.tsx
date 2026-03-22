"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ExternalLink, RefreshCw, AlertTriangle, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { NETWORKS, CURRENCIES, getCurrenciesForNetwork, Network, Currency } from "@/lib/domains/payments/catalog";
import { createPaymentIntentAction, simulatePaymentDetection } from "@/app/(commerce)/deals/payment-actions"; // Adjust path if needed
import QRCode from "react-qr-code";
import { paymentsToast as toast } from "@/lib/domains/notifications";
import { cn } from "@/lib/core/utils/utils";

interface PaymentPanelProps {
  dealId: string;
  amount: number;
  isBuyer: boolean;
}

export function PaymentPanel({ dealId, amount, isBuyer }: PaymentPanelProps) {
  const [step, setStep] = useState<"select" | "deposit" | "funded">("select");
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);

  // Poll for status simulation
  useEffect(() => {
    if (step === "deposit" && paymentIntent) {
      const interval = setInterval(() => {
        // In a real app, fetch status from server
        // For MVP demo, we rely on manual "Simulate" button or just check local state
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [step, paymentIntent]);

  const handleCreateIntent = async () => {
    if (!selectedNetwork || !selectedCurrency) return;
    setLoading(true);

    try {
      // In a real app, dealId would be a UUID. For demo, we might use "d1".
      // The server action handles the mock fallback if DB insert fails.
      const result = await createPaymentIntentAction(dealId, selectedNetwork.id, selectedCurrency.id, amount);
      
      if (result.intent) {
        setPaymentIntent(result.intent);
        setStep("deposit");
      } else {
        toast.error("Failed to create payment intent");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (process.env.NODE_ENV !== "development") {
        toast.error("Simulation disabled in production");
        return;
    }
    setLoading(true);
    // Simulate detecting payment
    setTimeout(() => {
        setStep("funded");
        setLoading(false);
        toast.success("Payment Detected & Funded!");
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
    toast.success("Address copied");
  };

  if (step === "funded") {
    return (
      <Card className="bg-emerald-950/20 border-emerald-900/50 overflow-hidden">
        <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-emerald-400">Funds Secured in Escrow</h3>
                <p className="text-emerald-200/60 text-sm mt-1">
                    Wait for the seller to fulfill the order.
                </p>
            </div>
             <div className="bg-emerald-900/20 p-3 rounded-lg text-xs font-mono text-emerald-300 break-all">
                Tx: 0x7f...3a2b (Confirmed)
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/40 border-zinc-800 overflow-hidden">
      <CardHeader className="pb-3 border-b border-zinc-800/50">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Wallet className="h-4 w-4 text-indigo-400" />
            Secure Payment (Escrow)
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <AnimatePresence mode="wait">
            {step === "select" && (
                <motion.div
                    key="select"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 space-y-6"
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Select Network</label>
                            <div className="grid grid-cols-2 gap-2">
                                {NETWORKS.map(net => (
                                    <button
                                        key={net.id}
                                        onClick={() => {
                                            setSelectedNetwork(net);
                                            setSelectedCurrency(null);
                                        }}
                                        className={cn(
                                            "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                                            selectedNetwork?.id === net.id
                                                ? "bg-indigo-600/10 border-indigo-500 text-indigo-100"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                                        )}
                                    >
                                        <span className="font-semibold text-sm">{net.name}</span>
                                        <span className="text-xs opacity-70">{net.type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedNetwork && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-medium text-zinc-400">Select Token</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {getCurrenciesForNetwork(selectedNetwork.id).map(curr => (
                                        <button
                                            key={curr.id}
                                            onClick={() => setSelectedCurrency(curr)}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-lg border transition-all",
                                                selectedCurrency?.id === curr.id
                                                    ? "bg-indigo-600/10 border-indigo-500 text-indigo-100"
                                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                                            )}
                                        >
                                            <span className="font-semibold text-sm">{curr.symbol}</span>
                                            {curr.isStablecoin && (
                                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Stable</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Button 
                        onClick={handleCreateIntent}
                        disabled={!selectedNetwork || !selectedCurrency || loading}
                        className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-medium"
                    >
                        {loading ? "Generating Address..." : `Pay $${amount} via ${selectedCurrency?.symbol || 'Crypto'}`}
                    </Button>
                </motion.div>
            )}

            {step === "deposit" && paymentIntent && (
                <motion.div
                    key="deposit"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6 space-y-6"
                >
                    <div className="text-center space-y-2">
                        <div className="text-sm text-zinc-400 uppercase tracking-wider font-medium">Send exact amount</div>
                        <div className="text-3xl font-bold font-mono text-white tracking-tight">
                            {amount} <span className="text-indigo-400">{paymentIntent.pay_token_id}</span>
                        </div>
                         <div className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                            on <span className="text-zinc-300 font-medium">{selectedNetwork?.name}</span> Network
                        </div>
                    </div>

                    <div className="flex justify-center bg-white p-4 rounded-xl w-fit mx-auto">
                        <QRCode value={paymentIntent.deposit_address} size={160} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500 uppercase">Deposit Address</label>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-zinc-950 p-3 rounded-lg text-xs font-mono text-zinc-300 break-all border border-zinc-800">
                                {paymentIntent.deposit_address}
                            </code>
                            <Button size="icon" variant="outline" className="shrink-0 border-zinc-700 text-zinc-400 hover:text-white" onClick={() => copyToClipboard(paymentIntent.deposit_address)}>
                                {copying ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                         <div className="flex items-center gap-2 text-xs text-yellow-500/80 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Only send {paymentIntent.pay_token_id} on {selectedNetwork?.name}.</span>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm text-zinc-300">Scanning blockchain...</span>
                        </div>
                        
                        <Button 
                            variant="secondary" 
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                            onClick={handleSimulatePayment}
                            disabled={loading}
                        >
                            {loading ? "Confirming..." : "Simulate Payment (Demo)"}
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}




