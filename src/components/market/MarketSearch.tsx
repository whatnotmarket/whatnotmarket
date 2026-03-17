"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Squircle } from "@/components/ui/Squircle";
import dynamic from "next/dynamic";

const SearchAutocomplete = dynamic(() => import("@/components/search/SearchAutocomplete").then(mod => mod.SearchAutocomplete), {
  ssr: false, // Search is client-side interaction
  loading: () => null
});

export function MarketSearch() {
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  return (
    <div className="relative z-10 mx-auto mt-8 w-full max-w-2xl">
      <Squircle 
        radius={30} 
        smoothing={1} 
        className="w-full drop-shadow-xl relative z-50"
        innerClassName="flex items-center bg-white p-2 pl-4"
      >
        <Search className="w-6 h-6 text-black/50" />
        <input
          type="text"
          placeholder="Cosa stai cercando?"
          className="w-full flex-1 bg-transparent px-4 py-3 text-lg text-black outline-none placeholder:text-zinc-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && search.trim()) {
              router.push(`/market?search=${encodeURIComponent(search.trim())}`);
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        />
        <Link href="/smart-search" className="flex items-center justify-center w-12 h-12 hover:scale-105 transition-transform cursor-pointer" title="Smart Search">
          <Image 
            src="/images/svg/openly-thinsmooth.svg" 
            alt="Smart Search" 
            width={24} 
            height={24}
            className="w-6 h-6"
          />
        </Link>
      </Squircle>

      <SearchAutocomplete 
        query={search} 
        isOpen={isFocused && search.length > 0} 
        onClose={() => setIsFocused(false)} 
      />
    </div>
  );
}
