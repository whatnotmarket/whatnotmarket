"use client";

import { motion } from "framer-motion";
import { ShoppingBag, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepRoleProps {
  role: "buyer" | "seller" | "both" | null;
  setRole: (role: "buyer" | "seller" | "both") => void;
  onSubmit: () => void;
  loading: boolean;
}

export function StepRole({ role, setRole, onSubmit, loading }: StepRoleProps) {
  return (
    <motion.div
        key="step0"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">How do you want to use whatnotmarket?</h1>
            <p className="text-zinc-400">Choose your primary intent. You can change this later.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
            <button
                onClick={() => setRole("buyer")}
                className={`p-6 rounded-xl border text-left transition-all ${
                    role === "buyer" 
                        ? "bg-white text-black border-white" 
                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                }`}
            >
                <div className="flex items-center gap-3 mb-2">
                    <ShoppingBag className="h-5 w-5" />
                    <span className="font-semibold text-lg">I want to buy</span>
                </div>
                <p className={`text-sm ${role === "buyer" ? "text-zinc-600" : "text-zinc-500"}`}>
                    Create requests, review offers, chat, and complete secure deals.
                </p>
            </button>

            <button
                onClick={() => setRole("seller")}
                className={`p-6 rounded-xl border text-left transition-all ${
                    role === "seller" 
                        ? "bg-white text-black border-white" 
                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                }`}
            >
                <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="h-5 w-5" />
                    <span className="font-semibold text-lg">I want to sell</span>
                </div>
                <p className={`text-sm ${role === "seller" ? "text-zinc-600" : "text-zinc-500"}`}>
                    Respond to requests, post listings, and get paid via escrow.
                </p>
            </button>

            <button
                onClick={() => setRole("both")}
                className={`p-6 rounded-xl border text-left transition-all ${
                    role === "both" 
                        ? "bg-white text-black border-white" 
                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                }`}
            >
                <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-lg">Both</span>
                </div>
                <p className={`text-sm ${role === "both" ? "text-zinc-600" : "text-zinc-500"}`}>
                    Full access to all features.
                </p>
            </button>
        </div>

        <Button 
            onClick={onSubmit}
            disabled={!role || loading}
            className="w-full h-12 text-lg bg-white text-black hover:bg-zinc-200"
        >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
        </Button>
    </motion.div>
  );
}
