"use client";

import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/Button";
import { StepProps } from "./types";
import { Edit2 } from "lucide-react";
import { CRYPTO_CURRENCIES } from "@/contexts/CryptoContext";

export function StepReviewAndPay({ data, onBack, onNext, initialUrl, initialData }: StepProps) {
  // Mock fee calculation
  const subtotal = (data.price || 0) * data.quantity;
  const serviceFee = subtotal * 0.10; // 10% fee
  const shippingFee = 15.00; // Fixed shipping rate
  const networkFee = 5; // Flat $5 for now
  const total = subtotal + serviceFee + shippingFee + networkFee;

  const cryptoData = CRYPTO_CURRENCIES.find(c => c.code === data.currency);

  // Since we don't have direct "jump to step" logic exposed in props easily (except manually handling state in parent),
  // we can rely on the user going "Back" or we can implement a jump callback if needed.
  // For now, "Edit" buttons will just look nice or we can add `onEditStep` to props later.
  // To keep it simple as per instructions, we just show the summary.
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Review Order</h3>
        <p className="text-sm text-zinc-400">
          Please review your details before proceeding to payment.
        </p>
      </div>

      <div className="space-y-4">
        {/* Product Summary */}
        <Squircle radius={20} smoothing={1} innerClassName="bg-[#1C1C1E] p-4 flex gap-4">
           {initialData?.image && (
            <img 
              src={initialData.image} 
              alt="Product" 
              className="w-16 h-16 object-cover rounded-lg bg-white/5"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white truncate">{initialData?.title || "Product"}</h4>
            <p className="text-xs text-zinc-400 truncate">{initialUrl}</p>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="text-zinc-300">{data.quantity}x</span>
              <span className="text-white font-bold">${data.price?.toFixed(2)}</span>
            </div>
          </div>
        </Squircle>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Squircle radius={16} smoothing={1} innerClassName="bg-[#1C1C1E] p-4 space-y-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Options</span>
            <p className="text-white font-medium">{data.options || "None"}</p>
          </Squircle>
          
          <Squircle radius={16} smoothing={1} innerClassName="bg-[#1C1C1E] p-4 space-y-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Payment</span>
            <div className="flex items-center gap-2">
              {cryptoData && (
                <img 
                  src={cryptoData.Icon} 
                  alt={data.currency} 
                  className="w-5 h-5 rounded-full bg-white/10"
                />
              )}
              <p className="text-white font-medium">
                {data.currency} <span className="text-zinc-500 text-sm">({data.network || "Native"})</span>
              </p>
            </div>
          </Squircle>

          <Squircle radius={16} smoothing={1} innerClassName="bg-[#1C1C1E] p-4 space-y-1 md:col-span-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Delivery</span>
            <div className="flex flex-col">
              <span className="text-white font-medium">{data.city}, {data.country}</span>
              {data.region && <span className="text-sm text-zinc-400">{data.region}</span>}
              <span className="text-xs text-emerald-400 mt-1">Locker Pickup</span>
            </div>
          </Squircle>

          {data.telegramUsername && (
             <Squircle radius={16} smoothing={1} innerClassName="bg-[#1C1C1E] p-4 space-y-1 md:col-span-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Contact</span>
              <p className="text-white font-medium">@{data.telegramUsername.replace("@", "")}</p>
            </Squircle>
          )}

          {data.notes && (
             <Squircle radius={16} smoothing={1} innerClassName="bg-[#1C1C1E] p-4 space-y-1 md:col-span-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Notes</span>
              <p className="text-zinc-300 text-sm">{data.notes}</p>
            </Squircle>
          )}
        </div>

        {/* Cost Breakdown */}
        <Squircle radius={20} smoothing={1} innerClassName="bg-[#1C1C1E] p-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Subtotal</span>
            <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Service Fee (10%)</span>
            <span className="text-white font-bold">${serviceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Shipping (Flat Rate)</span>
            <span className="text-white font-bold">${shippingFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Network Fee (Est.)</span>
            <span className="text-white font-bold">${networkFee.toFixed(2)}</span>
          </div>
          <div className="pt-2 mt-2">
            <div className="flex justify-between items-center p-3 bg-zinc-900 rounded-2xl border border-white/5">
              <span className="text-lg font-bold text-white">Total</span>
              <span className="text-2xl font-bold text-black bg-white px-3 py-1 rounded-lg border border-white/30">${total.toFixed(2)}</span>
            </div>
          </div>
        </Squircle>
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800 transition-colors"
        >
          Back
        </Button>
        <Button 
          onClick={onNext} // Proceed to payment
          className="flex-1 py-4 text-lg font-bold bg-white text-black hover:bg-zinc-200"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}
