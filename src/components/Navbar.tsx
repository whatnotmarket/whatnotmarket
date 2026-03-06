"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Bell, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Squircle } from "@/components/ui/Squircle";
import { MarketplaceMenu } from "./navbar/MarketplaceMenu";
import { CryptoSelector } from "./navbar/CryptoSelector";
import { LanguageSelector } from "./navbar/LanguageSelector";
import { MoreMenu } from "./navbar/MoreMenu";
import { ProfileMenu } from "./navbar/ProfileMenu";
import { NotificationsMenu } from "./navbar/NotificationsMenu";
import { AnnouncementBar } from "./AnnouncementBar";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@/contexts/UserContext";

export function Navbar() {
  const { role } = useUser();

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col">
      <AnnouncementBar />

      <div className="relative z-50 w-full">
        <Squircle 
          as="div" 
          radius={24} 
          smoothing={1} 
          corners="bottom"
          borderWidth={1}
          borderColor="rgba(39, 39, 42, 1)"
          className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-2xl"
          innerClassName="bg-[#1C1C1E]"
        />
        
        {/* Main Navbar */}
        <div className="relative z-10 mx-auto max-w-[1400px] flex h-14 items-center justify-between px-6 font-bold font-sans">
          {/* Left Side: Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link href="/market" className="flex items-center gap-2 group cursor-pointer">
              <Image
                src="/logowhite.svg"
                alt="Whatnot"
                width={80}
                height={40}
                className="h-7 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                priority
              />
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              <MarketplaceMenu />
              
              <Link href="/business" className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-zinc-300 hover:text-white transition-all hover:bg-white/5 rounded-lg group cursor-pointer">
                For Business <ChevronDown className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform" />
              </Link>
              
              <MoreMenu />
            </div>
          </div>

          {/* Right Side: Tools & Profile */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Selectors */}
            <div className="hidden md:flex items-center gap-1 pr-1">
              <CryptoSelector />
              <LanguageSelector />
            </div>

            {/* Role CTA Button */}
            {role === "buyer" && (
              <Link href="/requests/new">
                <Button 
                  size="sm" 
                  className="bg-zinc-200 hover:bg-white text-black font-bold text-xs h-8 px-4 rounded-lg transition-all"
                >
                  Create request
                </Button>
              </Link>
            )}

            {role === "seller" && (
              <Link href="/sell">
                <Button 
                  size="sm" 
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs h-8 px-4 rounded-lg transition-all"
                >
                  Sell something
                </Button>
              </Link>
            )}

            <div className="h-4 w-px bg-zinc-700/50 mx-0.5" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link href="/inbox" className="flex items-center gap-1.5 text-sm font-bold text-zinc-300 hover:text-white transition-all px-4 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <Image 
                  src="/chat.png" 
                  alt="Chat" 
                  width={20} 
                  height={20} 
                  className="w-5 h-5 object-contain"
                  priority
                  style={{ width: 'auto', height: 'auto' }}
                />
              </Link>
              <NotificationsMenu />
              <ProfileMenu />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
