"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Globe, Map, Loader2 } from "lucide-react";
import Link from "next/link";
import { Squircle } from "@/components/ui/Squircle";
import { cn } from "@/lib/utils";

// Types
type SearchResult = {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode | string;
  href: string;
};

type GroupedResults = {
  countries: SearchResult[];
  regions: SearchResult[];
  global: SearchResult[];
};

// Mock Data
const MOCK_DATA: GroupedResults = {
  countries: [
    { id: 'is', name: 'Iceland', desc: 'from $1.72 / day', icon: '🇮🇸', href: '/market?country=is' },
    { id: 'in', name: 'India', desc: 'from $2.16 / day', icon: '🇮🇳', href: '/market?country=in' },
    { id: 'id', name: 'Indonesia', desc: 'from $1.88 / day', icon: '🇮🇩', href: '/market?country=id' },
    { id: 'it', name: 'Italy', desc: 'from $2.50 / day', icon: '🇮🇹', href: '/market?country=it' },
    { id: 'us', name: 'United States', desc: 'from $3.00 / day', icon: '🇺🇸', href: '/market?country=us' },
  ],
  regions: [
    { id: 'eu', name: 'Europe & UK', desc: '33 countries', icon: <Map className="w-5 h-5 text-zinc-400" />, href: '/market?region=eu' },
    { id: 'ap', name: 'Asia Pacific', desc: '15 countries', icon: <Globe className="w-5 h-5 text-zinc-400" />, href: '/market?region=ap' },
    { id: 'sea', name: 'South East Asia', desc: '8 countries', icon: <Map className="w-5 h-5 text-zinc-400" />, href: '/market?region=sea' },
  ],
  global: [
    { id: 'pf', name: 'Pay & Fly', desc: 'Unlimited data. Pay as you go', icon: <Globe className="w-5 h-5 text-blue-400" />, href: '/market?plan=pay-fly' },
    { id: 'gp', name: 'Global Package', desc: '130+ countries', icon: <Globe className="w-5 h-5 text-blue-400" />, href: '/market?plan=global' },
  ]
};

interface SearchAutocompleteProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SearchAutocomplete({ query, isOpen, onClose }: SearchAutocompleteProps) {
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounced query value.
  useEffect(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const timer = setTimeout(() => {
      setDebouncedQuery(normalizedQuery);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const loading = query.trim().length > 0 && debouncedQuery !== query.trim().toLowerCase();

  const results = useMemo<GroupedResults | null>(() => {
    if (!debouncedQuery) return null;

    return {
      countries: MOCK_DATA.countries.filter((item) => item.name.toLowerCase().includes(debouncedQuery)),
      regions: MOCK_DATA.regions.filter((item) => item.name.toLowerCase().includes(debouncedQuery)),
      global: MOCK_DATA.global.filter((item) => item.name.toLowerCase().includes(debouncedQuery)),
    };
  }, [debouncedQuery]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !results) return;
      
      const allItems = [
        ...results.countries,
        ...results.regions,
        ...results.global
      ];
      if (allItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        window.location.href = allItems[selectedIndex].href;
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Click outside to close is handled by parent or overlay usually, 
  // but here we can assume the parent controls `isOpen` based on focus/blur.

  if (!isOpen || !query) return null;

  const hasResults = results && (
    results.countries.length > 0 || 
    results.regions.length > 0 || 
    results.global.length > 0
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute top-[calc(100%+12px)] left-0 w-full z-40"
      >
        <Squircle
          radius={24}
          smoothing={1}
          className="w-full shadow-2xl drop-shadow-2xl"
          innerClassName="bg-[#1A1A1A] border border-white/10 overflow-hidden flex flex-col max-h-[70vh]"
        >
          {loading ? (
            <div className="flex items-center justify-center p-8 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : !hasResults ? (
            <div className="p-8 text-center text-zinc-500">
              No results found
            </div>
          ) : (
            <div className="overflow-y-auto no-scrollbar py-2" ref={listRef}>
              {/* Countries */}
              {results!.countries.length > 0 && (
                <div className="py-2">
                  <div className="px-5 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Countries
                  </div>
                  {results!.countries.map((item) => (
                    <ResultRow 
                      key={item.id} 
                      item={item} 
                      isSelected={false} // Simplification for now
                    />
                  ))}
                </div>
              )}

              {/* Regions */}
              {results!.regions.length > 0 && (
                <div className="py-2">
                  <div className="px-5 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Regions
                  </div>
                  {results!.regions.map((item) => (
                    <ResultRow key={item.id} item={item} isSelected={false} />
                  ))}
                </div>
              )}

              {/* Global */}
              {results!.global.length > 0 && (
                <div className="py-2">
                  <div className="px-5 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Global
                  </div>
                  {results!.global.map((item) => (
                    <ResultRow key={item.id} item={item} isSelected={false} />
                  ))}
                </div>
              )}
            </div>
          )}
        </Squircle>
      </motion.div>
    </AnimatePresence>
  );
}

function ResultRow({ item, isSelected }: { item: SearchResult; isSelected: boolean }) {
  return (
    <Link 
      href={item.href}
      className={cn(
        "flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/5 cursor-pointer group",
        isSelected && "bg-white/5"
      )}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden text-lg">
        {typeof item.icon === 'string' ? item.icon : item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-zinc-200 group-hover:text-white truncate">
          {item.name}
        </div>
        <div className="text-sm text-zinc-500 truncate">
          {item.desc}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300" />
    </Link>
  );
}
