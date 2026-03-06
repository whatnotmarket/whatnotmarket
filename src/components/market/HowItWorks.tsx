"use client";

import { Squircle } from "@/components/ui/Squircle";
import { Search, MessageSquare, ShieldCheck } from "lucide-react";

const STEPS = [
  { title: "1. Fai una Richiesta", desc: "Descrivi ciò che cerchi. I venditori verificati riceveranno una notifica.", icon: Search },
  { title: "2. Ricevi Offerte", desc: "Confronta prezzi e condizioni. Chatta con i venditori in tempo reale.", icon: MessageSquare },
  { title: "3. Chiudi il Deal", desc: "Paga in crypto tramite Escrow. I fondi vengono rilasciati solo quando sei soddisfatto.", icon: ShieldCheck },
];

export function HowItWorks() {
  return (
    <Squircle
      radius={40}
      smoothing={1}
      borderWidth={1}
      borderColor="rgba(255, 255, 255, 0.1)"
      className="w-full"
      innerClassName="bg-[#0A0A0A] p-8 md:p-12 relative overflow-hidden"
    >
      <div className="text-center mb-16 space-y-4 relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white">Come funziona Whatnot Market</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
          Il modo più sicuro per comprare e vendere prodotti esclusivi con criptovalute.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {STEPS.map((step, i) => (
          <div key={i} className="text-center space-y-6 group">
            <div className="mx-auto h-24 w-24 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <step.icon className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-3">
                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                <p className="text-base text-zinc-400 leading-relaxed max-w-xs mx-auto">
                {step.desc}
                </p>
            </div>
          </div>
        ))}
      </div>
    </Squircle>
  );
}
