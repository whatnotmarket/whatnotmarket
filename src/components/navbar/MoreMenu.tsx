"use client";

import { useState } from "react";
import { ChevronDown, FileText, HelpCircle, Mail, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function MoreMenu() {
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
        <span>More</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Invisible bridge to prevent closing when moving mouse to dropdown */}
      <div 
        className={cn("absolute top-full left-0 w-full h-4 z-40", isOpen ? "block" : "hidden")} 
        onMouseEnter={() => setIsOpen(true)}
      />

      <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute top-[calc(100%+0.5rem)] left-0 w-[240px] bg-[#1A1A1A]/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                <div className="space-y-1">
                    <Link href="/blog" className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                        <FileText className="h-4 w-4 text-zinc-400 group-hover:text-white" />
                        <span className="text-sm font-normal text-zinc-300 group-hover:text-white">Blog</span>
                    </Link>
                    <Link href="/help" className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                        <HelpCircle className="h-4 w-4 text-zinc-400 group-hover:text-white" />
                        <span className="text-sm font-normal text-zinc-300 group-hover:text-white">Help Center</span>
                    </Link>
                    <Link href="/contact" className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                        <Mail className="h-4 w-4 text-zinc-400 group-hover:text-white" />
                        <span className="text-sm font-normal text-zinc-300 group-hover:text-white">Contacts</span>
                    </Link>
                    <Link href="/about" className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
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
