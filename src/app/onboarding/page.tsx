"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { analytics } from "@/lib/analytics";
import { authToast as toast } from "@/lib/notifications";
import { updateRolePreference, submitPayoutInfo, verifySellerCode, generateMockTelegramCode } from "./actions";

import { StepRole } from "@/components/onboarding/StepRole";
import { StepPayout } from "@/components/onboarding/StepPayout";
import { StepVerification } from "@/components/onboarding/StepVerification";
import { StepComplete } from "@/components/onboarding/StepComplete";

const STEPS = ["Role", "Payout", "Verification", "Complete"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [role, setRole] = useState<"buyer" | "seller" | "both" | null>(null);
  const [payoutAddress, setPayoutAddress] = useState("");
  const [payoutNetwork, setPayoutNetwork] = useState("ethereum-mainnet");
  const [payoutCurrency, setPayoutCurrency] = useState("USDC");
  const [feeAcknowledged, setFeeAcknowledged] = useState(false);
  const [telegramCode, setTelegramCode] = useState("");
  
  // Mock Telegram Bot State
  const [mockBotOpen, setMockBotOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    analytics.track("onboarding_started");
  }, []);

  useEffect(() => {
    analytics.track("onboarding_step_viewed", {
      step_index: step,
      step_name: STEPS[step],
    });
  }, [step]);

  const handleRoleSubmit = async () => {
    if (!role) return;
    setLoading(true);
    
    // If buyer only, we skip the rest
    if (role === "buyer") {
      await updateRolePreference(role);
      toast.success("All set! Welcome to the market.");
      analytics.track("onboarding_completed", { role: "buyer" });
      router.push("/market");
      return;
    }

    // Otherwise proceed to payout
    analytics.track("onboarding_role_selected", { role });
    setLoading(false);
    setStep(1);
  };

  const handlePayoutSubmit = async () => {
    if (!payoutAddress || !feeAcknowledged) return;
    setLoading(true);
    
    await updateRolePreference(role!); 
    await submitPayoutInfo({
      address: payoutAddress,
      network: payoutNetwork,
      currency: payoutCurrency,
    });
    
    analytics.track("onboarding_payout_submitted", {
      network: payoutNetwork,
      currency: payoutCurrency,
    });

    setLoading(false);
    setStep(2);
  };

  const handleOpenTelegramBot = async () => {
    setMockBotOpen(true);
    const result = await generateMockTelegramCode();
    setGeneratedCode(result.code);
    toast.info("Telegram Bot: Your verification code is " + result.code);
  };

  const handleVerificationSubmit = async () => {
    if (!telegramCode) return;
    setLoading(true);
    
    const result = await verifySellerCode(telegramCode);
    
    if (result.error) {
      toast.error(result.error);
      analytics.track("onboarding_verification_failed", { error: result.error });
      setLoading(false);
    } else {
      setLoading(false);
      setStep(3); // Complete
      analytics.track("onboarding_completed", { role: "seller" });
      setTimeout(() => {
        router.push("/market");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900">
        <motion.div 
          className="h-full bg-white"
          initial={{ width: "0%" }}
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="w-full max-w-lg space-y-8 z-10">
        <div className="flex items-center justify-between text-sm text-zinc-500 uppercase tracking-wider font-medium">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{STEPS[step]}</span>
        </div>

        <AnimatePresence mode="wait">
            {step === 0 && (
              <StepRole 
                role={role} 
                setRole={setRole} 
                onSubmit={handleRoleSubmit} 
                loading={loading} 
              />
            )}

            {step === 1 && (
              <StepPayout 
                payoutAddress={payoutAddress}
                setPayoutAddress={setPayoutAddress}
                payoutNetwork={payoutNetwork}
                setPayoutNetwork={setPayoutNetwork}
                payoutCurrency={payoutCurrency}
                setPayoutCurrency={setPayoutCurrency}
                feeAcknowledged={feeAcknowledged}
                setFeeAcknowledged={setFeeAcknowledged}
                onSubmit={handlePayoutSubmit}
                onBack={() => setStep(0)}
                loading={loading}
              />
            )}

            {step === 2 && (
              <StepVerification
                mockBotOpen={mockBotOpen}
                onOpenBot={handleOpenTelegramBot}
                generatedCode={generatedCode}
                telegramCode={telegramCode}
                setTelegramCode={setTelegramCode}
                onSubmit={handleVerificationSubmit}
                loading={loading}
              />
            )}

            {step === 3 && (
              <StepComplete />
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}

