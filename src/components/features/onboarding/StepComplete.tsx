"use client";

/* eslint-disable react/no-unescaped-entities */
import { Check } from "lucide-react";

export function StepComplete() {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-6 py-12">
        <div className="mx-auto h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="h-12 w-12 text-emerald-500" />
        </div>
        
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">You're Verified</h1>
            <p className="text-zinc-400">You can now sell on openlymarket.</p>
        </div>

        <p className="text-sm text-zinc-500">Redirecting to marketplace...</p>
    </div>
  );
}

