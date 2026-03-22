"use client";

import { Navbar } from "@/components/app/navigation/Navbar";
import { Squircle } from "@/components/shared/ui/Squircle";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { cn } from "@/lib/core/utils/utils";
import { marketToast as toast } from "@/lib/domains/notifications";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence,motion } from "framer-motion";
import {
ArrowLeft,
Award,
CheckCircle2,
Copy,
DollarSign,
Eye,
Layers,
LayoutGrid,
Rocket,
Target,
TrendingUp,
Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Schema for Step 2
const applicationSchema = z.object({
  sellerName: z.string().min(3, "Seller name must be at least 3 characters"),
  listings: z.string().min(10, "Please list the items you want to promote"),
  duration: z.string().min(1, "Please select a duration"),
  notes: z.string().optional(),
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

export default function PromoteListingsPage() {
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
    const durationMap = {
      "1_month": "1 Month ($25)",
      "3_months": "3 Months ($70)",
      "6_months": "6 Months ($130)"
    };
    
    return `Sponsored Listings Request:

Seller Name: ${applicationData.sellerName}

Listings to Promote: ${applicationData.listings}

Duration: ${durationMap[applicationData.duration as keyof typeof durationMap]}

Notes: ${applicationData.notes || "None"}

I request to activate Sponsored Listings for my account.`;
  };

  const handleCopyToClipboard = () => {
    const message = generateTelegramMessage();
    navigator.clipboard.writeText(message);
    toast.success("Message copied to clipboard!");
  };

  const handleOpenTelegram = () => {
    window.open("https://t.me/openlymarketbot?start=promote-listings", "_blank");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-yellow-900/20 to-transparent opacity-50 blur-[100px]" />
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
                Sponsored Listings
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                {step === 1 && "Get More Visibility. Sell Faster. Upgrade your account to reach more buyers."}
                {step === 2 && "Configure your promotion plan and select listings to boost."}
                {step === 3 && "Complete the activation by sending your request to our bot."}
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
                        <Rocket className="text-white" /> Boost Your Sales
                      </h2>
                      <p className="text-zinc-400 leading-relaxed">
                        Sponsored Listings help your offers stand out and reach more buyers across the marketplace.
                        Promoted listings appear in high-visibility sections, including trending areas, category pages, and featured placements.
                        If you want to increase exposure and receive more offers, sponsoring your listings is the fastest way to do it.
                      </p>
                    </section>

                    <div className="h-px w-full bg-white/5" />

                    {/* How it Works & Pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      <section className="space-y-4 h-full">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-inter">
                          <Zap className="text-white w-5 h-5" /> How it Works
                        </h3>
                        <p className="text-sm text-zinc-400">
                          When you sponsor a listing, it is automatically promoted in key areas where buyers are most active.
                        </p>
                        <ul className="space-y-2 text-sm text-zinc-400">
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Featured positions in category pages
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Trending request sections
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Highlighted listing blocks
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Discovery areas across the platform
                          </li>
                        </ul>
                      </section>

                      <section className="space-y-4 h-full">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-inter">
                          <DollarSign className="text-white w-5 h-5" /> Simple Pricing
                        </h3>
                        <div className="bg-[#1C1C1E] p-6 rounded-lg border border-white/5 text-center space-y-4">
                           <div className="space-y-1">
                              <span className="text-3xl font-extrabold text-white">$25</span>
                              <span className="text-zinc-400 text-sm block">per month</span>
                           </div>
                           <div className="h-px bg-white/10 w-full" />
                           <ul className="text-left space-y-2 text-sm text-zinc-300">
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-white" /> Up to 4 sponsored listings
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-white" /> Priority placement
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-white" /> Increased visibility
                              </li>
                           </ul>
                        </div>
                      </section>
                    </div>

                    <div className="h-px w-full bg-white/5" />

                    {/* Why Promote & Target Audience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                       <section className="space-y-4 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-inter">
                          <TrendingUp className="text-white w-5 h-5" /> Why Promote?
                        </h3>
                        <p className="text-sm text-zinc-400 font-medium">
                          Sponsored listings can help you:
                        </p>
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <span className="text-zinc-300 font-semibold">Get more views</span>
                                <Eye className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <span className="text-zinc-300 font-semibold">Receive offers faster</span>
                                <Zap className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <span className="text-white font-bold">Stand out from competition</span>
                                <Award className="w-4 h-4 text-white" />
                            </div>
                        </div>
                      </section>

                      <section className="space-y-4 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-inter">
                          <Target className="text-white w-5 h-5" /> Who Should Use It?
                        </h3>
                        <p className="text-sm text-zinc-400 font-medium">
                           Ideal for sellers who want to:
                        </p>
                        <ul className="space-y-2 text-sm text-zinc-400 flex-1">
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Promote high-value listings
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Sell faster in competitive categories
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Launch new offers with more visibility
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Reach active buyers
                          </li>
                        </ul>
                      </section>
                    </div>

                    <div className="h-px w-full bg-white/5" />

                    {/* Example Exposure */}
                    <section className="space-y-6">
                      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                          <LayoutGrid className="w-6 h-6 text-white" /> Example Exposure
                        </h3>
                        <p className="text-zinc-300 mb-6 font-medium">
                          Sponsored listings appear in high-traffic areas for maximum exposure.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {["Trending Requests", "Featured Listings", "Category Highlights", "Recommended Offers"].map((area) => (
                            <div key={area} className="bg-[#1C1C1E] p-4 rounded-lg border border-white/5 text-center">
                                <Layers className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                                <span className="text-sm font-bold text-white">{area}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>

                    <div className="h-px w-full bg-white/5" />

                    {/* CTA */}
                    <section className="text-center space-y-8 pt-4">
                      <div className="bg-[#2C2C2E] rounded-2xl p-8 border border-white/5 max-w-lg mx-auto">
                        <h3 className="text-xl font-bold text-white mb-2">Activate Sponsored Listings</h3>
                        <p className="text-zinc-400 mb-6 text-sm">
                            Upgrade your visibility and reach more buyers today. Simple setup, fixed monthly cost.
                        </p>
                        
                        <Button 
                            onClick={() => setStep(2)}
                            className="w-full h-14 text-lg font-bold bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-white/5 rounded-xl"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 rotate-180" /> Start Promoting
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
                       <h2 className="text-2xl font-bold text-white">Configure Promotion</h2>
                       <p className="text-zinc-400 text-sm">Select your plan and listings to promote.</p>
                     </div>

                     <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Seller Name</label>
                            <Input 
                              {...register("sellerName")}
                              placeholder="Your username" 
                              className="bg-[#2C2C2E] border-white/10"
                            />
                            {errors.sellerName && <p className="text-red-400 text-xs">{errors.sellerName.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Listings to Promote</label>
                            <textarea 
                              {...register("listings")}
                              rows={3}
                              placeholder="List the titles or IDs of the items you want to sponsor..." 
                              className="flex w-full rounded-md border border-white/10 bg-[#2C2C2E] px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                            />
                            <p className="text-xs text-zinc-500">Up to 4 listings allowed.</p>
                            {errors.listings && <p className="text-red-400 text-xs">{errors.listings.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Select Duration</label>
                            <select 
                              {...register("duration")}
                              className="flex w-full rounded-md border border-white/10 bg-[#2C2C2E] px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                            >
                                <option value="1_month">1 Month ($25)</option>
                                <option value="3_months">3 Months ($70) - Save $5</option>
                                <option value="6_months">6 Months ($130) - Save $20</option>
                            </select>
                            {errors.duration && <p className="text-red-400 text-xs">{errors.duration.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Additional Notes (Optional)</label>
                            <textarea 
                              {...register("notes")}
                              rows={2}
                              placeholder="Any specific instructions..." 
                              className="flex w-full rounded-md border border-white/10 bg-[#2C2C2E] px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                            />
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
                       <h2 className="text-2xl font-bold text-white">Activate Promotion</h2>
                       <p className="text-zinc-400">
                         Copy the message below and send it to our Telegram bot to activate your sponsored listings.
                       </p>
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




