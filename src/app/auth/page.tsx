"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const inviteCode = searchParams.get("code");
  const [activeTab, setActiveTab] = useState<"login" | "signup">(
    inviteCode ? "signup" : "login"
  );
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState(inviteCode || "");
  const effectiveCode = inviteCode || code;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Welcome back!");
    router.push("/market");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (effectiveCode.trim().toUpperCase() !== (process.env.NEXT_PUBLIC_INVITE_CODE || "VIP2026").toUpperCase()) {
        setLoading(false);
        toast.error("Invalid invite code");
        return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setLoading(false);
        toast.error("Account created. Confirm email, then sign in.");
        return;
      }
    }

    setLoading(false);
    toast.success("Account created!");
    router.push("/market");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-black text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black pointer-events-none" />

      <div className="z-10 w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            {activeTab === "login" ? "Welcome back" : "Join the club"}
          </h2>
          <p className="text-zinc-400 text-sm">
            {activeTab === "login"
              ? "Sign in to access your deals"
              : "Enter your details to claim your invite"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex w-full bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 relative">
            <div className="absolute inset-0 bg-zinc-800/50 rounded-lg pointer-events-none opacity-0" /> {/* Just for structure */}
            {(["login", "signup"] as const).map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 relative z-10 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                >
                    {activeTab === tab && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-zinc-800 rounded-md -z-10 shadow-sm"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    {tab === "login" ? "Sign In" : "Redeem Invite"}
                </button>
            ))}
        </div>

        <div className="relative min-h-[300px]">
          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</label>
                  <Input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-white/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-white/20 h-11"
                  />
                </div>
                <Button
                    type="submit" 
                    className="w-full h-11 bg-white text-black hover:bg-zinc-200 mt-6"
                    disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignup}
                className="space-y-4"
              >
                 <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Invite Code</label>
                  <Input
                    type="text"
                    required
                    value={effectiveCode}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-white/20 h-11 text-center tracking-widest font-mono"
                    readOnly={!!inviteCode}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Full Name</label>
                  <Input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-white/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</label>
                  <Input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-white/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
                  <Input
                    type="password"
                    required
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-white/20 h-11"
                  />
                </div>
                <Button 
                    type="submit" 
                    className="w-full h-11 bg-white text-black hover:bg-zinc-200 mt-6"
                    disabled={loading}
                >
                   {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black text-white">Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}
