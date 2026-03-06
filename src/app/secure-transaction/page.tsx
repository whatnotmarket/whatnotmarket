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
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function SecureTransactionPage() {
  const router = useRouter();

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
              Indietro
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
                Escrow Sicuro
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                I tuoi fondi sono protetti fino al completamento della transazione.
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
                    <Lock className="text-white w-6 h-6" /> Protezione Totale
                  </h2>
                  <p className="text-zinc-400 leading-relaxed">
                    Su Whatnot Market ogni transazione è protetta tramite un sistema di escrow sicuro progettato per proteggere sia gli acquirenti che i venditori.
                    Quando viene avviato un accordo, i fondi vengono temporaneamente bloccati in escrow e rilasciati solo quando entrambe le parti hanno completato i termini della transazione.
                    Questo garantisce che nessuna delle due parti possa perdere i propri fondi durante il processo.
                  </p>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* How it Works */}
                <section className="space-y-6">
                  <h3 className="text-xl font-bold text-white font-inter">Come funziona l’Escrow</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group hover:border-white/20 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <UserCheck className="w-24 h-24 text-white" />
                      </div>
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-white font-bold">1</div>
                      <h4 className="text-white font-bold text-lg">Creazione dell’accordo</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Un buyer e un seller avviano una transazione sulla piattaforma e concordano i termini del deal.
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group hover:border-white/20 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CreditCard className="w-24 h-24 text-white" />
                      </div>
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-white font-bold">2</div>
                      <h4 className="text-white font-bold text-lg">Deposito dei fondi</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Il buyer invia il pagamento che viene bloccato in escrow. A questo punto il venditore può procedere con la consegna.
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group hover:border-white/20 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Truck className="w-24 h-24 text-white" />
                      </div>
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-white font-bold">3</div>
                      <h4 className="text-white font-bold text-lg">Verifica della consegna</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Una volta completata la consegna, l’escrow verifica che i termini dell’accordo siano stati rispettati.
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group hover:border-white/20 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 className="w-24 h-24 text-white" />
                      </div>
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-white font-bold">4</div>
                      <h4 className="text-white font-bold text-lg">Rilascio dei fondi</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Se tutto è corretto, i fondi vengono rilasciati al venditore e la transazione viene completata.
                      </p>
                    </div>
                  </div>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Who Manages */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                   <section className="space-y-4 h-full flex flex-col">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 font-inter">
                      <Scale className="text-white w-5 h-5" /> Chi gestisce l’Escrow
                    </h3>
                    <div className="space-y-4 flex-1">
                      <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/5">
                        <h4 className="text-white font-bold text-sm mb-2">Escrow della piattaforma</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          In molti casi l’escrow viene gestito direttamente da Whatnot Market. Questo garantisce un ambiente controllato e sicuro per le transazioni tra utenti.
                        </p>
                      </div>
                      <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/5">
                        <h4 className="text-white font-bold text-sm mb-2">Escrow Partner verificati</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                          Professionisti approvati che collaborano con la piattaforma. Gli escrow partner:
                        </p>
                        <ul className="space-y-1 text-xs text-zinc-500">
                          <li className="flex items-center gap-2"><div className="w-1 h-1 bg-zinc-500 rounded-full"/> Esperienza in crypto</li>
                          <li className="flex items-center gap-2"><div className="w-1 h-1 bg-zinc-500 rounded-full"/> Reputazione verificata</li>
                          <li className="flex items-center gap-2"><div className="w-1 h-1 bg-zinc-500 rounded-full"/> Terza parte neutrale</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4 h-full flex flex-col">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 font-inter">
                      <ShieldCheck className="text-white w-5 h-5" /> Protezione per tutti
                    </h3>
                    <div className="space-y-4 flex-1">
                      <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/5">
                        <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-white rounded-full"/> Per i Buyer
                        </h4>
                        <ul className="space-y-2 text-xs text-zinc-400">
                          <li>• Fondi bloccati fino alla consegna</li>
                          <li>• Riduzione rischio truffe</li>
                          <li>• Transazione sicura garantita</li>
                        </ul>
                      </div>
                      <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/5">
                        <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-white rounded-full"/> Per i Seller
                        </h4>
                        <ul className="space-y-2 text-xs text-zinc-400">
                          <li>• Fondi sicuri prima della consegna</li>
                          <li>• Evita mancati pagamenti</li>
                          <li>• Certezza della solvibilità del buyer</li>
                        </ul>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="h-px w-full bg-white/5" />

                {/* Status & Warning */}
                <section className="space-y-6">
                  <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                      <Eye className="w-6 h-6 text-white" /> Trasparenza e Sicurezza
                    </h3>
                    <p className="text-zinc-300 mb-6 font-medium">
                      Ogni transazione ha uno stato chiaro e tracciabile per monitorare l'intero processo.
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {["Payment Sent", "Funds in Escrow", "Delivery in Progress", "Completed"].map((status, i) => (
                        <div key={status} className="flex items-center">
                          <span className="px-3 py-1.5 bg-[#1C1C1E] border border-white/10 rounded-lg text-xs font-mono text-zinc-300">
                            {status}
                          </span>
                          {i < 3 && <div className="w-4 h-px bg-white/10 mx-2" />}
                        </div>
                      ))}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-start">
                      <AlertTriangle className="w-5 h-5 text-white shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-white font-bold text-sm">Transazioni sempre tramite Escrow</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Per garantire la sicurezza del marketplace, tutte le transazioni devono essere effettuate tramite escrow.
                          Qualsiasi tentativo di bypassare l’escrow viola le regole della piattaforma.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* CTA */}
                <section className="text-center space-y-8 pt-4">
                  <div className="max-w-2xl mx-auto space-y-4">
                    <h2 className="text-2xl font-bold text-white">Inizia una transazione sicura</h2>
                    <p className="text-zinc-400">
                      Utilizza il sistema escrow per acquistare o vendere in modo sicuro su Whatnot Market.
                    </p>
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button 
                        onClick={() => router.push('/requests/new')}
                        className="h-12 px-8 font-bold bg-white text-black hover:bg-zinc-200 rounded-xl"
                    >
                        Nuova Richiesta
                    </Button>
                    <Button 
                        onClick={() => router.push('/my-deals')}
                        variant="outline"
                        className="h-12 px-8 font-bold border-white/10 hover:bg-white/5 rounded-xl"
                    >
                        I miei Deals
                    </Button>
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
