"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Search, 
  ShoppingBag, 
  ShieldCheck, 
  Ghost, 
  Globe, 
  CreditCard, 
  Package, 
  Sparkles, 
  Link as LinkIcon 
} from "lucide-react";
import { Navbar } from "@/components/app/navigation/Navbar";
import { Squircle } from "@/components/shared/ui/Squircle";
import { Button } from "@/components/shared/ui/button";
import { CopyMap } from "@/lib/app/content/copy-system";

export function SmartSearchClient({ copy }: { copy: CopyMap }) {
  const router = useRouter();
  const header = copy['header'] || {};
  const intro = copy['intro'] || {};

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-purple-900/20 to-transparent opacity-50 blur-[100px]" />
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
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-xl mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-50" />
                <Sparkles className="w-8 h-8 text-white relative z-10" />
              </div>
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 w-fit">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-xs font-bold text-white tracking-wide uppercase">{header.new_feature || "New Feature"}</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {header.title || "Smart Search"}
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                {header.subtitle || "Buy Anywhere with Crypto. Acquista da qualsiasi sito web usando le tue criptovalute, in totale privacy."}
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
                
                {/* Hero Section */}
                <section className="space-y-6 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-white font-inter leading-tight">
                    {intro.title || "Trovi qualcosa fuori dal marketplace?"} <br />
                    <span className="text-zinc-400">{intro.subtitle || "Incolla il link e noi lo acquistiamo per te."}</span>
                  </h2>
                  <p className="text-zinc-400 leading-relaxed max-w-2xl">
                    {intro.text || "Smart Search Ã¨ il nostro servizio di Proxy Buying avanzato. Ti permette di acquistare prodotti da Amazon, eBay, o qualsiasi altro e-commerce globale pagando in criptovalute. Noi gestiamo l'acquisto e la logistica, proteggendo la tua identitÃ  dal venditore originale."}
                  </p>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Steps */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/10 relative z-10">
                      <LinkIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-white font-bold text-lg mb-2">1. Copia il Link</h3>
                      <p className="text-sm text-zinc-400">Trova il prodotto su Amazon, eBay o altri. Copia l'URL della pagina.</p>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/10 relative z-10">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-white font-bold text-lg mb-2">2. Paga in Crypto</h3>
                      <p className="text-sm text-zinc-400">Incolla il link qui. Calcoleremo il totale in crypto. Paga in modo sicuro.</p>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/10 relative z-10">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-white font-bold text-lg mb-2">3. Ricevi Ovunque</h3>
                      <p className="text-sm text-zinc-400">Noi compriamo l'oggetto. Te lo spediamo o lo consegniamo digitalmente.</p>
                    </div>
                  </div>
                </section>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <Ghost className="w-6 h-6 text-zinc-400 shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-bold text-sm">Anonimato Totale</h4>
                      <p className="text-xs text-zinc-500 mt-1">Il venditore originale vede solo i nostri dati, mai i tuoi.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <Globe className="w-6 h-6 text-zinc-400 shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-bold text-sm">Accesso Globale</h4>
                      <p className="text-xs text-zinc-500 mt-1">Acquista da siti che non spediscono nel tuo paese o non accettano le tue carte.</p>
                    </div>
                  </div>
                </div>

              </div>
            </Squircle>
          </motion.div>
        </div>
      </main>
    </div>
  );
}


