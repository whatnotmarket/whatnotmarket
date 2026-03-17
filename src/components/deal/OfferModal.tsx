"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, DollarSign, ChevronRight } from "lucide-react";
import { Squircle } from "@/components/ui/Squircle";
import { cn } from "@/lib/utils";

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingPrice: number;
  onSendOffer: (amount: number, message: string) => void;
  dealId?: string;
}

export function OfferModal({
  isOpen,
  onClose,
  listingPrice,
  onSendOffer,
  dealId
}: OfferModalProps) {
  const [step, setStep] = useState<"input" | "success">("input");
  const [offerAmount, setOfferAmount] = useState(listingPrice);
  const [message, setMessage] = useState("");
  const [sliderValue, setSliderValue] = useState(100); // Percentage 70-100

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("input");
      setOfferAmount(listingPrice);
      setSliderValue(100);
      setMessage("");
    }
  }, [isOpen, listingPrice]);

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseInt(e.target.value);
    setSliderValue(percent);
    setOfferAmount(Math.round((listingPrice * percent) / 100));
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric chars
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val) {
      const amount = parseInt(val);
      setOfferAmount(amount);
      // Update slider if within range, otherwise 100 or 70 (clamped visually or detached)
      const percent = Math.min(100, Math.max(70, Math.round((amount / listingPrice) * 100)));
      setSliderValue(percent);
    } else {
      setOfferAmount(0);
    }
  };

  const handleSend = () => {
    onSendOffer(offerAmount, message);
    setStep("success");
  };

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const savings = listingPrice - offerAmount;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <Squircle
              radius={24}
              smoothing={0.8}
              className="w-full shadow-2xl"
              innerClassName="bg-zinc-950 border border-white/10 overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-full p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="p-6 md:p-8">
                {step === "input" ? (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-white">Send an Offer</h2>
                      <p className="text-zinc-400">Propose your price to the seller.</p>
                    </div>

                    {/* Price Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                        <DollarSign className="h-6 w-6" />
                      </div>
                      <input
                        type="text"
                        value={offerAmount.toLocaleString()}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSend();
                          }
                        }}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-3xl font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      />
                    </div>

                    {/* Slider */}
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        <span>70%</span>
                        <span>Listing Price</span>
                      </div>
                      <div className="relative h-6 w-full flex items-center">
                        <input
                          type="range"
                          min="70"
                          max="100"
                          step="1"
                          value={sliderValue}
                          onChange={handleSliderChange}
                          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-indigo-600 hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                        />
                        {/* Custom Track Overlay could be added here for gradient if needed, but accent-color works for basic modern browsers */}
                      </div>
                    </div>

                    {/* Offer Summary */}
                    <Squircle
                      radius={16}
                      smoothing={0.6}
                      className="w-full"
                      innerClassName="bg-indigo-500/10 border border-indigo-500/20 p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-indigo-300 font-medium">Your Offer</p>
                          <p className="text-xl font-bold text-indigo-400">${offerAmount.toLocaleString()}</p>
                        </div>
                        {savings > 0 && (
                          <div className="text-right">
                            <p className="text-sm text-emerald-400 font-medium">You save</p>
                            <p className="text-lg font-bold text-emerald-500">${savings.toLocaleString()}</p>
                          </div>
                        )}
                        {savings <= 0 && (
                          <div className="text-right">
                            <p className="text-sm text-zinc-400 font-medium">Listing Price</p>
                            <p className="text-lg font-bold text-white">${listingPrice.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </Squircle>

                    {/* Message */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Message to Seller (optional)</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            handleSend();
                          }
                        }}
                        placeholder="Hi, would you accept this offer for a quick sale?"
                        className="w-full h-24 bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none transition-all text-sm"
                      />
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all border border-white/5 active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSend}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98]"
                      >
                        Send Offer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-6">
                    <div className="mx-auto h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-white">Offer Sent Successfully</h2>
                      <p className="text-zinc-400">The seller will review your offer.</p>
                    </div>

                    <div className="space-y-3 pt-4">
                      <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98]"
                      >
                        Continue Chat
                      </button>
                      <button
                        onClick={onClose} // Just close for now, logically "View Deal" keeps you on page
                        className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all border border-white/5 active:scale-[0.98]"
                      >
                        View Deal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Squircle>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
