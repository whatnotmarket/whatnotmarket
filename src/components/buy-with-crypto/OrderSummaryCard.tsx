"use client";

import { Squircle } from "@/components/ui/Squircle";
import { formatCurrency } from "@/lib/utils"; // Assuming this exists or define it
import { ShieldCheck } from "lucide-react";

interface OrderSummaryCardProps {
  productPrice: number;
  quantity: number;
  currency: string;
}

export function OrderSummaryCard({ productPrice, quantity, currency }: OrderSummaryCardProps) {
  const serviceFeeRate = 0.10;
  const minFee = 5.00;
  
  const subtotal = productPrice * quantity;
  const serviceFee = Math.max(subtotal * serviceFeeRate, minFee);
  const total = subtotal + serviceFee;

  const format = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <h3 className="text-xl font-bold text-white">Summary</h3>
      
      <Squircle
        radius={24}
        smoothing={1}
        innerClassName="bg-[#1C1C1E] p-6 space-y-4 text-white"
      >
        <div className="flex justify-between items-center text-zinc-400">
          <span>Product Subtotal</span>
          <span>{format(subtotal)}</span>
        </div>
        
        <div className="flex justify-between items-center text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Service Fee (10%)</span>
            <div className="group relative">
              <ShieldCheck className="w-4 h-4 text-emerald-500 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black text-xs p-2 rounded hidden group-hover:block z-10 border border-white/10">
                Minimum fee of $5 applies. Covers proxy purchase and escrow protection.
              </div>
            </div>
          </div>
          <span>{format(serviceFee)}</span>
        </div>
        
        <div className="border-t border-white/10 my-4 pt-4 flex justify-between items-center text-lg font-bold">
          <span>Total to Pay</span>
          <span className="text-emerald-400">{format(total)}</span>
        </div>
        
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Payment secured via Escrow. Funds released only upon delivery.</span>
        </div>
      </Squircle>
    </div>
  );
}
