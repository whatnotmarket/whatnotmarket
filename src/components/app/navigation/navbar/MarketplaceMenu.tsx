"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/core/utils/utils";

const MENU_DATA = [
  {
    title: "By Category",
    items: [
      { label: "Electronics", href: "/market?cat=electronics" },
      { label: "Fashion", href: "/market?cat=fashion" },
      { label: "Home & Garden", href: "/market?cat=home" },
      { label: "Collectibles", href: "/market?cat=collectibles" },
      { label: "Services", href: "/market?cat=services" },
    ],
  },
  {
    title: "By Region",
    items: [
      { label: "North America", href: "/market?region=na" },
      { label: "Europe", href: "/market?region=eu" },
      { label: "Asia", href: "/market?region=asia" },
      { label: "Global Remote", href: "/market?region=global" },
    ],
  },
  {
    title: "Trending",
    items: [
      { label: "New Requests", href: "/market?sort=new" },
      { label: "Ending Soon", href: "/market?sort=ending" },
      { label: "High Value", href: "/market?sort=price_desc" },
      { label: "Verified Only", href: "/market?verified=true" },
    ],
  },
  {
    title: "Ecosystem",
    items: [
      { label: "Verified Sellers", href: "/sell" },
      { label: "Trust & Safety", href: "/secure-transaction" },
      { label: "Fees & Limits", href: "/fee-calculator" },
      { label: "Partner API", href: "/open-source" },
    ],
  },
];

export function MarketplaceMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button
        type="button"
        aria-label="Open marketplace menu"
        className={cn(
          "flex cursor-pointer items-center gap-1 rounded-lg px-4 py-2 text-sm font-bold transition-all",
          isOpen ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white"
        )}
        onMouseEnter={() => setIsOpen(true)}
      >
        <span>Marketplace</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <div
        className={cn("absolute left-0 top-full z-40 h-4 w-full", isOpen ? "block" : "hidden")}
        onMouseEnter={() => setIsOpen(true)}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[800px] max-w-[90vw] overflow-hidden rounded-2xl border border-zinc-800 bg-[#1C1C1E] p-8 shadow-2xl"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="relative z-10 grid grid-cols-4 gap-8">
              {MENU_DATA.map((section, idx) => (
                <div key={idx} className="space-y-4">
                  <h3 className="text-xs font-medium text-zinc-500">{section.title}</h3>
                  <ul className="space-y-3">
                    {section.items.map((item, index) => (
                      <li key={index}>
                        <Link
                          href={item.href}
                          className="inline-block text-sm font-bold text-zinc-300 transition-all hover:translate-x-1 hover:text-white"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-end border-t border-zinc-800 pt-6">
              <Link
                href="/market"
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-zinc-200"
              >
                View all categories <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

