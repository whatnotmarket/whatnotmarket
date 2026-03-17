"use client";

import { Container } from "@/components/ui/primitives/container";
import { Card } from "@/components/ui/primitives/card";
import { Navbar } from "@/components/Navbar";
import { ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CopyMap } from "@/lib/copy-system";

export function RefundClient({ copy }: { copy: CopyMap }) {
  const router = useRouter();
  const header = copy['header'] || {};
  const features = copy['features'] || {};

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      <Container className="relative z-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 items-start">
            
            {/* Left Column: Sticky Header */}
            <div className="lg:sticky lg:top-32 self-start space-y-8">
                <Button 
                    variant="ghost" 
                    className="pl-0 hover:bg-transparent hover:text-zinc-300 text-zinc-500 transition-colors -ml-2"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {header.back_button || "Back"}
                </Button>
                
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                >
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        <ShieldCheck className="w-7 h-7 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                            {header.title || "Refund Policy"}
                        </h1>
                        <p className="text-zinc-400 text-base leading-relaxed">
                            {header.subtitle || "Your purchases are protected. Learn about our Escrow Guarantee and how we handle disputes."}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right Column: Content Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-full"
            >
                <Card
                    radius={32}
                    smoothing={1}
                    border="default"
                    padding="lg"
                    innerClassName="bg-[#1C1C1E] space-y-12 text-zinc-300 leading-relaxed"
                >
                    {/* Key Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card 
                            radius={24} 
                            padding="md" 
                            innerClassName="bg-[#161618] flex flex-col items-center text-center gap-4 h-full"
                            className="border-white/5"
                        >
                            <div className="p-4 rounded-full bg-white/5 text-white">
                                <ShieldCheck className="w-8 h-8 fill-current" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-2 text-sm">{features.escrow_title || "Escrow Protection"}</h3>
                                <p className="text-xs text-zinc-400">{features.escrow_desc || "Funds held safely until verified."}</p>
                            </div>
                        </Card>
                        <Card 
                            radius={24} 
                            padding="md" 
                            innerClassName="bg-[#161618] flex flex-col items-center text-center gap-4 h-full"
                            className="border-white/5"
                        >
                            <div className="p-4 rounded-full bg-white/5 text-white">
                                <RefreshCw className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-2 text-sm">{features.money_back_title || "Money Back"}</h3>
                                <p className="text-xs text-zinc-400">{features.money_back_desc || "Full refund if not delivered."}</p>
                            </div>
                        </Card>
                        <Card 
                            radius={24} 
                            padding="md" 
                            innerClassName="bg-[#161618] flex flex-col items-center text-center gap-4 h-full"
                            className="border-white/5"
                        >
                            <div className="p-4 rounded-full bg-white/5 text-white">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-2 text-sm">Dispute Support</h3>
                                <p className="text-xs text-zinc-400">24/7 mediation assistance.</p>
                            </div>
                        </Card>
                    </div>
                </Card>
            </motion.div>
        </div>
      </Container>
    </div>
  );
}
