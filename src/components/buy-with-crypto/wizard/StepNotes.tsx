"use client";

import { useState } from "react";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/Button";
import { StepProps } from "./types";

export function StepNotes({ data, updateData, onNext, onBack }: StepProps) {
  const [notes, setNotes] = useState(data.notes || "");

  const handleContinue = () => {
    updateData({ notes });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Additional Notes</h3>
        <p className="text-sm text-zinc-400">
          Any special instructions for the buyer?
        </p>
      </div>

      <Squircle
        radius={20}
        smoothing={1}
        innerClassName="bg-[#1C1C1E] p-6"
      >
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Please check for original packaging..."
          className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all min-h-[150px] resize-y font-bold"
          autoFocus
        />
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
