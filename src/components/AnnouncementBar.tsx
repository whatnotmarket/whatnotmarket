"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function AnnouncementBar() {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="w-full relative overflow-hidden h-10"
    >
      <div className="absolute inset-0 z-0 h-10 w-full bg-black">
        <Image
          src="/images/svg/openly-notifiche.svg"
          alt="Announcement background"
          fill
          className="object-cover opacity-100"
          priority
        />
      </div>
      <div className="relative z-10 flex h-9 md:h-10 items-center justify-center gap-4 px-4 text-xs font-medium text-zinc-300 tracking-wide">
        <div className="flex items-center gap-2 truncate">
          <Image 
            src="/images/png/openly-gold.png" 
            alt="Verified" 
            width={20} 
            height={20} 
            className="w-5 h-5 object-contain"
          />
          <span className="text-white font-semibold">SIP & VoIP Solutions for Businesses.</span>
          <span className="opacity-70 hidden sm:inline">Start making calls in minutes with premium routes.</span>
        </div>
        
        <button className="group relative rounded-full bg-white/10 px-3 py-1 text-[10px] md:text-xs font-bold text-white hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1 overflow-hidden">
          <span className="relative z-10">Explore VoIP Deals</span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </motion.div>
  );
}
