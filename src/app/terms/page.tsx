"use client";

import { Container } from "@/components/ui/primitives/container";
import { Card } from "@/components/ui/primitives/card";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, FileText, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function TermsPage() {
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
                        <Scale className="w-7 h-7 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                            Terms of Service
                        </h1>
                        <p className="text-zinc-400 text-base leading-relaxed">
                            Please read these terms carefully before using our platform. They govern your relationship with Whatnot Market.
                        </p>
                        <p className="text-xs text-zinc-500 pt-2">
                            Last updated: March 6, 2026
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
                        <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
                        <p>
                            Welcome to Whatnot Market ("we," "our," or "us"). By accessing or using our website, services, or applications (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use our Services.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">2. User Accounts</h2>
                        <p>
                            To access certain features of the Services, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating an account.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-zinc-500">
                            <li>You must be at least 18 years old to use our Services.</li>
                            <li>You may not use the Services for any illegal or unauthorized purpose.</li>
                            <li>We reserve the right to suspend or terminate your account at our sole discretion.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">3. Marketplace & Transactions</h2>
                        <p>
                            Whatnot Market acts as a venue to allow users who comply with our policies to offer, sell, and buy certain goods and services. We are not a party to the actual transaction between buyers and sellers.
                        </p>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mt-4">
                            <p className="text-white text-sm">
                                <strong className="block mb-1 text-base">Escrow Service</strong>
                                All payments are held in escrow until the buyer confirms receipt of the goods or services, or until a specified time period has elapsed. This ensures the safety of both parties.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">4. Prohibited Items & Activities</h2>
                        <p>
                            You agree not to list, sell, buy, or request items that violate any applicable laws or our policies. This includes, but is not limited to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-zinc-500">
                            <li>Stolen goods or digital accounts obtained through hacking.</li>
                            <li>Counterfeit items or unauthorized replicas.</li>
                            <li>Personal data or information of third parties without consent.</li>
                            <li>Weapons, drugs, or other regulated substances.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">5. Fees and Payments</h2>
                        <p>
                            We charge fees for certain services, such as listing fees or transaction fees. These fees are disclosed to you prior to using such services. You are responsible for paying any applicable fees and taxes.
                        </p>
                        <p>
                            We accept various cryptocurrencies as payment methods. Refunds are processed in accordance with our Refund Policy.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">6. Limitation of Liability</h2>
                        <p>
                            To the fullest extent permitted by law, Whatnot Market shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">7. Changes to Terms</h2>
                        <p>
                            We may modify these Terms at any time. We will provide notice of any material changes by posting the new Terms on the Site. Your continued use of the Services after the effective date of the revised Terms constitutes your acceptance of the terms.
                        </p>
                    </div>

                    <div className="space-y-4 border-t border-white/5 pt-8">
                        <h2 className="text-2xl font-bold text-white">8. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at <span className="text-white hover:underline cursor-pointer">support@whatnotmarket.com</span>.
                        </p>
                    </div>
                </Card>
            </motion.div>
        </div>
      </Container>
    </div>
  );
}
