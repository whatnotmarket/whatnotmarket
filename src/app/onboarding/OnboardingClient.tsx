"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { authToast as toast } from "@/lib/notifications";
import {
  generateMockTelegramCode,
  submitPayoutInfo,
  updateRolePreference,
  verifySellerCode,
} from "./actions";

import { StepRole } from "@/components/onboarding/StepRole";
import { StepPayout } from "@/components/onboarding/StepPayout";
import { StepVerification } from "@/components/onboarding/StepVerification";
import { StepComplete } from "@/components/onboarding/StepComplete";
import { CopyMap } from "@/lib/copy-system";

const STEPS = ["Role", "Payout", "Verification", "Complete"];

export function OnboardingClient({ copy }: { copy: CopyMap }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [role, setRole] = useState<"buyer" | "seller" | "both" | null>(null);
  const [payoutAddress, setPayoutAddress] = useState("");
  const [payoutNetwork, setPayoutNetwork] = useState("ethereum-mainnet");
  const [payoutCurrency, setPayoutCurrency] = useState("USDC");
  const [feeAcknowledged, setFeeAcknowledged] = useState(false);
  const [telegramCode, setTelegramCode] = useState("");
  const [mockBotOpen, setMockBotOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  const stepsCopy = copy["steps"] || {};
  const progressSteps = [
    { id: 0, label: stepsCopy.role || "Role" },
    { id: 1, label: stepsCopy.payout || "Payout" },
    { id: 2, label: stepsCopy.verification || "Verification" },
    { id: 3, label: stepsCopy.complete || "Complete" },
  ];

  useEffect(() => {
    analytics.track("onboarding_started");
  }, []);

  useEffect(() => {
    analytics.track("onboarding_step_viewed", {
      step_index: step,
      step_name: STEPS[step],
    });
  }, [step]);

  useEffect(() => {
    if (step !== 3) return;

    const timeoutId = window.setTimeout(() => {
      analytics.track("onboarding_completed", { role: "seller" });
      router.push("/market");
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [router, step]);

  const handleRoleSubmit = async () => {
    if (!role) return;

    analytics.track("onboarding_role_selected", { role });

    if (role !== "buyer") {
      setStep(1);
      return;
    }

    setLoading(true);

    try {
      const result = await updateRolePreference(role);

      if (result?.error) {
        toast.error(result.error);
        analytics.track("onboarding_role_update_failed", { role, error: result.error });
        return;
      }

      toast.success("All set! Welcome to the market.");
      analytics.track("onboarding_completed", { role: "buyer" });
      router.push("/market");
    } catch (error) {
      toast.error("Unable to complete onboarding right now.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutSubmit = async () => {
    if (!role || !payoutAddress || !feeAcknowledged) return;

    setLoading(true);

    try {
      const roleResult = await updateRolePreference(role);

      if (roleResult?.error) {
        toast.error(roleResult.error);
        analytics.track("onboarding_payout_failed", {
          stage: "role_preference",
          error: roleResult.error,
        });
        return;
      }

      const payoutResult = await submitPayoutInfo({
        address: payoutAddress,
        network: payoutNetwork,
        currency: payoutCurrency,
      });

      if (payoutResult?.error) {
        toast.error(payoutResult.error);
        analytics.track("onboarding_payout_failed", {
          stage: "payout_info",
          error: payoutResult.error,
        });
        return;
      }

      analytics.track("onboarding_payout_submitted", {
        network: payoutNetwork,
        currency: payoutCurrency,
      });
      setStep(2);
    } catch (error) {
      toast.error("Unable to save payout details right now.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTelegramBot = async () => {
    try {
      const result = await generateMockTelegramCode();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (!result.code) {
        toast.error("Unable to generate a verification code.");
        return;
      }
      setGeneratedCode(result.code);
      setMockBotOpen(true);
      toast.info("Telegram Bot: Your verification code is " + result.code);
    } catch (error) {
      toast.error("Unable to open the Telegram bot right now.");
      console.error(error);
    }
  };

  const handleVerificationSubmit = async () => {
    const normalizedCode = telegramCode.trim().toUpperCase();
    if (!normalizedCode) return;

    setLoading(true);

    try {
      const result = await verifySellerCode(normalizedCode);

      if (result.error) {
        toast.error(result.error);
        analytics.track("onboarding_verification_failed", { error: result.error });
        return;
      }

      analytics.track("onboarding_verification_success");
      setTelegramCode(normalizedCode);
      setStep(3);
    } catch (error) {
      toast.error("Unable to verify your code right now.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black text-white md:flex-row">
      <div className="flex w-full shrink-0 flex-col justify-between border-b border-white/5 bg-zinc-900/50 p-6 md:w-80 md:border-b-0 md:border-r md:p-10">
        <div>
          <div className="mb-8 flex items-center gap-3 md:mb-12">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-black">
              W
            </div>
            <span className="text-lg font-bold tracking-wide">OpenlyMarket</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white md:text-3xl">Setup Account</h1>
              <p className="text-sm text-zinc-400">Complete your profile to start trading.</p>
            </div>

            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2 md:flex-col md:gap-4 md:overflow-visible md:pb-0">
              {progressSteps.map((progressStep, index) => (
                <div
                  key={progressStep.id}
                  className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 transition-all ${
                    step === index
                      ? "bg-white/10 text-white"
                      : step > index
                        ? "text-emerald-400"
                        : "text-zinc-500"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${
                      step === index
                        ? "border-white bg-white text-black"
                        : step > index
                          ? "border-emerald-400 bg-emerald-400 text-black"
                          : "border-zinc-700 bg-transparent"
                    }`}
                  >
                    {step > index ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </div>
                  <span className="text-sm font-medium">{progressStep.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden text-xs text-zinc-600 md:block">
          Need help?{" "}
          <a href="#" className="text-zinc-400 underline hover:text-white">
            Contact Support
          </a>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-0 h-[500px] w-full bg-indigo-900/10 blur-[120px]" />

        <div className="flex flex-1 items-center justify-center overflow-y-auto p-6 md:p-10">
          <div className="w-full max-w-xl">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <StepRole
                  key="role"
                  role={role}
                  setRole={setRole}
                  onSubmit={handleRoleSubmit}
                  loading={loading}
                />
              )}

              {step === 1 && (
                <StepPayout
                  key="payout"
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
                  key="verification"
                  mockBotOpen={mockBotOpen}
                  onOpenBot={handleOpenTelegramBot}
                  generatedCode={generatedCode}
                  telegramCode={telegramCode}
                  setTelegramCode={setTelegramCode}
                  onSubmit={handleVerificationSubmit}
                  loading={loading}
                />
              )}

              {step === 3 && <StepComplete key="complete" />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

