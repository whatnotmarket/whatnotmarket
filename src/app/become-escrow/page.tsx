"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Wallet, 
  TrendingUp, 
  Lock, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Award,
  Zap,
  DollarSign,
  Copy,
  ExternalLink,
  Send,
  Scale
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { marketToast as toast } from "@/lib/notifications";

// Schema for Step 2
const applicationSchema = z.object({
  partnerName: z.string().min(3, "Partner name must be at least 3 characters"),
  experience: z.string().min(10, "Please describe your experience"),
  reputation: z.string().optional(),
  cryptoExperience: z.string().min(5, "Please describe your crypto experience"),
  notes: z.string().min(1, "This field is required"),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const TelegramIcon = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 100 100" 
        version="1.1" 
        xmlSpace="preserve" 
        xmlns="http://www.w3.org/2000/svg" 
        xmlnsXlink="http://www.w3.org/1999/xlink" 
        fill="currentColor"
        className={className}
    >
        <g>
            <path d="M88.723,12.142C76.419,17.238,23.661,39.091,9.084,45.047c-9.776,3.815-4.053,7.392-4.053,7.392 s8.345,2.861,15.499,5.007c7.153,2.146,10.968-0.238,10.968-0.238l33.62-22.652c11.922-8.107,9.061-1.431,6.199,1.431 c-6.199,6.2-16.452,15.975-25.036,23.844c-3.815,3.338-1.908,6.199-0.238,7.63c6.199,5.246,23.129,15.976,24.082,16.691 c5.037,3.566,14.945,8.699,16.452-2.146c0,0,5.961-37.435,5.961-37.435c1.908-12.637,3.815-24.321,4.053-27.659 C97.307,8.804,88.723,12.142,88.723,12.142z" />
        </g>
    </svg>
);

export default function BecomeEscrowPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [applicationData, setApplicationData] = useState<ApplicationFormValues | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
  });

  const onSubmit = (data: ApplicationFormValues) => {
    setApplicationData(data);
    setStep(3); // Step 3 is "Ready to send"
  };

  const generateTelegramMessage = () => {
    if (!applicationData) return "";
    return `Escrow Partner Application:

Name: ${applicationData.partnerName}

Experience: ${applicationData.experience}

Reputation/References: ${applicationData.reputation || "N/A"}

Crypto Experience: ${applicationData.cryptoExperience}

Notes: ${applicationData.notes}

I request verification to become an Escrow Partner.`;
  };

  const handleCopyToClipboard = () => {
    const message = generateTelegramMessage();
    navigator.clipboard.writeText(message);
    toast.success("Message copied to clipboard!");
  };

  const handleOpenTelegram = () => {
    window.open("https://t.me/swaprmarketbot?start=become-escrow", "_blank");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent opacity-50 blur-[100px]" />
      </div>

      <main className="relative z-10 container mx-auto px-6 py-12 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 items-start">
          
          {/* Left Column: Sticky Header */}
          <div className="lg:sticky lg:top-32 self-start space-y-6">
            <Button 
              variant="ghost" 
              className="pl-0 hover:bg-transparent hover:text-zinc-300 text-zinc-500 transition-colors -ml-2"
              onClick={() => {
                if (step > 1) setStep(step - 1);
                else router.back();
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {step > 1 ? "Back" : "Back to Home"}
            </Button>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Become an Escrow Partner
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                {step === 1 && "Earn by securing transactions. Join our network of trusted professionals."}
                {step === 2 && "Fill out the form with your details to start the verification process."}
                {step === 3 && "Copy the generated message and send it to our Telegram bot to complete verification."}
              </p>
            </motion.div>
            
            {/* Steps Indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    step >= s ? "w-8 bg-white" : "w-2 bg-zinc-800"
                  )} 
                />
              ))}
            </div>
          </div>

          {/* Right Column: Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full space-y-8"
          >
            <Squircle 
              radius={32} 
              smoothing={1} 
              className="w-full drop-shadow-2xl"
              innerClassName="bg-[#1C1C1E] border border-white/10 overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 md:p-10 space-y-12"
                  >
                    
                    {/* Intro */}
                    <section className="space-y-4">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-inter">
                        <Scale className="text-white" /> Escrow Partnership
                      </h2>
                      <p className="text-zinc-400 leading-relaxed">
                        SwaprMarket allows experienced and trusted individuals to become Escrow Partners on the platform.
                        As an escrow partner, you help secure transactions between buyers and sellers by holding funds in escrow until the deal is completed.
                        In return, you earn a share of the escrow fee for every transaction you manage.
                      </p>
                    </section>

                    <div className="h-px w-full bg-white/5" />

                    {/* How it Works & Earnings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      <section className="space-y-4 h-full">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-inter">
                          <Zap className="text-white w-5 h-5" /> How it Works
                        </h3>
                        <p className="text-sm text-zinc-400">
                          When a deal is created, users can choose an approved escrow partner. The partner will:
                        </p>
                        <ul className="space-y-2 text-sm text-zinc-400">
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Hold funds during transaction
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Verify agreement fulfillment
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Release funds upon completion
                          </li>
                        </ul>
                      </section>

                      <section className="space-y-4 h-full">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-inter">
                          <DollarSign className="text-white w-5 h-5" /> Earnings Split
                        </h3>
                        <p className="text-sm text-zinc-400">
                          For each transaction, the fee is automatically split.
                        </p>
                        <div className="bg-[#1C1C1E] p-4 rounded-lg border border-white/5 space-y-2">
                           <div className="flex justify-between text-sm text-zinc-300">
                              <span>Escrow Fee</span>
                              <span className="font-bold text-white">4%</span>
                           </div>
                           <div className="h-px bg-white/10 w-full" />
                           <div className="flex justify-between text-xs text-zinc-400">
                              <span>Escrow Partner</span>
                              <span className="font-bold text-white">2%</span>
                           </div>
                           <div className="flex justify-between text-xs text-zinc-400">
                              <span>Platform</span>
                              <span className="font-bold text-white">2%</span>
                           </div>
                        </div>
                      </section>
                    </div>

                    <div className="h-px w-full bg-white/5" />

                    {/* Requirements & Security */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                       <section className="space-y-4 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-inter">
                          <ShieldCheck className="text-white w-5 h-5" /> Requirements
                        </h3>
                        <p className="text-sm text-zinc-400 font-medium">
                          Applicants should meet strict criteria:
                        </p>
                        <ul className="space-y-2 text-sm text-zinc-400 flex-1">
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Experience with crypto transactions
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Understand dispute handling
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Strong reputation in marketplaces
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Active and responsive
                          </li>
                        </ul>
                      </section>

                      <section className="space-y-4 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-inter">
                          <Award className="text-white w-5 h-5" /> Reputation System
                        </h3>
                        <p className="text-sm text-zinc-400 font-medium">
                           Escrow partners build reputation based on performance.
                        </p>
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <span className="text-zinc-300 font-semibold">Completed Deals</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <span className="text-zinc-300 font-bold">Dispute Resolution</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <span className="text-white font-extrabold">Community Feedback</span>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 mt-auto pt-2 font-medium">
                            Top performers earn the Trusted Escrow badge.
                        </p>
                      </section>
                    </div>

                    <div className="h-px w-full bg-white/5" />

                    {/* Benefits Section */}
                    <section className="space-y-6">
                      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                          <TrendingUp className="w-6 h-6 text-white" /> Escrow Partner Benefits
                        </h3>
                        <p className="text-zinc-300 mb-6 font-medium">
                          Join a global network and earn revenue by securing digital deals.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-[#1C1C1E] p-4 rounded-lg border border-white/5 flex flex-col h-full">
                            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-inter mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-white" /> Global Access
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed flex-1">
                              Access deals across many categories: digital services, accounts, subscriptions, software, and crypto assets.
                            </p>
                          </div>

                          <div className="bg-[#1C1C1E] p-4 rounded-lg border border-white/5 flex flex-col h-full">
                            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-inter mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-white" /> Trusted Status
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed flex-1">
                              Build your reputation as a trusted intermediary. Approved applicants gain access to the Escrow Dashboard to manage deals.
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="h-px w-full bg-white/5" />

                    {/* CTA */}
                    <section className="text-center space-y-8 pt-4">
                      <div className="bg-[#2C2C2E] rounded-2xl p-8 border border-white/5 max-w-lg mx-auto">
                        <h3 className="text-xl font-bold text-white mb-2">Apply to Become an Escrow Partner</h3>
                        <p className="text-zinc-400 mb-6 text-sm">
                            If you are experienced and want to participate in securing transactions, submit your application now.
                        </p>
                        
                        <Button 
                            onClick={() => setStep(2)}
                            className="w-full h-14 text-lg font-bold bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-white/5 rounded-xl"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 rotate-180" /> Apply Now
                        </Button>
                      </div>
                    </section>
                  </motion.div>
                )}

                {step === 2 && (
                   <motion.div 
                     key="step2"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="p-8 md:p-10 space-y-8"
                   >
                     <div className="text-center space-y-2 mb-8">
                       <h2 className="text-2xl font-bold text-white">Partner Information</h2>
                       <p className="text-zinc-400 text-sm">Fill in the details for your verification request.</p>
                     </div>

                     <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Partner Name / Alias</label>
                            <Input 
                              {...register("partnerName")}
                              placeholder="e.g. TrustedEscrow_01" 
                              className="bg-[#2C2C2E] border-white/10"
                            />
                            {errors.partnerName && <p className="text-red-400 text-xs">{errors.partnerName.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Experience</label>
                            <Input 
                              {...register("experience")}
                              placeholder="Describe your escrow experience..." 
                              className="bg-[#2C2C2E] border-white/10"
                            />
                            {errors.experience && <p className="text-red-400 text-xs">{errors.experience.message}</p>}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Reputation / References (Optional)</label>
                                <Input 
                                  {...register("reputation")}
                                  placeholder="Links to profiles, threads..." 
                                  className="bg-[#2C2C2E] border-white/10"
                                />
                             </div>

                             <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Crypto Experience</label>
                                <Input 
                                  {...register("cryptoExperience")}
                                  placeholder="Years, coins handled..." 
                                  className="bg-[#2C2C2E] border-white/10"
                                />
                                {errors.cryptoExperience && <p className="text-red-400 text-xs">{errors.cryptoExperience.message}</p>}
                             </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Additional Notes</label>
                            <textarea 
                              {...register("notes")}
                              rows={4}
                              placeholder="Any other relevant information..." 
                              className="flex w-full rounded-md border border-white/10 bg-[#2C2C2E] px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                            />
                            {errors.notes && <p className="text-red-400 text-xs">{errors.notes.message}</p>}
                          </div>
                        </div>

                        <div className="pt-4">
                           <Button 
                              type="submit"
                              className="w-full h-12 text-lg font-bold bg-white text-black hover:bg-zinc-200 rounded-xl"
                           >
                              Continue
                           </Button>
                        </div>
                     </form>
                   </motion.div>
                )}

                {step === 3 && (
                   <motion.div 
                     key="step3"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="p-8 md:p-10 space-y-8 text-center"
                   >
                     <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                        <TelegramIcon className="w-10 h-10 text-blue-400 ml-1" />
                     </div>
                     
                     <div className="space-y-4">
                       <h2 className="text-2xl font-bold text-white">Verify Information</h2>
                       <p className="text-zinc-400">
                         Copy the message below and send it to our Telegram bot to start verification.
                       </p>
                       <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 max-w-md mx-auto">
                          <p className="text-xs text-red-300 flex items-center justify-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Warning: You can apply only once every 30 days.
                          </p>
                       </div>
                     </div>

                     <div className="bg-[#0b0b0c] p-4 rounded-xl border border-white/10 text-left relative group">
                        <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-inter">
                           {generateTelegramMessage()}
                        </pre>
                        <Button 
                           size="sm" 
                           variant="ghost" 
                           onClick={handleCopyToClipboard}
                           className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white"
                        >
                           <Copy className="w-4 h-4" />
                        </Button>
                     </div>

                     <div className="pt-4 space-y-4">
                        <Button 
                           onClick={() => {
                             handleCopyToClipboard();
                             setTimeout(handleOpenTelegram, 1000);
                           }}
                           className="w-full h-14 text-lg font-bold bg-[#0088cc] text-white hover:bg-[#0077b5] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#0088cc]/20 rounded-xl"
                        >
                           <TelegramIcon className="w-5 h-5 mr-2" /> Copy & Go to Bot
                        </Button>
                        
                        <Button 
                           variant="ghost"
                           onClick={() => setStep(2)}
                           className="text-zinc-500 hover:text-white"
                        >
                           Edit Data
                        </Button>
                     </div>
                   </motion.div>
                )}
              </AnimatePresence>
            </Squircle>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

