"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MarketHero } from "@/components/market/MarketHero";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/button";

const BuyWithCryptoFlow = dynamic(
  () => import("@/components/buy-with-crypto/BuyWithCryptoFlow").then((mod) => mod.BuyWithCryptoFlow),
  {
    loading: () => <div className="h-96 animate-pulse rounded-[24px] bg-white/5" />,
    ssr: false,
  }
);

const TrendingRequests = dynamic(
  () => import("@/components/market/TrendingRequests").then((mod) => mod.TrendingRequests),
  {
    loading: () => <div className="h-[500px] animate-pulse rounded-[40px] bg-white/5" />,
    ssr: true,
  }
);

const CategoryExplore = dynamic(
  () => import("@/components/market/CategoryExplore").then((mod) => mod.CategoryExplore),
  {
    loading: () => <div className="h-32 animate-pulse rounded-[30px] bg-white/5" />,
    ssr: false,
  }
);

const HowItWorks = dynamic(
  () => import("@/components/market/HowItWorks").then((mod) => mod.HowItWorks),
  {
    loading: () => <div className="h-64 animate-pulse rounded-[30px] bg-white/5" />,
    ssr: false,
  }
);

const TrustCTA = dynamic(() => import("@/components/market/TrustCTA").then((mod) => mod.TrustCTA), {
  loading: () => <div className="h-48 animate-pulse rounded-[30px] bg-white/5" />,
  ssr: false,
});

const TopSellersSection = dynamic(
  () => import("@/components/market/TopSellersSection").then((mod) => mod.TopSellersSection),
  {
    loading: () => <div className="h-96 animate-pulse rounded-[30px] bg-white/5" />,
    ssr: false,
  }
);

export default function MarketPage() {
  const [isBuyAnywhereExpanded, setIsBuyAnywhereExpanded] = useState(false);
  const buyAnywhereRef = useRef<HTMLDivElement>(null);

  const handleStartProxyOrder = () => {
    setIsBuyAnywhereExpanded(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        buyAnywhereRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white">
      <Navbar />

      <main className="mx-auto max-w-[1400px] space-y-24 px-4 py-8">
        <MarketHero />

        <section className="relative z-10 px-4" ref={buyAnywhereRef}>
          <div className="mx-auto max-w-[1100px]">
            <Squircle
              radius={24}
              smoothing={1}
              className="shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-all duration-500 ease-in-out"
              innerClassName={`bg-[#1C1C1E] transition-all duration-500 ease-in-out relative overflow-hidden ${isBuyAnywhereExpanded ? "p-8 md:p-12" : "p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8"}`}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />

              {!isBuyAnywhereExpanded ? (
                <div className="flex w-full flex-col items-center justify-between gap-8 md:flex-row">
                  <div className="relative z-10 max-w-2xl space-y-4 text-left">
                    <div className="mb-1 flex items-center gap-2">
                      <Image
                        src="/images/svg/openly-thinsmooth.svg"
                        alt="Smart Search"
                        width={20}
                        height={20}
                        className="h-5 w-5 brightness-0 invert"
                      />
                      <span className="font-inter text-xs font-black uppercase tracking-wider text-white">
                        NEW FEATURE
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
                      Buy Anywhere with Crypto
                    </h2>
                    <p className="line-clamp-2 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">
                      Find something outside the marketplace? Paste any product link and we&apos;ll purchase it for you
                      using crypto, privately and securely.
                    </p>
                  </div>

                  <div className="relative z-10 w-full shrink-0 md:w-auto">
                    <Button
                      size="lg"
                      onClick={handleStartProxyOrder}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-6 font-bold text-black shadow-lg shadow-white/5 transition-all hover:scale-[1.02] hover:bg-zinc-200 md:w-auto"
                    >
                      Start Proxy Order
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 w-full animate-in fade-in-0 duration-300">
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Buy Anywhere</h2>
                    <Button
                      variant="ghost"
                      onClick={() => setIsBuyAnywhereExpanded(false)}
                      className="text-zinc-400 hover:bg-white/5 hover:text-white"
                    >
                      Close
                    </Button>
                  </div>
                  <BuyWithCryptoFlow />
                </div>
              )}
            </Squircle>
          </div>
        </section>

        <div className="space-y-32">
          <section className="scroll-mt-32">
            <TrendingRequests />
          </section>

          <section>
            <CategoryExplore />
          </section>

          <section className="scroll-mt-32">
            <TopSellersSection />
          </section>

          <section>
            <HowItWorks />
          </section>

          <section className="pb-12">
            <TrustCTA />
          </section>
        </div>
      </main>
    </div>
  );
}
