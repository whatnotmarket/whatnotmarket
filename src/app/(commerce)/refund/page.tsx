"use client";

import { Container } from "@/components/shared/ui/primitives/container";
/* eslint-disable react/no-unescaped-entities */
import { Navbar } from "@/components/app/navigation/Navbar";
import { CrossClusterLinks } from "@/components/app/seo/CrossClusterLinks";
import { Button } from "@/components/shared/ui/button";
import { Card } from "@/components/shared/ui/primitives/card";
import { motion } from "framer-motion";
import { AlertTriangle,ArrowLeft,CheckCircle2,RefreshCw,ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RefundPage() {
  const router = useRouter();

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
                    Back
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
                            Refund Policy
                        </h1>
                        <p className="text-zinc-400 text-base leading-relaxed">
                            Your purchases are protected. Learn about our Escrow Guarantee and how we handle disputes.
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
                                <h3 className="font-bold text-white mb-2 text-sm">Escrow Protection</h3>
                                <p className="text-xs text-zinc-400">Funds held safely until verified.</p>
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
                                <h3 className="font-bold text-white mb-2 text-sm">Money Back</h3>
                                <p className="text-xs text-zinc-400">Full refund if not delivered.</p>
                            </div>
                        </Card>
                        <Card 
                            radius={24} 
                            padding="md" 
                            innerClassName="bg-[#161618] flex flex-col items-center text-center gap-4 h-full"
                            className="border-white/5"
                        >
                            <div className="p-4 rounded-full bg-white/5 text-white">
                                <AlertTriangle className="w-8 h-8 fill-current" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-2 text-sm">Disputes</h3>
                                <p className="text-xs text-zinc-400">Fair mediation team.</p>
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">1. Eligibility for Refunds</h2>
                        <p>
                            You may be eligible for a refund under the following circumstances:
                        </p>
                        <ul className="space-y-3">
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5 fill-current" />
                                <span><strong>Non-Delivery:</strong> The seller failed to deliver the item or service within the agreed timeframe.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5 fill-current" />
                                <span><strong>Item Not as Described:</strong> The item delivered is significantly different from the seller's description (e.g., different account level, missing features).</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5 fill-current" />
                                <span><strong>Defective Item:</strong> The item (e.g., account credentials) does not work upon delivery.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">2. The Refund Process</h2>
                        <div className="space-y-6 mt-6">
                            {[
                                { step: 1, title: "Open a Dispute", desc: "Before completing the order, click 'Report Issue' on the order page." },
                                { step: 2, title: "Negotiation", desc: "Resolve directly with the seller (replacement or refund)." },
                                { step: 3, title: "Escalation", desc: "If no agreement in 24h, our team steps in." },
                                { step: 4, title: "Decision", desc: "Funds returned to you if decided in your favor." }
                            ].map((item) => (
                                <div key={item.step} className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white shrink-0 text-sm">
                                        {item.step}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{item.title}</h4>
                                        <p className="text-sm text-zinc-400">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">3. Non-Refundable Situations</h2>
                        <p>
                            Refunds are generally NOT granted in the following cases:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-zinc-500">
                            <li>You changed your mind after the item was delivered and verified.</li>
                            <li>You confirmed the order as "Completed", releasing the funds to the seller.</li>
                            <li>The issue was caused by your own actions (e.g., getting an account banned for violating game rules after purchase).</li>
                        </ul>
                    </div>

                    <div className="space-y-4 border-t border-white/5 pt-8">
                        <h2 className="text-2xl font-bold text-white">4. Chargebacks</h2>
                        <p>
                            Initiating a chargeback with your payment provider without first contacting us may result in the permanent suspension of your OpenlyMarket account. We encourage you to use our dispute resolution process first.
                        </p>
                    </div>
                </Card>

                <CrossClusterLinks variant="refund" className="mt-6" />
            </motion.div>
        </div>
      </Container>
    </div>
  );
}


