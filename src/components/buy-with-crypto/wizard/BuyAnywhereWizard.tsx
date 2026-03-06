"use client";

import { useState, useRef, useEffect } from "react";
import { Squircle } from "@/components/ui/Squircle";
import { AnimatePresence, motion } from "framer-motion";
import { WizardData, WizardProps } from "./types";
import { StepConfirmPrice } from "./StepConfirmPrice";
import { StepQuantity } from "./StepQuantity";
import { StepOptions } from "./StepOptions";
import { StepPaymentMethod } from "./StepPaymentMethod";
import { StepPrivacyDelivery } from "./StepPrivacyDelivery";
import { StepNotes } from "./StepNotes";
import { StepContact } from "./StepContact";
import { StepReviewAndPay } from "./StepReviewAndPay";
import { X } from "lucide-react";

const STEPS = [
  "Confirm Price",
  "Quantity",
  "Options",
  "Payment Method",
  "Privacy Delivery",
  "Additional Notes",
  "Contact Info",
  "Review Order"
];

export function BuyAnywhereWizard({ initialUrl, initialData, onSubmit, onCancel }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const wizardRef = useRef<HTMLDivElement>(null);
  
  const [data, setData] = useState<WizardData>({
    price: initialData?.price || 0,
    priceConfirmed: false,
    quantity: 1,
    options: "",
    currency: "",
    network: "",
    city: "",
    country: "",
    region: "",
    notes: "",
    telegramUsername: ""
  });

  // Scroll to top of wizard on step change
  useEffect(() => {
    if (wizardRef.current) {
      // Small timeout to ensure DOM has updated and layout is stable
      setTimeout(() => {
        wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [currentStep]);

  const updateData = (newData: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step -> Submit
      onSubmit(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  // Render step component based on index
  const renderStep = () => {
    const props = {
      data,
      updateData,
      onNext: handleNext,
      onBack: handleBack,
      initialUrl,
      initialData,
      isFirstStep: currentStep === 0,
      isLastStep: currentStep === STEPS.length - 1
    };

    switch (currentStep) {
      case 0: return <StepConfirmPrice {...props} />;
      case 1: return <StepQuantity {...props} />;
      case 2: return <StepOptions {...props} />;
      case 3: return <StepPaymentMethod {...props} />;
      case 4: return <StepPrivacyDelivery {...props} />;
      case 5: return <StepNotes {...props} />;
      case 6: return <StepContact {...props} />;
      case 7: return <StepReviewAndPay {...props} />;
      default: return null;
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto scroll-mt-24" ref={wizardRef}>
      {/* Wizard Header */}
      <div className="mb-8 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
              Step <span className="text-white">{currentStep + 1}</span> of {STEPS.length}
            </h2>
            <p className="text-white font-bold text-lg">{STEPS[currentStep]}</p>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Content with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
