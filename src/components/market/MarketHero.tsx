"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MarketSearch } from "@/components/market/MarketSearch";
import { Container } from "@/components/ui/primitives/container";
import { Section } from "@/components/ui/primitives/section";

export function MarketHero() {
  return (
    <Section spacing="none" className="z-0 mb-[-80px] min-h-[500px]">
      <Container size="full" className="relative h-full px-5 pt-24 pb-32 sm:px-10">
      <div className="absolute inset-3 md:inset-5 overflow-hidden rounded-[32px] md:rounded-[48px] border-[8px] md:border-[12px] border-white bg-zinc-900/50 shadow-2xl">
        <Image
          src="/framehero.svg"
          alt="Hero Background"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
        />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-3xl space-y-5 text-center"
      >
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-zinc-700">
          <span>Zero-Knowledge</span>
          <span className="text-zinc-400 mx-1">•</span>
          <span>No Logs</span>
          <span className="text-zinc-400 mx-1">•</span>
          <span className="inline-flex items-center gap-1">
             100% Anonymous
          </span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-black sm:text-5xl">
          Il marketplace privato dove trovi quello che cerchi
        </h1>
        <p className="mx-auto max-w-xl text-sm text-zinc-700 sm:text-base">
          Cerca richieste, ricevi offerte verificate e chiudi il deal in escrow in modo sicuro.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="relative z-10 mx-auto mt-10 max-w-2xl"
      >
        <MarketSearch />
      </motion.div>
      </Container>
    </Section>
  );
}
