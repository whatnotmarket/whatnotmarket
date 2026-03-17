"use client";

import { Container } from "@/components/ui/primitives/container";
import { Card } from "@/components/ui/primitives/card";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, FileText, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CopyMap } from "@/lib/copy-system";

export function TermsClient({ copy }: { copy: CopyMap }) {
  const router = useRouter();
  const header = copy['header'] || {};
  const content = copy['content'] || {};

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
                        <Scale className="w-7 h-7 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                            {header.title || "Terms of Service"}
                        </h1>
                        <p className="text-zinc-400 text-base leading-relaxed">
                            {header.subtitle || "Please read these terms carefully before using our platform. They govern your relationship with OpenlyMarket."}
                        </p>
                        <p className="text-xs text-zinc-500 pt-2">
                            {header.last_updated || "Last updated: March 6, 2026"}
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
                    innerClassName="bg-[#1C1C1E] space-y-12 text-zinc-300 leading-relaxed min-h-[80vh]"
                >
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">{content.section1_title || "1. Introduction"}</h2>
                        <p>
                            {content.section1_text || 'Welcome to OpenlyMarket ("we," "our," or "us"). By accessing or using our website, services, or applications (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use our Services.'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">{content.section2_title || "2. User Accounts"}</h2>
                        <p>
                            {content.section2_text || "To access certain features of the Services, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating an account."}
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-zinc-500">
                            <li>You must be at least 18 years old to use our Services.</li>
                            <li>You may not use the Services for any illegal or unauthorized purpose.</li>
                            <li>We reserve the right to suspend or terminate your account at our sole discretion.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">{content.section3_title || "3. Marketplace & Transactions"}</h2>
                        <p>
                            {content.section3_text || "OpenlyMarket acts as a venue to allow users who comply with our policies to offer, sell, and buy certain goods and services. We are not a party to the actual transaction between buyers and sellers."}
                        </p>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mt-4">
                            <p className="text-white text-sm">
                                <strong className="block mb-1 text-base">{content.escrow_title || "Escrow Service"}</strong>
                                {content.escrow_text || "All payments are held in escrow until the buyer confirms receipt of the goods or services, or until a specified time period has elapsed. This ensures the safety of both parties."}
                            </p>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
      </Container>
    </div>
  );
}

