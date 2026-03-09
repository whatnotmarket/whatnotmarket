"use client";

import { useState } from "react";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/button";
import { PickupCityForm } from "./PickupCityForm";

// Fallback for missing UI components
const FormLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-medium text-zinc-400 mb-1.5">{children}</label>
);

const FormInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full bg-[#2C2C2E] border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
  />
);

const FormTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className="w-full bg-[#2C2C2E] border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all min-h-[100px] resize-y"
  />
);

interface ProxyOrderFormProps {
  onSubmit: (details: {
    quantity: number;
    options: string;
    pickupDetails: {
      city: string;
      country: string;
      region: string;
    };
    notes: string;
    price: number;
  }) => void;
  productUrl?: string; // Renamed from initialUrl to match usage
  initialData?: {
    title?: string;
    image?: string;
    price?: number;
    currency?: string;
  };
}

export function ProxyOrderForm({ onSubmit, productUrl, initialData }: ProxyOrderFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [options, setOptions] = useState("");
  
  // New Pickup City State
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");

  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState(initialData?.price ? initialData.price.toString() : ""); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      quantity,
      options,
      pickupDetails: {
        city,
        country,
        region
      },
      notes,
      price: parseFloat(price) || 0,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="space-y-4">
        {initialData && (
          <div className="flex gap-4 p-4 bg-[#1C1C1E] border border-white/10 rounded-xl">
            {initialData.image && (
              <img 
                src={initialData.image} 
                alt="Product Preview" 
                className="w-20 h-20 object-cover rounded-lg bg-white/5"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white truncate">{initialData.title || "Product"}</h4>
              <p className="text-sm text-zinc-400 break-all line-clamp-1">{productUrl}</p>
              {initialData.price && (
                <p className="text-emerald-400 font-mono text-sm mt-1">
                  Detected Price: {initialData.price} {initialData.currency || "USD"}
                </p>
              )}
            </div>
          </div>
        )}
        
        {!initialData && (
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Order Details</h3>
            <p className="text-sm text-zinc-400 break-all">
              Buying from: <span className="text-white">{productUrl}</span>
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Squircle
          radius={20}
          smoothing={1}
          innerClassName="bg-[#1C1C1E] p-6 space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FormLabel>Estimated Price (per item)</FormLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                <FormInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-8" // Add padding for $ sign
                  required
                />
              </div>
            </div>
            
            <div>
              <FormLabel>Quantity</FormLabel>
              <FormInput
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>

          <div>
            <FormLabel>Options (Size, Color, Variant)</FormLabel>
            <FormInput
              type="text"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder="e.g. Size 10, Black Color"
              required
            />
          </div>

          <PickupCityForm
            city={city}
            setCity={setCity}
            country={country}
            setCountry={setCountry}
            region={region}
            setRegion={setRegion}
          />

          <div>
            <FormLabel>Additional Notes</FormLabel>
            <FormTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions for the buyer..."
            />
          </div>
        </Squircle>

        <Button type="submit" className="w-full py-4 text-lg font-bold bg-white text-black hover:bg-zinc-200">
          Continue to Payment
        </Button>
      </form>
    </div>
  );
}
