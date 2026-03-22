"use client";

import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { authToast as toast } from "@/lib/domains/notifications";
import { ExternalLink,Loader2,ShieldCheck } from "lucide-react";

interface StepVerificationProps {
  mockBotOpen: boolean;
  onOpenBot: () => void;
  generatedCode: string;
  telegramCode: string;
  setTelegramCode: (val: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function StepVerification({
  mockBotOpen,
  onOpenBot,
  generatedCode,
  telegramCode,
  setTelegramCode,
  onSubmit,
  loading
}: StepVerificationProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
         <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Verify via Telegram</h1>
            <p className="text-zinc-400">To protect buyers and keep quality high, sellers verify through Telegram. It takes ~1 minute.</p>
        </div>

        <div className="space-y-6">
            <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-[#2AABEE]/20 flex items-center justify-center">
                    <ShieldCheck className="h-10 w-10 text-[#2AABEE]" />
                </div>
            </div>

            {!mockBotOpen ? (
                <Button 
                    onClick={onOpenBot}
                    className="w-full h-14 bg-[#2AABEE] hover:bg-[#2AABEE]/90 text-white font-medium text-lg"
                >
                    Open Telegram Bot <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg text-center">
                        <p className="text-sm text-zinc-500 mb-2">Use this code from the bot:</p>
                        <div className="text-2xl font-mono font-bold text-white tracking-widest bg-black/50 p-3 rounded border border-zinc-800/50 select-all cursor-pointer hover:bg-black/80 transition-colors" onClick={() => {
                            navigator.clipboard.writeText(generatedCode);
                            toast.success("Copied to clipboard");
                        }}>
                            {generatedCode || "Generating..."}
                        </div>
                        <p className="text-xs text-zinc-600 mt-2">Simulated for demo purposes</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Enter Verification Code</label>
                        <Input 
                            value={telegramCode}
                            onChange={(e) => setTelegramCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && telegramCode && !loading) {
                                    onSubmit();
                                }
                            }}
                            placeholder="TG-XXXXXX" 
                            className="h-12 font-mono text-center text-lg tracking-widest bg-zinc-900/50 border-zinc-800 focus:border-[#2AABEE]"
                        />
                    </div>

                    <Button 
                        onClick={onSubmit}
                        disabled={!telegramCode || loading}
                        className="w-full h-12 bg-white text-black hover:bg-zinc-200"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Code"}
                    </Button>
                </div>
            )}
        </div>
    </div>
  );
}



