"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";

export function InviteForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Use context login
    const success = login(code);

    if (success) {
      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      router.push("/market");
    } else {
      setError("Invalid invite code");
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4"
    >
      <div className="space-y-2">
        <Input
          placeholder="Enter invite code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="h-12 bg-white/5 border-white/10 text-center text-lg tracking-widest placeholder:tracking-normal focus:border-white/20 focus:ring-0"
          autoFocus
        />
      </div>
      <Button
        type="submit"
        disabled={loading || !code}
        className="w-full h-12 bg-white text-black hover:bg-white/90 transition-all font-medium text-base"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Enter <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <p className="text-center text-xs text-zinc-500 pt-4">
        Restricted access. Invitation only.
      </p>
    </motion.form>
  );
}
