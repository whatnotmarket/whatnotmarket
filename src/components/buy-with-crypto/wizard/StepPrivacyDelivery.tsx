"use client";

import { PickupCityForm } from "../PickupCityForm";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/button";
import { StepProps } from "./types";

export function StepPrivacyDelivery({ data, updateData, onNext, onBack }: StepProps) {
  const handleContinue = () => {
    if (data.city && data.country) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Privacy-First Delivery</h3>
        <p className="text-sm text-zinc-400">
          We protect your privacy by using secure pickup lockers instead of home addresses.
        </p>
      </div>

      <Squircle
        radius={20}
        smoothing={1}
        innerClassName="bg-[#1C1C1E] p-6"
      >
        <PickupCityForm
          city={data.city}
          setCity={(val) => updateData({ city: val })}
          country={data.country}
          setCountry={(val) => updateData({ country: val })}
          region={data.region}
          setRegion={(val) => updateData({ region: val })}
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
          disabled={!data.city.trim() || !data.country.trim()}
          className="flex-1 py-4 text-lg font-bold bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
