"use client";

import { useRouter } from "next/navigation";
/* eslint-disable react/no-unescaped-entities */
import { Navbar } from "@/components/app/navigation/Navbar";
import { Squircle } from "@/components/shared/ui/Squircle";
import { Button } from "@/components/shared/ui/button";
import { motion } from "framer-motion";
import {
ArrowLeft,
CreditCard,
Ghost,
Globe,
Link as LinkIcon,
Package,
Search,
ShieldCheck,
ShoppingBag,
Sparkles
} from "lucide-react";

export default function SmartSearchPage() {
  const router = useRouter();

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
              Indietro
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
                <span className="text-xs font-bold text-white tracking-wide uppercase">New Feature</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Smart Search
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                Buy Anywhere with Crypto.
                <br />
                Acquista da qualsiasi sito web usando le tue criptovalute, in totale privacy.
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
                    Trovi qualcosa fuori dal marketplace? <br />
                    <span className="text-zinc-400">Incolla il link e noi lo acquistiamo per te.</span>
                  </h2>
                  <p className="text-zinc-400 leading-relaxed max-w-2xl">
                    Smart Search ÃƒÂ¨ il nostro servizio di <strong>Proxy Buying</strong> avanzato. 
                    Ti permette di acquistare prodotti da Amazon, eBay, o qualsiasi altro e-commerce globale pagando in criptovalute.
                    Noi gestiamo l'acquisto e la logistica, proteggendo la tua identitÃƒÂ  dal venditore originale.
                  </p>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Come Funziona */}
                <section className="space-y-8">
                  <h3 className="text-xl font-bold text-white font-inter flex items-center gap-2">
                    <Search className="w-5 h-5 text-white" /> Come Funziona
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                    {/* Connecting line for desktop */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5 hidden md:block -translate-x-1/2" />

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 relative group hover:border-white/20 transition-all">
                      <div className="absolute top-4 right-4 text-zinc-600 font-mono text-xs opacity-50 group-hover:opacity-100">01</div>
                      <LinkIcon className="w-8 h-8 text-white mb-4" />
                      <h4 className="text-white font-bold text-lg mb-2">Trova il Prodotto</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Naviga sul web e trova l'oggetto che desideri. Copia l'URL della pagina del prodotto da qualsiasi store online.
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 relative group hover:border-white/20 transition-all">
                      <div className="absolute top-4 right-4 text-zinc-600 font-mono text-xs opacity-50 group-hover:opacity-100">02</div>
                      <Search className="w-8 h-8 text-white mb-4" />
                      <h4 className="text-white font-bold text-lg mb-2">Incolla in Smart Search</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Incolla il link nella barra di ricerca di OpenlyMarket. Il nostro sistema analizzerÃƒÂ  il prodotto e calcolerÃƒÂ  il prezzo in crypto.
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 relative group hover:border-white/20 transition-all">
                      <div className="absolute top-4 right-4 text-zinc-600 font-mono text-xs opacity-50 group-hover:opacity-100">03</div>
                      <CreditCard className="w-8 h-8 text-white mb-4" />
                      <h4 className="text-white font-bold text-lg mb-2">Paga in Crypto</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Paga l'ordine usando Bitcoin, Monero o USDT. I fondi vengono bloccati nel nostro sistema Escrow sicuro.
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 relative group hover:border-white/20 transition-all">
                      <div className="absolute top-4 right-4 text-zinc-600 font-mono text-xs opacity-50 group-hover:opacity-100">04</div>
                      <Package className="w-8 h-8 text-white mb-4" />
                      <h4 className="text-white font-bold text-lg mb-2">Noi Acquistiamo & Spediamo</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Un nostro operatore verificato acquista l'oggetto per te e lo fa spedire all'indirizzo (o locker) che hai indicato, proteggendo la tua privacy.
                      </p>
                    </div>
                  </div>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Vantaggi Chiave */}
                <section className="space-y-6">
                  <h3 className="text-xl font-bold text-white font-inter flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-white" /> PerchÃƒÂ© usare Smart Search
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-white/5 text-center hover:bg-white/5 transition-colors">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ghost className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-white font-bold mb-2">Privacy Assoluta</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Il merchant originale (es. Amazon) vede solo i dati della nostra piattaforma, mai i tuoi dati personali o finanziari.
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-white/5 text-center hover:bg-white/5 transition-colors">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-white font-bold mb-2">Accesso Globale</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Compra da siti che non spediscono nel tuo paese o che non accettano i tuoi metodi di pagamento.
                      </p>
                    </div>

                    <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-white/5 text-center hover:bg-white/5 transition-colors">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-white font-bold mb-2">Crypto Utility</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Trasforma le tue criptovalute in beni reali senza dover passare per un exchange o una banca.
                      </p>
                    </div>
                  </div>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Esempio Pratico */}
                <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <h3 className="text-lg font-bold text-white font-inter">Esempio di Transazione</h3>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm border-b border-white/5 pb-4">
                         <span className="text-zinc-400">Prodotto:</span>
                         <span className="text-white font-medium text-right">iPhone 15 Pro (da Apple Store USA)</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm border-b border-white/5 pb-4">
                         <span className="text-zinc-400">Prezzo Originale:</span>
                         <span className="text-white font-medium text-right">$999.00</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm border-b border-white/5 pb-4">
                         <span className="text-zinc-400">Smart Search Fee (5%):</span>
                         <span className="text-white font-medium text-right">$49.95</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm pt-2">
                         <span className="text-zinc-300 font-bold">Totale in USDT:</span>
                         <span className="text-white font-bold text-lg text-right">1048.95 USDT</span>
                      </div>
                   </div>
                   
                   <div className="bg-white/5 rounded-lg p-4 text-xs text-zinc-400 leading-relaxed mt-4">
                      <p>
                        *La fee copre il servizio di acquisto proxy, la gestione del pagamento e la protezione della privacy. Le spese di spedizione internazionali possono variare.
                      </p>
                   </div>
                </section>

                {/* CTA */}
                <section className="text-center space-y-8 pt-4">
                  <div className="max-w-xl mx-auto space-y-4">
                    <h2 className="text-2xl font-bold text-white">Pronto a comprare ovunque?</h2>
                    <p className="text-zinc-400">
                      Incolla un link e lascia che ci occupiamo noi del resto.
                    </p>
                  </div>

                  <div className="flex justify-center w-full">
                    <div className="relative w-full max-w-lg group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LinkIcon className="h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Incolla qui il link del prodotto (es. amazon.com/...)"
                            className="w-full h-14 pl-12 pr-32 bg-[#0A0A0A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                        />
                        <button 
                            className="absolute right-2 top-2 bottom-2 bg-white text-black font-bold px-4 rounded-lg hover:bg-zinc-200 transition-colors text-sm"
                            onClick={() => router.push('/requests/new')} // Placeholder action
                        >
                            Cerca
                        </button>
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


