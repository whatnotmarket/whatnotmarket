"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  MessageSquare, 
  Mail, 
  Send, 
  HelpCircle,
  Clock,
  MapPin
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/button";

// Custom Telegram Icon since it's not in Lucide
const TelegramIcon = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 100 100" 
        version="1.1" 
        xmlSpace="preserve" 
        xmlns="http://www.w3.org/2000/svg" 
        xmlnsXlink="http://www.w3.org/1999/xlink" 
        fill="currentColor"
        className={className}
    >
        <g>
            <path d="M88.723,12.142C76.419,17.238,23.661,39.091,9.084,45.047c-9.776,3.815-4.053,7.392-4.053,7.392 s8.345,2.861,15.499,5.007c7.153,2.146,10.968-0.238,10.968-0.238l33.62-22.652c11.922-8.107,9.061-1.431,6.199,1.431 c-6.199,6.2-16.452,15.975-25.036,23.844c-3.815,3.338-1.908,6.199-0.238,7.63c6.199,5.246,23.129,15.976,24.082,16.691 c5.037,3.566,14.945,8.699,16.452-2.146c0,0,5.961-37.435,5.961-37.435c1.908-12.637,3.815-24.321,4.053-27.659 C97.307,8.804,88.723,12.142,88.723,12.142z" />
        </g>
    </svg>
);

export default function ContactPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent opacity-50 blur-[100px]" />
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
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Contattaci
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                Siamo qui per aiutarti. Scegli il canale che preferisci per metterti in contatto con il nostro team.
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
                
                {/* Telegram Support - Primary */}
                <section className="space-y-6">
                  <div className="bg-[#0A0A0A] p-8 rounded-2xl border border-white/5 text-center space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                    
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                        <TelegramIcon className="w-10 h-10 text-white" />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white font-inter">Supporto Telegram</h2>
                        <p className="text-zinc-400 max-w-md mx-auto">
                            Il modo più veloce per ricevere assistenza. Il nostro team di supporto è attivo 24/7 per risolvere problemi relativi a ordini, account o escrow.
                        </p>
                    </div>

                    <Button 
                        onClick={() => window.open("https://t.me/whatnotmarketbot", "_blank")}
                        className="h-12 px-8 font-bold bg-[#0088cc] text-white hover:bg-[#0077b5] rounded-xl w-full sm:w-auto"
                    >
                        <TelegramIcon className="w-5 h-5 mr-2" /> Apri Chat Supporto
                    </Button>
                  </div>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Other Channels */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-4">
                        <Mail className="w-8 h-8 text-white" />
                        <div>
                            <h3 className="text-lg font-bold text-white">Email</h3>
                            <p className="text-sm text-zinc-400 mb-4">Per richieste formali, partnership o problemi legali.</p>
                            <a href="mailto:support@whatnotmarket.com" className="text-white font-medium hover:underline decoration-white/30 underline-offset-4">
                                support@whatnotmarket.com
                            </a>
                        </div>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-4">
                        <HelpCircle className="w-8 h-8 text-white" />
                        <div>
                            <h3 className="text-lg font-bold text-white">FAQ</h3>
                            <p className="text-sm text-zinc-400 mb-4">Trova risposte immediate alle domande più frequenti.</p>
                            <Button 
                                variant="outline" 
                                className="h-10 border-white/10 hover:bg-white/5 text-white"
                                onClick={() => router.push('/about')} // Placeholder link
                            >
                                Vai alle FAQ
                            </Button>
                        </div>
                    </div>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Info */}
                <section className="space-y-6">
                    <h3 className="text-xl font-bold text-white font-inter">Orari di Supporto</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 bg-[#0A0A0A] p-4 rounded-xl border border-white/5">
                            <Clock className="w-6 h-6 text-zinc-400" />
                            <div>
                                <div className="font-bold text-white">Lun - Ven</div>
                                <div className="text-xs text-zinc-500">24/24h</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-[#0A0A0A] p-4 rounded-xl border border-white/5">
                            <Clock className="w-6 h-6 text-zinc-400" />
                            <div>
                                <div className="font-bold text-white">Weekend</div>
                                <div className="text-xs text-zinc-500">Supporto limitato</div>
                            </div>
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
