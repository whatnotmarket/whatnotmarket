"use client";

import { motion } from "framer-motion";
/* eslint-disable react/no-unescaped-entities */
import { Check } from "lucide-react";

export function StepComplete() {
  return (
    <motion.div
        key="step3"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 py-12"
    >
        <div className="mx-auto h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="h-12 w-12 text-emerald-500" />
        </div>
        
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">You're Verified</h1>
            <p className="text-zinc-400">You can now sell on openlymarket.</p>
        </div>

        <p className="text-sm text-zinc-500">Redirecting to marketplace...</p>
    </motion.div>
  );
}

