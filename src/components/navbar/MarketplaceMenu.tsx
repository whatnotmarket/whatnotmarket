"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const MENU_DATA = [
  {
    title: "By Category",
    items: [
      { label: "Electronics", href: "/market?cat=electronics" },
      { label: "Fashion", href: "/market?cat=fashion" },
      { label: "Home & Garden", href: "/market?cat=home" },
      { label: "Collectibles", href: "/market?cat=collectibles" },
      { label: "Services", href: "/market?cat=services" },
    ]
  },
  {
    title: "By Region",
    items: [
      { label: "North America", href: "/market?region=na" },
      { label: "Europe", href: "/market?region=eu" },
      { label: "Asia", href: "/market?region=asia" },
      { label: "Global Remote", href: "/market?region=global" },
    ]
  },
  {
    title: "Trending",
    items: [
      { label: "New Requests", href: "/market?sort=new" },
      { label: "Ending Soon", href: "/market?sort=ending" },
      { label: "High Value", href: "/market?sort=price_desc" },
      { label: "Verified Only", href: "/market?verified=true" },
    ]
  },
  {
    title: "Ecosystem",
    items: [
      { label: "Verified Sellers", href: "/sellers" },
      { label: "Trust & Safety", href: "/trust" },
      { label: "Fees & Limits", href: "/fees" },
      { label: "Partner API", href: "/api-docs" },
    ]
  }
];

export function MarketplaceMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
        className="relative"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={cn(
            "flex items-center gap-1 text-sm font-bold transition-all px-4 py-2 rounded-lg cursor-pointer",
            isOpen ? "text-white bg-white/10" : "text-zinc-300 hover:text-white hover:bg-white/5"
        )}
        onMouseEnter={() => setIsOpen(true)}
      >
        <span>Marketplace</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Invisible bridge to prevent closing when moving mouse to dropdown */}
      <div 
        className={cn("absolute top-full left-0 w-full h-4 z-40", isOpen ? "block" : "hidden")} 
        onMouseEnter={() => setIsOpen(true)}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-[calc(100%+0.5rem)] left-0 w-[800px] max-w-[90vw] bg-[#1C1C1E] border border-zinc-800 rounded-2xl shadow-2xl p-8 z-50 overflow-hidden"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="grid grid-cols-4 gap-8 relative z-10">
                {MENU_DATA.map((section, idx) => (
                    <div key={idx} className="space-y-4">
                        <h3 className="text-xs font-medium text-zinc-500">{section.title}</h3>
                        <ul className="space-y-3">
                            {section.items.map((item, i) => (
                                <li key={i}>
                                    <Link 
                                        href={item.href}
                                        className="text-sm font-bold text-zinc-300 hover:text-white hover:translate-x-1 transition-all inline-block"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Bottom Promo */}
            <div className="mt-8 pt-6 border-t border-zinc-800 flex items-center justify-end">
                <Link href="/market" className="text-xs font-bold bg-white text-black px-4 py-2 rounded-full flex items-center gap-2 hover:bg-zinc-200 transition-colors">
                    View all categories <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
