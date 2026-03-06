"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  EyeOff, 
  FileText, 
  Database, 
  Server,
  Cookie
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/Button";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-zinc-900/40 to-transparent opacity-50 blur-[100px]" />
      </div>

      <main className="relative z-10 container mx-auto px-6 py-12 max-w-[1000px]">
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
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Privacy Policy
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                La tua privacy non è un'opzione, è la nostra priorità. Scopri come proteggiamo i tuoi dati.
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
                
                {/* Core Philosophy */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-inter">
                    <Lock className="text-white w-6 h-6" /> Filosofia Privacy-First
                  </h2>
                  <p className="text-zinc-400 leading-relaxed">
                    Whatnot Market è costruito sul principio della minimizzazione dei dati. Non raccogliamo informazioni che non sono strettamente necessarie per il funzionamento del servizio.
                    Crediamo che l'anonimato sia un diritto fondamentale, specialmente nel mondo delle transazioni digitali.
                  </p>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Data Collection */}
                <section className="space-y-6">
                  <h3 className="text-xl font-bold text-white font-inter">Dati che Raccogliamo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-3">
                      <EyeOff className="w-8 h-8 text-white" />
                      <h4 className="text-white font-bold text-lg">Nessun KYC</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Non richiediamo documenti d'identità, passaporti o selfie. La tua identità reale rimane tua.
                      </p>
                    </div>
                    
                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-3">
                      <FileText className="w-8 h-8 text-white" />
                      <h4 className="text-white font-bold text-lg">Dati dell'Account</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Raccogliamo solo username, password (hashata) e dati necessari per le transazioni.
                      </p>
                    </div>
                  </div>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Data Usage */}
                <section className="space-y-6">
                  <h3 className="text-xl font-bold text-white font-inter">Utilizzo e Sicurezza</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/10">
                        <Database className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">Archiviazione Sicura</h4>
                        <p className="text-sm text-zinc-400">Tutti i dati sensibili sono crittografati a riposo e in transito. Utilizziamo standard di sicurezza di livello industriale.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/10">
                        <Server className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">No Data Selling</h4>
                        <p className="text-sm text-zinc-400">Non vendiamo, scambiamo o trasferiamo i tuoi dati a terze parti. Il nostro modello di business si basa sulle fee di transazione, non sui tuoi dati.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/10">
                        <Cookie className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">Cookies & Tracking</h4>
                        <p className="text-sm text-zinc-400">Utilizziamo solo cookie tecnici essenziali per il funzionamento della sessione. Nessun tracker pubblicitario o analitico invasivo.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Rights */}
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-white font-inter">I Tuoi Diritti</h2>
                  <p className="text-zinc-400 leading-relaxed">
                    Hai il controllo completo sui tuoi dati. Puoi richiedere la cancellazione del tuo account e di tutti i dati associati in qualsiasi momento contattando il supporto.
                    Una volta cancellati, i dati sono irrecuperabili.
                  </p>
                </section>

                <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 mt-8">
                    <p className="text-xs text-zinc-500 text-center">
                        Ultimo aggiornamento: Marzo 2026. Questa policy può essere soggetta a modifiche.
                    </p>
                </div>

              </div>
            </Squircle>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
