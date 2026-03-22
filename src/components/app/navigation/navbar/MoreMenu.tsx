"use client";

import { cn } from "@/lib/core/utils/utils";
import { AnimatePresence,motion } from "framer-motion";
import { ChevronDown,FileText,HelpCircle,Info,Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function MoreMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button
        type="button"
        aria-label="Open more menu"
        className={cn(
          "flex cursor-pointer items-center gap-1 rounded-lg px-4 py-2 text-sm font-bold transition-all",
          isOpen ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white"
        )}
        onMouseEnter={() => setIsOpen(true)}
      >
        <span>More</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <div
        className={cn("absolute left-0 top-full z-40 h-4 w-full", isOpen ? "block" : "hidden")}
        onMouseEnter={() => setIsOpen(true)}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[240px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#1A1A1A]/95 p-2 shadow-2xl backdrop-blur-xl"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="space-y-1">
              <Link href="/roadmap" className="group flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/5">
                <FileText className="h-4 w-4 text-zinc-400 group-hover:text-white" />
                <span className="text-sm font-normal text-zinc-300 group-hover:text-white">Roadmap</span>
              </Link>
              <Link href="/faq" className="group flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/5">
                <HelpCircle className="h-4 w-4 text-zinc-400 group-hover:text-white" />
                <span className="text-sm font-normal text-zinc-300 group-hover:text-white">Help Center</span>
              </Link>
              <Link href="/contact" className="group flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/5">
                <Mail className="h-4 w-4 text-zinc-400 group-hover:text-white" />
                <span className="text-sm font-normal text-zinc-300 group-hover:text-white">Contacts</span>
              </Link>
              <Link href="/about" className="group flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/5">
                <Info className="h-4 w-4 text-zinc-400 group-hover:text-white" />
                <span className="text-sm font-normal text-zinc-300 group-hover:text-white">About Us</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

