"use client";

import { Squircle } from "@/components/shared/ui/Squircle";
import { Button } from "@/components/shared/ui/button";
import { CRYPTO_CURRENCIES } from "@/contexts/CryptoContext";
import Image from "next/image";
import { useState } from "react";
import { StepProps } from "./types";

export function StepPaymentMethod({ data, updateData, onNext, onBack }: StepProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(data.currency || "");
  const [selectedNetwork, setSelectedNetwork] = useState(data.network || "");

  const handleContinue = () => {
    if (selectedCurrency) {
      updateData({ currency: selectedCurrency, network: selectedNetwork });
      onNext();
    }
  };

  const handleSelectCurrency = (currency: string) => {
    setSelectedCurrency(currency);
    setSelectedNetwork(""); // Reset network when currency changes
  };

  const showNetworkSelector = !!selectedCurrency && ["USDT", "USDC"].includes(selectedCurrency);

  const networks = ["ERC20", "TRC20", "BEP20", "SOL"];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Payment Method</h3>
        <p className="text-sm text-zinc-400">
          Choose your preferred cryptocurrency.
        </p>
      </div>

      <Squircle
        radius={20}
        smoothing={1}
        innerClassName="bg-[#1C1C1E] p-6 space-y-6"
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-400">Select Cryptocurrency</label>
          <div className="grid grid-cols-2 gap-3">
            {CRYPTO_CURRENCIES.map((crypto) => (
              <button
                key={crypto.code}
                type="button"
                onClick={() => handleSelectCurrency(crypto.code)}
                style={
                  selectedCurrency === crypto.code
                    ? {
                        backgroundColor: `${crypto.color}1A`, // 10% opacity (hex 1A)
                        borderColor: crypto.color,
                        color: crypto.color,
                      }
                    : {}
                }
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedCurrency === crypto.code
                    ? ""
                    : "bg-[#2C2C2E] border-white/5 text-zinc-400 hover:bg-[#3C3C3E]"
                }`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                   <Image src={crypto.Icon} alt={crypto.name} width={32} height={32} className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm" style={selectedCurrency === crypto.code ? { color: crypto.color } : {}}>{crypto.code}</div>
                  <div className={`text-xs font-medium ${selectedCurrency === crypto.code ? "opacity-90" : "opacity-70"}`}>{crypto.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {showNetworkSelector && (
          <div className="space-y-3 pt-4 border-t border-white/5">
            <label className="block text-sm font-medium text-zinc-400">Select Network</label>
            <div className="grid grid-cols-2 gap-3">
              {networks.map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setSelectedNetwork(net)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    selectedNetwork === net
                      ? "bg-white border-white text-black"
                      : "bg-[#2C2C2E] border-white/5 text-zinc-400 hover:bg-[#3C3C3E]"
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Ensure you send funds on the correct network to avoid loss.
            </p>
          </div>
        )}
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
          disabled={!selectedCurrency || (showNetworkSelector && !selectedNetwork)}
          className="flex-1 py-4 text-lg font-bold bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

