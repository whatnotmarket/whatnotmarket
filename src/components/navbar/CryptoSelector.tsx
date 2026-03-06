"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { NavPopup } from "./NavPopup";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCrypto, CRYPTO_CURRENCIES } from "@/contexts/CryptoContext";

export function CryptoSelector() {
  const { selectedCrypto, setSelectedCrypto, isSelectorOpen, setIsSelectorOpen } = useCrypto();
  const [search, setSearch] = useState("");

  const filtered = CRYPTO_CURRENCIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCryptoData = CRYPTO_CURRENCIES.find(c => c.code === selectedCrypto) || CRYPTO_CURRENCIES[2];
  const SelectedIcon = selectedCryptoData.Icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsSelectorOpen(!isSelectorOpen)}
        className="flex items-center gap-2 text-sm font-bold text-zinc-300 hover:text-white transition-all px-4 py-2 rounded-lg hover:bg-white/5 cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
            <Image src={SelectedIcon} alt={selectedCrypto} width={20} height={20} className="rounded-full" />
            <span>{selectedCrypto}</span>
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 text-zinc-500 transition-transform duration-200", isSelectorOpen && "rotate-180")} />
      </button>

      <NavPopup isOpen={isSelectorOpen} onClose={() => setIsSelectorOpen(false)} align="center" className="w-[380px]" title="Currency">
        <div className="mb-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input 
                    className="w-full bg-[#1C1C1E] border-none rounded-[12px] py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:ring-0 focus:outline-none transition-all"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                />
            </div>
        </div>
        
        <div className="bg-[#1C1C1E] rounded-[16px] p-2">
            <div className="max-h-[400px] overflow-y-auto no-scrollbar space-y-1">
                {filtered.map((c) => (
                    <button
                        key={c.code}
                        onClick={() => {
                            setSelectedCrypto(c.code);
                            setIsSelectorOpen(false);
                        }}
                        className={cn(
                            "w-full flex items-center justify-between px-3 h-[50px] rounded-lg transition-all group hover:bg-white/5",
                            selectedCrypto === c.code ? "text-white" : "text-zinc-300 hover:text-white"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Image src={c.Icon} alt={c.code} width={24} height={24} className="rounded-full" />
                            <span className="text-[15px] font-medium">{c.code}</span>
                        </div>
                        <div className={cn(
                            "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                            selectedCrypto === c.code 
                                ? "bg-white border-white" 
                                : "bg-transparent border-zinc-700 group-hover:border-zinc-500"
                        )}>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </NavPopup>
    </div>
  );
}
