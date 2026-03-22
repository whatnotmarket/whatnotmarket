"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Github, 
  Code2, 
  Cpu, 
  ShieldCheck, 
  GitBranch, 
  Terminal,
  Layers
} from "lucide-react";
import { Navbar } from "@/components/app/navigation/Navbar";
import { Squircle } from "@/components/shared/ui/Squircle";
import { Button } from "@/components/shared/ui/button";
import { CopyMap } from "@/lib/app/content/copy-system";

export function OpenSourceClient({ copy }: { copy: CopyMap }) {
  const router = useRouter();
  const header = copy['header'] || {};
  const philosophy = copy['philosophy'] || {};
  const techStack = copy['tech_stack'] || {};

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-zinc-800/30 to-transparent opacity-50 blur-[100px]" />
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
                <Code2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {header.title || "Open Source"}
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                {header.subtitle || "Trasparenza totale. Codice verificabile. Costruito dalla community, per la community."}
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
                
                {/* Philosophy */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-inter">
                    <Github className="text-white w-6 h-6" /> {philosophy.title || "PerchÃ© Open Source?"}
                  </h2>
                  <p className="text-zinc-400 leading-relaxed">
                    {philosophy.text1 || "Crediamo che un marketplace che gestisce valore e dati sensibili debba essere completamente trasparente. Rendendo il nostro codice pubblico, permettiamo a chiunque di verificare come vengono gestiti i dati, come funzionano gli smart contract (ove presenti) e come Ã¨ costruita la sicurezza della piattaforma."}
                  </p>
                  <p className="text-zinc-400 leading-relaxed">
                    {philosophy.text2 || "La sicurezza attraverso l'oscuritÃ  Ã¨ un mito. La vera sicurezza nasce dalla verifica costante di migliaia di occhi esperti."}
                  </p>
                </section>

                <div className="h-px w-full bg-white/5" />

                {/* Tech Stack */}
                <section className="space-y-6">
                  <h3 className="text-xl font-bold text-white font-inter">{techStack.title || "Tech Stack Moderno"}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-3">
                      <Layers className="w-8 h-8 text-white" />
                      <h4 className="text-white font-bold text-lg">{techStack.frontend_title || "Frontend"}</h4>
                      <ul className="text-sm text-zinc-400 space-y-1">
                        <li>Next.js 14 (App Router)</li>
                        <li>Tailwind CSS</li>
                        <li>Framer Motion</li>
                        <li>Radix UI</li>
                      </ul>
                    </div>
                    {/* ... other static tech stack items ... */}
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


