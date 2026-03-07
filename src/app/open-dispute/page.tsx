"use client";

import { Container } from "@/components/ui/primitives/container";
import { Card } from "@/components/ui/primitives/card";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, AlertTriangle, Upload, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

export default function OpenDisputePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Dispute submitted successfully. Our team will review it shortly.");
    setIsSubmitting(false);
    router.push("/market"); // Or wherever appropriate
  };

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
                        <AlertTriangle className="w-7 h-7 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                            Open a Dispute
                        </h1>
                        <p className="text-zinc-400 text-base leading-relaxed">
                            Report an issue with an order. We'll step in to help mediate and resolve the situation fairly.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>Please try to resolve the issue with the seller directly before opening a dispute.</p>
                    </div>
                </motion.div>
            </div>

            {/* Right Column: Form Card */}
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
                    innerClassName="bg-[#1C1C1E] space-y-8"
                >
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white">Order ID</label>
                                <Input 
                                    placeholder="e.g. #ORD-12345678" 
                                    className="bg-black/20 border-white/10 focus:border-white/20 text-white placeholder:text-zinc-600 h-12 rounded-xl"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white">Reason for Dispute</label>
                                <div className="relative">
                                    <select 
                                        className="w-full h-12 bg-black/20 border border-white/10 focus:border-white/20 rounded-xl px-4 text-white appearance-none outline-none cursor-pointer hover:bg-black/30 transition-colors"
                                        required
                                        defaultValue=""
                                    >
                                        <option value="" disabled className="bg-[#1C1C1E] text-zinc-500">Select a reason...</option>
                                        <option value="non_delivery" className="bg-[#1C1C1E]">Item not delivered</option>
                                        <option value="not_as_described" className="bg-[#1C1C1E]">Item not as described</option>
                                        <option value="defective" className="bg-[#1C1C1E]">Item is defective/banned</option>
                                        <option value="other" className="bg-[#1C1C1E]">Other issue</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white">Description</label>
                                <Textarea 
                                    placeholder="Please provide details about the issue. Be as specific as possible." 
                                    className="bg-black/20 border-white/10 focus:border-white/20 text-white placeholder:text-zinc-600 min-h-[150px] rounded-xl resize-none p-4"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white">Evidence</label>
                                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                        <Upload className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-white">Click to upload screenshots</p>
                                        <p className="text-xs text-zinc-500">JPG, PNG or PDF (Max 5MB)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button 
                                type="submit" 
                                className="w-full h-12 text-base bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-all"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Dispute"}
                            </Button>
                            <p className="text-center text-xs text-zinc-500 mt-4">
                                By submitting this dispute, you agree to our Terms of Service and Refund Policy.
                            </p>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>
      </Container>
    </div>
  );
}
