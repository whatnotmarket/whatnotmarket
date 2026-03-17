"use client";

import { Button } from "@/components/ui/button";
import { Squircle } from "@/components/ui/Squircle";

interface TrustCTAProps {
  copy?: Record<string, string>;
}

export function TrustCTA({ copy }: TrustCTAProps) {
  return (
    <section className="grid grid-cols-1 gap-6 pb-12 md:grid-cols-2">
      <Squircle
        radius={30}
        smoothing={1}
        className="h-full"
        innerClassName="h-full space-y-6 bg-white/85 p-8 flex flex-col justify-center items-start"
      >
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-black">
            {copy?.verified_title || "Venditori Verificati"}
          </h3>
          <p className="text-zinc-600">
            {copy?.verified_desc ||
              "Ogni venditore passa attraverso un processo di verifica rigoroso via Telegram e KYC opzionale."}
          </p>
        </div>
        <Button className="border-0 bg-black text-white hover:bg-black/80">
          {copy?.verified_btn || "Diventa Venditore"}
        </Button>
      </Squircle>

      <Squircle
        radius={30}
        smoothing={1}
        className="h-full"
        innerClassName="h-full space-y-6 bg-white/85 p-8 flex flex-col justify-center items-start"
      >
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-black">{copy?.escrow_title || "Escrow Sicuro"}</h3>
          <p className="text-zinc-600">
            {copy?.escrow_desc ||
              "I tuoi fondi sono al sicuro nel nostro smart contract fino alla consegna del prodotto."}
          </p>
        </div>
        <Button className="border-0 bg-black text-white hover:bg-black/80">
          {copy?.escrow_btn || "Scopri di piu"}
        </Button>
      </Squircle>

      <div className="md:col-span-2">
        <Squircle
          radius={30}
          smoothing={1}
          borderWidth={1}
          borderColor="rgba(255, 255, 255, 0.1)"
          className="relative w-full"
          innerClassName="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden"
        >
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 h-full w-full bg-[radial-gradient(circle_at_20%_40%,rgba(255,255,255,0.2),transparent_45%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <h3 className="text-2xl font-bold text-white md:text-3xl">
              {copy?.affiliate_title || "Become Affiliate"}
            </h3>
            <p className="text-lg text-zinc-200">
              {copy?.affiliate_desc ||
                "Guadagna commissioni invitando nuovi utenti. Ricevi fino al 20% sulle fee di ogni transazione generata dai tuoi referral."}
            </p>
          </div>
          <Button className="relative z-10 h-12 whitespace-nowrap border-0 bg-white px-8 text-base font-bold text-black hover:bg-zinc-200">
            {copy?.affiliate_btn || "Join Program"}
          </Button>
        </Squircle>
      </div>
    </section>
  );
}
