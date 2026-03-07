"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StepPayoutProps {
  payoutAddress: string;
  setPayoutAddress: (val: string) => void;
  payoutNetwork: string;
  setPayoutNetwork: (val: string) => void;
  payoutCurrency: string;
  setPayoutCurrency: (val: string) => void;
  feeAcknowledged: boolean;
  setFeeAcknowledged: (val: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

export function StepPayout({
  payoutAddress,
  setPayoutAddress,
  payoutNetwork,
  setPayoutNetwork,
  payoutCurrency,
  setPayoutCurrency,
  feeAcknowledged,
  setFeeAcknowledged,
  onSubmit,
  onBack,
  loading
}: StepPayoutProps) {
  return (
    <motion.div
        key="step1"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Set up your payout wallet</h1>
            <p className="text-zinc-400">Where should we send your funds after a successful sale?</p>
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Payout Address</label>
                <Input 
                    value={payoutAddress}
                    onChange={(e) => setPayoutAddress(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && payoutAddress && feeAcknowledged && !loading) {
                            onSubmit();
                        }
                    }}
                    placeholder="0x..." 
                    className="h-12 font-mono bg-zinc-900/50 border-zinc-800 focus:border-white/20"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Network</label>
                    <select 
                        value={payoutNetwork}
                        onChange={(e) => setPayoutNetwork(e.target.value)}
                        className="flex h-12 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                        <option value="ethereum-mainnet">Ethereum Mainnet</option>
                        <option value="polygon-mainnet">Polygon</option>
                        <option value="base-mainnet">Base</option>
                        <option value="bitcoin-mainnet">Bitcoin</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Currency</label>
                    <select 
                        value={payoutCurrency}
                        onChange={(e) => setPayoutCurrency(e.target.value)}
                        className="flex h-12 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                        <option value="USDC">USDC</option>
                        <option value="USDT">USDT</option>
                        <option value="ETH">ETH</option>
                        <option value="BTC">BTC</option>
                    </select>
                </div>
            </div>

            <div className="bg-zinc-900/30 p-4 rounded-lg border border-zinc-800 text-sm text-zinc-400 space-y-3">
                <p>
                    Payments are handled through a secure middleman flow (escrow). The buyer funds the deal, we hold the funds, then release to you when the deal is completed. A platform fee (2.5%) is applied.
                </p>
                <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                        feeAcknowledged ? "bg-white border-white text-black" : "border-zinc-600 group-hover:border-zinc-400"
                    }`}>
                        {feeAcknowledged && <Check className="h-3 w-3" />}
                    </div>
                    <input 
                        type="checkbox" 
                        checked={feeAcknowledged}
                        onChange={(e) => setFeeAcknowledged(e.target.checked)}
                        className="hidden"
                    />
                    <span className={feeAcknowledged ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}>
                        I understand whatnotmarket holds funds during the deal and charges a fee on successful completion.
                    </span>
                </label>
            </div>
        </div>

        <div className="flex gap-4">
            <Button variant="ghost" onClick={onBack} className="flex-1">Back</Button>
            <Button 
                onClick={onSubmit}
                disabled={!payoutAddress || !feeAcknowledged || loading}
                className="flex-[2] h-12 text-lg bg-white text-black hover:bg-zinc-200"
            >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
            </Button>
        </div>
    </motion.div>
  );
}
