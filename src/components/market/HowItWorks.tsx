"use client";

import { Squircle } from "@/components/ui/Squircle";
import { Search, MessageSquare, ShieldCheck } from "lucide-react";

interface HowItWorksProps {
  copy?: Record<string, string>;
}

export function HowItWorks({ copy }: HowItWorksProps) {
  const steps = [
    {
      title: copy?.step_1_title || "1. Fai una Richiesta",
      desc:
        copy?.step_1_desc ||
        "Descrivi quello che cerchi. I venditori verificati riceveranno una notifica.",
      icon: Search,
    },
    {
      title: copy?.step_2_title || "2. Ricevi Offerte",
      desc:
        copy?.step_2_desc ||
        "Confronta prezzi e condizioni. Chatta con i venditori in tempo reale.",
      icon: MessageSquare,
    },
    {
      title: copy?.step_3_title || "3. Chiudi il Deal",
      desc:
        copy?.step_3_desc ||
        "Paga in crypto tramite Escrow. I fondi vengono rilasciati solo quando sei soddisfatto.",
      icon: ShieldCheck,
    },
  ];

  const title = copy?.title || "Come funziona SwaprMarket";
  const subtitle =
    copy?.subtitle ||
    "Il modo piu sicuro per comprare e vendere prodotti esclusivi con criptovalute.";

  return (
    <Squircle
      radius={40}
      smoothing={1}
      borderWidth={1}
      borderColor="rgba(255, 255, 255, 0.1)"
      className="w-full"
      innerClassName="relative overflow-hidden bg-[#0A0A0A] p-8 md:p-12"
    >
      <div className="relative z-10 mb-16 space-y-4 text-center">
        <h2 className="text-3xl font-bold text-white md:text-4xl">{title}</h2>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400">{subtitle}</p>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.title} className="group space-y-6 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-white/5 bg-zinc-900 transition-transform duration-500 group-hover:scale-110">
              <step.icon className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">{step.title}</h3>
              <p className="mx-auto max-w-xs text-base leading-relaxed text-zinc-400">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Squircle>
  );
}
