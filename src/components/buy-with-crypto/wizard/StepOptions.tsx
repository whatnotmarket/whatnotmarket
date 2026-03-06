"use client";

import { useState } from "react";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/Button";
import { StepProps } from "./types";

export function StepOptions({ data, updateData, onNext, onBack }: StepProps) {
  const [options, setOptions] = useState(data.options || "");

  const handleContinue = () => {
    updateData({ options });
    onNext();
  };

  const handleSkip = () => {
    updateData({ options: "" });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Choose Options</h3>
        <p className="text-sm text-zinc-400">
          Size, Color, Variant, or any specific details.
        </p>
      </div>

      <Squircle
        radius={20}
        smoothing={1}
        innerClassName="bg-[#1C1C1E] p-6 space-y-4"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-400">
            Options
          </label>
          <input
            type="text"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="e.g. Size 10, Black Color"
            className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-bold"
            autoFocus
          />
        </div>

        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-300 text-sm">
          If you’re unsure, write any details you want us to follow.
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
        <div className="flex-1 flex gap-2 justify-end">
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="text-zinc-500 hover:text-white bg-transparent hover:bg-zinc-800 transition-colors"
          >
            Skip
          </Button>
          <Button 
            onClick={handleContinue} 
            className="px-8 font-bold bg-white text-black hover:bg-zinc-200"
            disabled={!options.trim()}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
