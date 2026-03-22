"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Search } from "lucide-react";
import { useCrypto, CRYPTO_CURRENCIES } from "@/contexts/CryptoContext";
import { cn } from "@/lib/core/utils/utils";
import { NavPopup } from "./NavPopup";

export function CryptoSelector() {
  const { selectedCrypto, setSelectedCrypto, isSelectorOpen, setIsSelectorOpen } = useCrypto();
  const [search, setSearch] = useState("");

  const filtered = CRYPTO_CURRENCIES.filter(
    (currency) =>
      currency.name.toLowerCase().includes(search.toLowerCase()) ||
      currency.code.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCryptoData = CRYPTO_CURRENCIES.find((currency) => currency.code === selectedCrypto) || CRYPTO_CURRENCIES[2];
  const selectedIcon = selectedCryptoData.Icon;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Open currency selector"
        onClick={() => setIsSelectorOpen(!isSelectorOpen)}
        className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-zinc-300 transition-all hover:bg-white/5 hover:text-white"
      >
        <div className="flex items-center gap-1.5">
          <Image src={selectedIcon} alt={selectedCrypto} width={20} height={20} className="rounded-full" />
          <span>{selectedCrypto}</span>
        </div>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-zinc-500 transition-transform duration-200", isSelectorOpen && "rotate-180")}
        />
      </button>

      <NavPopup isOpen={isSelectorOpen} onClose={() => setIsSelectorOpen(false)} align="center" className="w-[380px]" title="Currency">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              className="w-full rounded-[12px] border-none bg-[#1C1C1E] py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 transition-all focus:outline-none focus:ring-0"
              placeholder="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="rounded-[16px] bg-[#1C1C1E] p-2">
          <div className="no-scrollbar max-h-[400px] space-y-1 overflow-y-auto">
            {filtered.map((currency) => (
              <button
                type="button"
                key={currency.code}
                onClick={() => {
                  setSelectedCrypto(currency.code);
                  setIsSelectorOpen(false);
                }}
                className={cn(
                  "group flex h-[50px] w-full items-center justify-between rounded-lg px-3 transition-all hover:bg-white/5",
                  selectedCrypto === currency.code ? "text-white" : "text-zinc-300 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Image src={currency.Icon} alt={currency.code} width={24} height={24} className="rounded-full" />
                  <span className="text-[15px] font-medium">{currency.code}</span>
                </div>
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                    selectedCrypto === currency.code
                      ? "border-white bg-white"
                      : "border-zinc-700 bg-transparent group-hover:border-zinc-500"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </NavPopup>
    </div>
  );
}

