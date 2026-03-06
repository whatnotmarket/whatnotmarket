"use client";

import { Button } from "@/components/ui/Button";
import { Squircle } from "@/components/ui/Squircle";

export function TrustCTA() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
      <Squircle
        radius={30}
        smoothing={1}
        className="h-full"
        innerClassName="bg-white/85 p-8 flex flex-col justify-center items-start space-y-6 h-full"
      >
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-black">Venditori Verificati</h3>
          <p className="text-zinc-600">
            Ogni venditore passa attraverso un processo di verifica rigoroso via Telegram e KYC opzionale.
          </p>
        </div>
        <Button className="bg-black text-white hover:bg-black/80 border-0">
          Diventa Venditore
        </Button>
      </Squircle>
      
      <Squircle
        radius={30}
        smoothing={1}
        className="h-full"
        innerClassName="bg-white/85 p-8 flex flex-col justify-center items-start space-y-6 h-full"
      >
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-black">Escrow Sicuro</h3>
          <p className="text-zinc-600">
            I tuoi fondi sono al sicuro nel nostro smart contract fino alla consegna del prodotto.
          </p>
        </div>
        <Button className="bg-black text-white hover:bg-black/80 border-0">
          Scopri di più
        </Button>
      </Squircle>

      <div className="md:col-span-2">
        <Squircle
          radius={30}
          smoothing={1}
          borderWidth={1}
          borderColor="rgba(255, 255, 255, 0.1)"
          className="w-full relative"
          innerClassName="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 z-0">
            <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center opacity-80"
                style={{ backgroundImage: "url('/affiliate-bg.svg')" }}
            />
            {/* Dark overlay for text readability if needed */}
            <div className="absolute inset-0 bg-black/40" />
          </div>

          <div className="space-y-4 max-w-2xl relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold text-white">Become Affiliate</h3>
            <p className="text-zinc-200 text-lg">
              Guadagna commissioni invitando nuovi utenti. Ricevi fino al 20% sulle fee di ogni transazione generata dai tuoi referral.
            </p>
          </div>
          <Button className="relative z-10 bg-white text-black hover:bg-zinc-200 border-0 px-8 h-12 text-base font-bold whitespace-nowrap">
            Join Program
          </Button>
        </Squircle>
      </div>
    </section>
  );
}
