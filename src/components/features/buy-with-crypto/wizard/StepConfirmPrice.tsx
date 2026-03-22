"use client";

import { useState } from "react";
import { Squircle } from "@/components/shared/ui/Squircle";
import { Button } from "@/components/shared/ui/button";
import { AlertCircle } from "lucide-react";
import { StepProps } from "./types";

export function StepConfirmPrice({ data, updateData, onNext, onBack, initialUrl, initialData }: StepProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputPrice, setInputPrice] = useState(data.price?.toString() || "");

  const handleContinue = () => {
    if (data.price && data.price > 0) {
      updateData({ priceConfirmed: true });
      onNext();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSavePrice = () => {
    const p = parseFloat(inputPrice);
    if (p > 0) {
      updateData({ price: p });
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex gap-4 p-4 bg-[#1C1C1E] border border-white/10 rounded-xl">
          {initialData?.image && (
            <img 
              src={initialData.image} 
              alt="Product Preview" 
              className="w-20 h-20 object-cover rounded-lg bg-white/5"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white truncate">{initialData?.title || "Product"}</h4>
            <p className="text-sm text-zinc-400 break-all line-clamp-1">{initialUrl}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Confirm Price</h3>
          <p className="text-sm text-zinc-400">
            We detected a price. Is this correct?
          </p>
        </div>
      </div>

      <Squircle
        radius={20}
        smoothing={1}
        innerClassName="bg-[#1C1C1E] p-6 space-y-4"
      >
        {!isEditing ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400 mb-1">Price per item</p>
              <p className="text-3xl font-bold text-white">
                ${data.price?.toFixed(2) || "0.00"}
              </p>
            </div>
            <Button variant="outline" onClick={handleEdit} className="bg-black text-white font-bold border-white/10 hover:bg-zinc-900 transition-colors">
              Edit Price
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Estimated Price (per item)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={inputPrice}
                  onChange={(e) => setInputPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-lg font-bold"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSavePrice} className="flex-1 bg-white text-black font-bold hover:bg-zinc-200">
                Update Price
              </Button>
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800 transition-colors">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {data.price === 0 && !isEditing && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
            <AlertCircle className="w-4 h-4" />
            Please edit the price to continue.
          </div>
        )}
      </Squircle>

      <div className="pt-4">
        <Button 
          onClick={handleContinue} 
          disabled={!data.price || data.price <= 0 || isEditing}
          className="w-full py-4 text-lg font-bold bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Yes, continue
        </Button>
      </div>
    </div>
  );
}

