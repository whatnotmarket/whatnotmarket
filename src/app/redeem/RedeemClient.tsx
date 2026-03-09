"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { useUser } from "@/contexts/UserContext";
import { 
  Gift, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { marketToast as toast } from "@/lib/notifications";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { cn } from "@/lib/utils";
import { CopyMap } from "@/lib/copy-system";
import Link from "next/link";

export function RedeemClient({ copy }: { copy: CopyMap }) {
  const { role } = useUser();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [error, setError] = useState("");
  const { width, height } = useWindowSize();
  
  const content = copy['content'] || {};

  // Redirect if not buyer (in real app middleware would handle this)
  if (role === "seller") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>This page is only for buyers.</p>
      </div>
    );
  }

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    
    setLoading(true);
    setError("");

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (code === "INVALID") {
      setError("Invalid or expired code.");
      setLoading(false);
    } else {
      setRedeemed(true);
      setLoading(false);
      toast.success("Code redeemed successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-zinc-800 selection:text-white pb-20">
      <Navbar />
      
      {redeemed && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent opacity-50 blur-[120px]" />
      </div>

      <main className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center justify-center min-h-[80vh]">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Squircle 
            radius={32} 
            smoothing={1} 
            className="w-full drop-shadow-2xl"
            innerClassName="bg-[#1C1C1E] border border-white/10 overflow-hidden p-8"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-2">{content.title || "Redeem Code"}</h1>
              <p className="text-zinc-400">
                {content.subtitle || "Enter your gift card or promo code below to add credits to your balance."}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!redeemed ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleRedeem}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder={content.placeholder || "Enter code (e.g. GIFT-1234)"}
                        className={cn(
                          "h-14 bg-black/30 border-white/10 text-lg font-mono tracking-wider text-center uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal focus:border-blue-500/50 focus:ring-blue-500/20",
                          error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                        )}
                        disabled={loading}
                      />
                      {code && (
                        <button
                          type="button"
                          onClick={() => {navigator.clipboard.writeText(code); toast.success("Copied!");}}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-red-400 text-sm justify-center"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </motion.div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-bold bg-white text-black hover:bg-zinc-200 rounded-xl transition-all"
                    disabled={!code || loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {content.button || "Redeem Code"} <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <span className="text-emerald-400 font-bold text-lg">{content.success_title || "Success!"}</span>
                    <p className="text-sm text-zinc-400">{content.success_message || "Your code has been redeemed successfully."}</p>
                  </div>
                  
                  <Button asChild className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl">
                    <Link href="/market">{content.back_button || "Back to Market"}</Link>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Squircle>
        </motion.div>
      </main>
    </div>
  );
}
