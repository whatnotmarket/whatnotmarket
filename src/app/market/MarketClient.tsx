"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";

// Import new components
import { MarketHero } from "@/components/market/MarketHero";
import dynamic from "next/dynamic";
import { CopyMap } from "@/lib/copy-system";

const BuyWithCryptoFlow = dynamic(() => import("@/components/buy-with-crypto/BuyWithCryptoFlow").then(mod => mod.BuyWithCryptoFlow), {
  loading: () => <div className="h-96 animate-pulse bg-white/5 rounded-[24px]" />,
  ssr: false // Client interaction only
});

const TrendingRequests = dynamic(() => import("@/components/market/TrendingRequests").then(mod => mod.TrendingRequests), {
  loading: () => <div className="h-[500px] animate-pulse bg-white/5 rounded-[40px]" />,
  ssr: true
});

const CategoryExplore = dynamic(() => import("@/components/market/CategoryExplore").then(mod => mod.CategoryExplore), {
  loading: () => <div className="h-32 animate-pulse bg-white/5 rounded-[30px]" />,
  ssr: true
});

const HowItWorks = dynamic(() => import("@/components/market/HowItWorks").then(mod => mod.HowItWorks), {
  loading: () => <div className="h-64 animate-pulse bg-white/5 rounded-[30px]" />,
  ssr: true
});

const TrustCTA = dynamic(() => import("@/components/market/TrustCTA").then(mod => mod.TrustCTA), {
  loading: () => <div className="h-48 animate-pulse bg-white/5 rounded-[30px]" />,
  ssr: true
});

const TopSellersSection = dynamic(() => import("@/components/market/TopSellersSection").then(mod => mod.TopSellersSection), {
  loading: () => <div className="h-96 animate-pulse bg-white/5 rounded-[30px]" />,
  ssr: true
});

interface MarketClientProps {
  copy: CopyMap;
}

export function MarketClient({ copy }: MarketClientProps) {
  const [isBuyAnywhereExpanded, setIsBuyAnywhereExpanded] = useState(false);
  const buyAnywhereRef = useRef<HTMLDivElement>(null);

  const handleStartProxyOrder = () => {
    setIsBuyAnywhereExpanded(true);
    setTimeout(() => {
      buyAnywhereRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const buyAnywhereCopy = copy['buy_anywhere'] || {};

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white">
      <Navbar />
      
      <main className="mx-auto max-w-[1400px] px-4 py-8 space-y-24">
        <MarketHero copy={copy['hero']} />

        {/* Buy Anywhere Feature - Overlapping Card */}
        <section className="relative z-10 px-4" ref={buyAnywhereRef}>
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-[1100px]"
          >
            <Squircle
              radius={24}
              smoothing={1}
              className="shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-all duration-500 ease-in-out"
              innerClassName={`bg-[#1C1C1E] transition-all duration-500 ease-in-out relative overflow-hidden ${isBuyAnywhereExpanded ? "p-8 md:p-12" : "p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
              
              <AnimatePresence mode="wait">
                {!isBuyAnywhereExpanded ? (
                  <motion.div 
                    key="collapsed"
                    initial={false}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-8 w-full"
                  >
                    <div className="relative z-10 space-y-4 max-w-2xl text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <Image 
                          src="/thinsmooth.svg" 
                          alt="Smart Search" 
                          width={20} 
                          height={20} 
                          className="w-5 h-5 brightness-0 invert" 
                        />
                        <span className="text-white text-xs font-black uppercase tracking-wider font-inter">
                          {buyAnywhereCopy.badge || "NEW FEATURE"}
                        </span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
                        {buyAnywhereCopy.title || "Buy Anywhere with Crypto"}
                      </h2>
                      <p className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-xl line-clamp-2">
                        {buyAnywhereCopy.desc || "Find something outside the marketplace? Paste any product link and we'll purchase it for you using crypto — privately and securely."}
                      </p>
                    </div>

                    <div className="relative z-10 shrink-0 w-full md:w-auto">
                      <Button 
                        size="lg"
                        onClick={handleStartProxyOrder}
                        className="w-full md:w-auto bg-white text-black hover:bg-zinc-200 font-bold px-8 py-6 rounded-xl shadow-lg shadow-white/5 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                      >
                        {buyAnywhereCopy.btn || "Start Proxy Order"}
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full relative z-10"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold text-white">
                        {buyAnywhereCopy.expanded_title || "Buy Anywhere"}
                      </h2>
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsBuyAnywhereExpanded(false)}
                        className="text-zinc-400 hover:text-white hover:bg-white/5"
                      >
                        {buyAnywhereCopy.close_btn || "Close"}
                      </Button>
                    </div>
                    <BuyWithCryptoFlow />
                  </motion.div>
                )}
              </AnimatePresence>
            </Squircle>
          </motion.div>
        </section>

        {/* Main Content Sections */}
        <div className="space-y-32">
          {/* Trending Requests */}
          <section className="scroll-mt-32">
            <TrendingRequests />
          </section>

          {/* Categories Grid */}
          <section>
            <CategoryExplore />
          </section>

          {/* Top Sellers Showcase */}
          <section className="scroll-mt-32">
            <TopSellersSection />
          </section>

          {/* How It Works */}
          <section>
            <HowItWorks copy={copy['how_it_works']} />
          </section>

          {/* Trust CTA */}
          <section className="pb-12">
            <TrustCTA copy={copy['trust_cta']} />
          </section>
        </div>
      </main>
    </div>
  );
}
