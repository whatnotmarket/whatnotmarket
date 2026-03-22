"use client";

import { useState } from "react";
import { Navbar } from "@/components/app/navigation/Navbar";
import { Squircle } from "@/components/shared/ui/Squircle";
import { useUser } from "@/contexts/UserContext";
import { 
  Gift, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Copy
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { marketToast as toast } from "@/lib/domains/notifications";
import { cn } from "@/lib/core/utils/utils";

export default function RedeemPage() {
  const { role } = useUser();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [error, setError] = useState("");

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
              <h1 className="text-3xl font-extrabold text-white mb-2">Redeem Code</h1>
              <p className="text-zinc-400">
                Enter your gift card or promo code below to add credits to your balance.
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
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-500 ml-1">CODE</label>
                    <div className="relative">
                      <Input 
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value.toUpperCase());
                          setError("");
                        }}
                        placeholder="XXXX-XXXX-XXXX"
                        className={cn(
                          "h-14 text-center text-xl tracking-widest font-mono uppercase bg-[#2C2C2E] border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-2xl transition-all placeholder:tracking-normal placeholder:text-zinc-600",
                          error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                        )}
                      />
                    </div>
                    {error && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-xs text-center flex items-center justify-center gap-1.5"
                      >
                        <AlertCircle className="w-3 h-3" /> {error}
                      </motion.p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading || code.length < 4}
                    className="w-full h-14 rounded-2xl font-bold text-lg bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-white/5"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Redeem Now"}
                  </Button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold mb-2">
                      <CheckCircle2 className="w-5 h-5" /> Success!
                    </div>
                    <div className="text-4xl font-extrabold text-white mb-1">$50.00</div>
                    <div className="text-sm text-zinc-400">added to your balance</div>
                  </div>

                  <Button 
                    onClick={() => {
                      setRedeemed(false);
                      setCode("");
                    }}
                    className="w-full h-12 rounded-xl font-bold bg-[#2C2C2E] text-white hover:bg-[#323234] border border-white/5"
                  >
                    Redeem Another
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-zinc-500">
                Having trouble? <a href="#" className="text-white hover:underline">Contact Support</a>
              </p>
            </div>
          </Squircle>
        </motion.div>

      </main>
    </div>
  );
}



