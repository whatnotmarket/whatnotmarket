"use client";

import { useState } from "react";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { StepProps } from "./types";

export function StepQuantity({ data, updateData, onNext, onBack }: StepProps) {
  const [quantity, setQuantity] = useState(data.quantity || 1);

  const handleIncrement = () => {
    setQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleContinue = () => {
    updateData({ quantity });
    onNext();
  };

  const shippingFee = 15.00; // Fixed shipping rate
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Select Quantity</h3>
        <p className="text-sm text-zinc-400">
          How many items do you want to purchase?
        </p>
      </div>

      <Squircle
        radius={20}
        smoothing={1}
        innerClassName="bg-[#1C1C1E] p-8 space-y-6 flex flex-col items-center"
      >
        <div className="flex items-center gap-6">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleDecrement}
            disabled={quantity <= 1}
            className="w-12 h-12 rounded-full bg-black border-white/10 hover:bg-zinc-900 text-white disabled:opacity-30 transition-colors font-bold"
          >
            <Minus className="w-5 h-5" />
          </Button>
          
          <div className="text-4xl font-bold text-white w-16 text-center">
            {quantity}
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleIncrement}
            className="w-12 h-12 rounded-full bg-black border-white/10 hover:bg-zinc-900 text-white transition-colors font-bold"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="w-full pt-4 border-t border-white/5 space-y-3">
          <div className="flex justify-between items-center text-sm px-3">
            <span className="text-zinc-400">Price ({quantity} items)</span>
            <span className="text-white font-bold">${((data.price || 0) * quantity).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm px-3">
            <span className="text-zinc-400">Service Fee (10%)</span>
            <span className="text-white font-bold">${((data.price || 0) * quantity * 0.1).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm px-3">
            <span className="text-zinc-400">Shipping (Flat Rate)</span>
            <span className="text-white font-bold">${shippingFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-zinc-900 rounded-2xl border border-white/5">
            <span className="text-white font-bold">Subtotal</span>
            <span className="text-white font-bold text-lg">${(((data.price || 0) * quantity * 1.1) + shippingFee).toFixed(2)}</span>
          </div>
        </div>
      </Squircle>

      <div className="flex gap-3 pt-4">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800 transition-colors"
        >
          Back
        </Button>
        <Button 
          onClick={handleContinue} 
          className="flex-1 py-4 text-lg font-bold bg-white text-black hover:bg-zinc-200"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
