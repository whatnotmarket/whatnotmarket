"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Scale, 
  UserCheck, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  AlertTriangle,
  Eye,
  Info
} from "lucide-react";
import { Navbar } from "@/components/app/navigation/Navbar";
import { Squircle } from "@/components/shared/ui/Squircle";
import { Button } from "@/components/shared/ui/button";
import { cn } from "@/lib/core/utils/utils";
import { CopyMap } from "@/lib/app/content/copy-system";

export function SecureTransactionClient({ copy }: { copy: CopyMap }) {
  const router = useRouter();
  const header = copy['header'] || {};
  const intro = copy['intro'] || {};
  const howItWorks = copy['how_it_works'] || {};

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-emerald-900/20 to-transparent opacity-50 blur-[100px]" />
      </div>

      <main className="relative z-10 container mx-auto px-6 py-12 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 items-start">
          
          {/* Left Column: Sticky Header */}
          <div className="lg:sticky lg:top-32 self-start space-y-6">
            <Button 
              variant="ghost" 
              className="pl-0 hover:bg-transparent hover:text-zinc-300 text-zinc-500 transition-colors -ml-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {header.back_button || "Indietro"}
            </Button>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-xl mb-6">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {header.title || "Escrow Sicuro"}
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                {header.subtitle || "I tuoi fondi sono protetti fino al completamento della transazione."}
              </p>
            </motion.div>
          </div>

          {/* Right Column: Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full space-y-8"
          >
            <Squircle 
              radius={32} 
              smoothing={1} 
              className="w-full drop-shadow-2xl"
              innerClassName="bg-[#1C1C1E] border border-white/10 overflow-hidden"
            >
              <div className="p-8 md:p-10 space-y-12">
                
                {/* Intro */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-inter">
                    <Lock className="text-white w-6 h-6" /> {intro.title || "Protezione Totale"}
                  </h2>
                  <p className="text-zinc-400 leading-relaxed">
                    {intro.text || "Su OpenlyMarket ogni transazione ÃƒÂ¨ protetta tramite un sistema di escrow sicuro progettato per proteggere sia gli acquirenti che i venditori. Quando viene avviato un accordo, i fondi vengono temporaneamente bloccati in escrow e rilasciati solo quando entrambe le parti hanno completato i termini della transazione."}
                  </p>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* How it Works */}
                <section className="space-y-6">
                  <h3 className="text-xl font-bold text-white font-inter">{howItWorks.title || "Come funziona lÃ¢â‚¬â„¢Escrow"}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group hover:border-white/20 transition-colors">
                      <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10 text-white font-bold">1</div>
                      <h4 className="text-white font-bold text-lg">{howItWorks.step1_title || "Deposito"}</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {howItWorks.step1_desc || "L'acquirente invia i fondi al contratto smart di escrow. I fondi sono al sicuro."}
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group hover:border-white/20 transition-colors">
                      <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10 text-white font-bold">2</div>
                      <h4 className="text-white font-bold text-lg">{howItWorks.step2_title || "Verifica"}</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {howItWorks.step2_desc || "Il venditore vede che i fondi sono garantiti e procede con la consegna del servizio."}
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group hover:border-white/20 transition-colors">
                      <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10 text-white font-bold">3</div>
                      <h4 className="text-white font-bold text-lg">{howItWorks.step3_title || "Rilascio"}</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {howItWorks.step3_desc || "Una volta confermata la ricezione, i fondi vengono sbloccati al venditore."}
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group hover:border-white/20 transition-colors">
                      <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10 text-white font-bold">4</div>
                      <h4 className="text-white font-bold text-lg">{howItWorks.step4_title || "Disputa"}</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {howItWorks.step4_desc || "In caso di problemi, un moderatore interviene per risolvere la controversia."}
                      </p>
                    </div>
                  </div>
                </section>

              </div>
            </Squircle>
          </motion.div>
        </div>
      </main>
    </div>
  );
}



