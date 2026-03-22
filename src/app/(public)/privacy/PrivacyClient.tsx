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
import { Navbar } from "@/components/app/navigation/Navbar";
import { Squircle } from "@/components/shared/ui/Squircle";
import { Button } from "@/components/shared/ui/button";
import { CopyMap } from "@/lib/app/content/copy-system";

export function PrivacyClient({ copy }: { copy: CopyMap }) {
  const router = useRouter();
  const header = copy['header'] || {};
  const philosophy = copy['philosophy'] || {};
  const data = copy['data'] || {};

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
              {header.back_button || "Indietro"}
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
                {header.title || "Privacy Policy"}
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                {header.subtitle || "La tua privacy non ÃƒÂ¨ un'opzione, ÃƒÂ¨ la nostra prioritÃƒÂ . Scopri come proteggiamo i tuoi dati."}
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
                    <Lock className="text-white w-6 h-6" /> {philosophy.title || "Filosofia Privacy-First"}
                  </h2>
                  <p className="text-zinc-400 leading-relaxed">
                    {philosophy.text || "OpenlyMarket ÃƒÂ¨ costruito sul principio della minimizzazione dei dati. Non raccogliamo informazioni che non sono strettamente necessarie per il funzionamento del servizio. Crediamo che l'anonimato sia un diritto fondamentale, specialmente nel mondo delle transazioni digitali."}
                  </p>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Data Collection */}
                <section className="space-y-6">
                  <h3 className="text-xl font-bold text-white font-inter">{data.title || "Dati che Raccogliamo"}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-3">
                      <EyeOff className="w-8 h-8 text-white" />
                      <h4 className="text-white font-bold text-lg">{data.card1_title || "Nessun KYC"}</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {data.card1_desc || "Non richiediamo documenti d'identitÃƒÂ , passaporti o selfie. La tua identitÃƒÂ  reale rimane tua."}
                      </p>
                    </div>
                    
                    {/* Placeholder static cards if they weren't in seed or to keep structure */}
                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-3">
                      <Database className="w-8 h-8 text-white" />
                      <h4 className="text-white font-bold text-lg">Dati Transazionali</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Conserviamo solo i dati necessari per completare gli ordini (hash transazione, chat criptate). I log vengono eliminati periodicamente.
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-3">
                      <Server className="w-8 h-8 text-white" />
                      <h4 className="text-white font-bold text-lg">Server Sicuri</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        I nostri server sono situati in giurisdizioni che rispettano la privacy e sono protetti da crittografia avanzata.
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-3">
                      <Cookie className="w-8 h-8 text-white" />
                      <h4 className="text-white font-bold text-lg">Zero Tracker</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Non usiamo Google Analytics, Facebook Pixel o altri tracker invasivi. Usiamo solo analisi anonime lato server.
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



