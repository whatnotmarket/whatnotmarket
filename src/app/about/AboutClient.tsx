"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Globe, 
  Shield, 
  Zap, 
  Lock, 
  Users, 
  Search, 
  MessageSquare, 
  Repeat,
  Gem,
  Scale
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/button";
import { CopyMap } from "@/lib/copy-system";

export function AboutClient({ copy }: { copy: CopyMap }) {
  const router = useRouter();
  const header = copy['header'] || {};
  const whoWeAre = copy['who_we_are'] || {};
  const whatWeDo = copy['what_we_do'] || {};

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent opacity-50 blur-[100px]" />
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
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {header.title || "La Piattaforma"}
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                {header.subtitle || "Il marketplace digitale di nuova generazione. Sicuro, privato, efficiente."}
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
                
                {/* Chi Siamo */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-inter">
                    <Gem className="text-white w-6 h-6" /> {whoWeAre.title || "Chi Siamo"}
                  </h2>
                  <p className="text-zinc-400 leading-relaxed">
                    {whoWeAre.p1 || "Whatnot Market è una piattaforma globale dedicata allo scambio di beni e servizi digitali. Siamo nati con una missione chiara: creare un ambiente di trading sicuro dove la privacy è al primo posto e la fiducia è garantita dalla tecnologia, non dalla burocrazia."}
                  </p>
                  <p className="text-zinc-400 leading-relaxed">
                    {whoWeAre.p2 || "A differenza dei marketplace tradizionali, non richiediamo procedure KYC invasive. Ci basiamo sulla reputazione, sui depositi di sicurezza (Vendor Bond) e su un rigoroso sistema di Escrow per proteggere ogni singola transazione."}
                  </p>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Cosa Facciamo */}
                <section className="space-y-6">
                  <h3 className="text-xl font-bold text-white font-inter">{whatWeDo.title || "Cosa Facciamo"}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-3">
                      <Lock className="w-8 h-8 text-white" />
                      <h4 className="text-white font-bold text-lg">{whatWeDo.card1_title || "Escrow Sicuro"}</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {whatWeDo.card1_desc || "Ogni pagamento viene bloccato in un conto di garanzia fino al completamento dell'ordine."}
                      </p>
                    </div>
                    
                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-3">
                      <Zap className="w-8 h-8 text-white" />
                      <h4 className="text-white font-bold text-lg">{whatWeDo.card2_title || "Pagamenti Crypto"}</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {whatWeDo.card2_desc || "Supportiamo BTC, ETH, LTC, XMR e USDT per transazioni veloci e senza confini."}
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-3">
                      <Shield className="w-8 h-8 text-white" />
                      <h4 className="text-white font-bold text-lg">{whatWeDo.card3_title || "Vendor Bond"}</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {whatWeDo.card3_desc || "I venditori depositano una garanzia per dimostrare la loro serietà e solvibilità."}
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-3">
                      <Users className="w-8 h-8 text-white" />
                      <h4 className="text-white font-bold text-lg">{whatWeDo.card4_title || "Privacy Totale"}</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {whatWeDo.card4_desc || "Nessun tracciamento, nessun dato venduto a terzi. I tuoi affari sono solo tuoi."}
                      </p>
                    </div>
                  </div>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Come Funziona (Static for now as it wasn't in seed request fully dynamic but let's leave it as is) */}
                <section className="space-y-6">
                  <h3 className="text-xl font-bold text-white font-inter">Come Funziona</h3>
                  <div className="relative">
                    {/* Connecting Line */}
                    <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-white/10 hidden md:block" />
                    
                    <div className="space-y-8 relative">
                      <div className="flex gap-6">
                        <div className="w-12 h-12 bg-[#1C1C1E] border border-white/10 rounded-full flex items-center justify-center shrink-0 z-10 text-white font-bold text-lg shadow-lg shadow-black">1</div>
                        <div>
                          <h4 className="text-white font-bold text-lg mb-1">Richiesta o Offerta</h4>
                          <p className="text-sm text-zinc-400">Un utente pubblica una richiesta (WANT) o un venditore crea un'offerta (SELL). Le parti si accordano sul prezzo.</p>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="w-12 h-12 bg-[#1C1C1E] border border-white/10 rounded-full flex items-center justify-center shrink-0 z-10 text-white font-bold text-lg shadow-lg shadow-black">2</div>
                        <div>
                          <h4 className="text-white font-bold text-lg mb-1">Avvio Escrow</h4>
                          <p className="text-sm text-zinc-400">Il buyer deposita i fondi nell'Escrow sicuro. Il seller riceve notifica che i fondi sono garantiti.</p>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="w-12 h-12 bg-[#1C1C1E] border border-white/10 rounded-full flex items-center justify-center shrink-0 z-10 text-white font-bold text-lg shadow-lg shadow-black">3</div>
                        <div>
                          <h4 className="text-white font-bold text-lg mb-1">Consegna & Verifica</h4>
                          <p className="text-sm text-zinc-400">Il seller consegna il prodotto/servizio. Il buyer verifica che tutto corrisponda alla descrizione.</p>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="w-12 h-12 bg-[#1C1C1E] border border-white/10 rounded-full flex items-center justify-center shrink-0 z-10 text-white font-bold text-lg shadow-lg shadow-black">4</div>
                        <div>
                          <h4 className="text-white font-bold text-lg mb-1">Rilascio Fondi</h4>
                          <p className="text-sm text-zinc-400">L'escrow rilascia i fondi al seller. Entrambe le parti si scambiano feedback per la reputazione.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Ecosistema */}
                <section className="space-y-6">
                  <h3 className="text-xl font-bold text-white font-inter">Il Nostro Ecosistema</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/5 text-center">
                      <Users className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
                      <div className="font-bold text-white">Buyers</div>
                      <p className="text-xs text-zinc-500 mt-1">Cercano servizi sicuri</p>
                    </div>
                    <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/5 text-center">
                      <Shield className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
                      <div className="font-bold text-white">Verified Sellers</div>
                      <p className="text-xs text-zinc-500 mt-1">Offrono qualità garantita</p>
                    </div>
                    <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/5 text-center">
                      <Scale className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
                      <div className="font-bold text-white">Escrow Partners</div>
                      <p className="text-xs text-zinc-500 mt-1">Garantiscono le transazioni</p>
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
