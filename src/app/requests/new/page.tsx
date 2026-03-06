"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, DollarSign, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/primitives/card";
import { Container } from "@/components/ui/primitives/container";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CRYPTO_CURRENCIES, useCrypto } from "@/contexts/CryptoContext";
import Image from "next/image";
import { SearchableSelect, Option } from "@/components/ui/SearchableSelect";

const CATEGORY_OPTIONS: Option[] = [
  { value: "accounts", label: "Accounts & Access", icon: "🔐", subtitle: "Netflix, Spotify, VPNs, etc." },
  { value: "development", label: "Development", icon: "💻", subtitle: "Websites, Scripts, Bots" },
  { value: "marketing", label: "Marketing & Social", icon: "📢", subtitle: "Followers, Likes, Ads" },
  { value: "crypto", label: "Crypto & DeFi", icon: "₿", subtitle: "Tokens, NFTs, Wallet Recovery" },
  { value: "services", label: "Services", icon: "🛠️", subtitle: "Design, Writing, Consulting" },
  { value: "other", label: "Other", icon: "📦", subtitle: "Anything else" },
];

const CONDITION_OPTIONS: Option[] = [
  { value: "any", label: "Any Condition", icon: "✨", subtitle: "New or Used is fine" },
  { value: "new", label: "New / Fresh", icon: "🔥", subtitle: "Never used, sealed, fresh account" },
  { value: "aged", label: "Aged / History", icon: "⏳", subtitle: "Account with history/reputation" },
];

const DELIVERY_OPTIONS: Option[] = [
  { value: "instant", label: "Instant / Auto", icon: "⚡", subtitle: "Immediate delivery via bot" },
  { value: "24h", label: "Within 24 Hours", icon: "🕐", subtitle: "Fast manual delivery" },
  { value: "3d", label: "Up to 3 Days", icon: "📅", subtitle: "Standard processing time" },
  { value: "1w", label: "Up to 1 Week", icon: "🗓️", subtitle: "Complex orders or services" },
  { value: "flexible", label: "Flexible", icon: "🤝", subtitle: "Negotiable timeframe" },
];

export const requestSchema = z.object({
  title: z.string().min(5, "Title is too short (min 5 chars)"),
  category: z.string().min(1, "Please select a category"),
  condition: z.string().min(1, "Please select a condition"),
  budgetMin: z.number().min(0, "Invalid amount"),
  budgetMax: z.number().min(0, "Invalid amount"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  deliveryTime: z.string().min(1, "Please select a delivery time"),
  description: z.string().min(10, "Please add more details (min 10 chars)"),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: "Max budget cannot be lower than min",
  path: ["budgetMax"],
});

export type RequestFormValues = z.infer<typeof requestSchema>;

// Mock suggestions (in a real app, these would come from an API based on existing listings)
const SUGGESTIONS = [
  "Netflix 4K Lifetime",
  "Spotify Premium Upgrade",
  "VPN 1 Year Key",
  "Telegram Premium Gift",
  "Discord Nitro 1 Month",
  "AWS $1000 Credit Account"
];

export default function CreateRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { selectedCrypto, setSelectedCrypto } = useCrypto();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isValid },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: "",
      category: "",
      condition: "",
      budgetMin: 0,
      budgetMax: 0,
      paymentMethod: selectedCrypto, // Initialize with context value
      deliveryTime: "",
      description: "",
    },
    mode: "onChange",
  });

  // Keep form synced with context (Header -> Form)
  useEffect(() => {
    setValue("paymentMethod", selectedCrypto);
  }, [selectedCrypto, setValue]);

  const handlePaymentMethodChange = (val: string) => {
    setValue("paymentMethod", val, { shouldValidate: true });
    setSelectedCrypto(val); // Sync Form -> Header
  };

  const titleValue = watch("title");
  const filteredSuggestions = titleValue && titleValue.length > 2 
    ? SUGGESTIONS.filter(s => s.toLowerCase().includes(titleValue.toLowerCase()))
    : [];

  useEffect(() => {
    const PRICE_RANGES: Record<string, { min: number; max: number; category: string }> = {
      "netflix": { min: 10, max: 40, category: "accounts" },
      "spotify": { min: 5, max: 20, category: "accounts" },
      "vpn": { min: 20, max: 80, category: "accounts" },
      "telegram": { min: 15, max: 50, category: "marketing" },
      "discord": { min: 5, max: 30, category: "accounts" },
      "aws": { min: 100, max: 1000, category: "development" }
    };

    const match = titleValue && Object.keys(PRICE_RANGES).find(key => titleValue.toLowerCase().includes(key));

    if (match) {
      const suggestion = PRICE_RANGES[match];
      
      // Update values only if they haven't been set yet (or are still 0)
      // This prevents overwriting user's manual changes
      const currentMin = getValues("budgetMin");
      const currentMax = getValues("budgetMax");

      if (currentMin === 0 && currentMax === 0) {
        setValue("budgetMin", suggestion.min);
        setValue("budgetMax", suggestion.max);
        setValue("category", suggestion.category, { shouldValidate: true });
      }
    }
  }, [titleValue, setValue, getValues]);

  const onSubmit = async (data: RequestFormValues) => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log("Form Data:", data);
    toast.success("Request posted successfully!");
    router.push("/market");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-zinc-900/20 to-transparent opacity-50 blur-[100px]" />
      </div>

      <Container className="relative z-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 items-start">
          
          {/* Left Column: Sticky Header */}
          <div className="lg:sticky lg:top-32 self-start space-y-6">
            <Button 
              variant="ghost" 
              className="pl-0 hover:bg-transparent hover:text-zinc-300 text-zinc-500 transition-colors -ml-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight whitespace-nowrap">
                Create a Request
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                Tell sellers what you're looking for. We'll help you find the best match.
              </p>
            </motion.div>
          </div>

          {/* Right Column: Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full"
          >
          <Card 
            radius={32} 
            smoothing={1} 
            className="w-full drop-shadow-2xl"
            innerClassName="bg-[#1C1C1E] overflow-hidden"
            border="default"
            padding="none"
          >
            <form onSubmit={handleSubmit(async (data: RequestFormValues) => await onSubmit(data))} className="flex flex-col">
              
              {/* Form Content */}
              <div className="p-8 md:p-10 space-y-10">
                
                {/* SECTION: BASICS */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 font-sans">
                    Basics
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2 relative">
                      <label className="text-sm font-medium text-zinc-300">What are you looking for?</label>
                      <div className="relative group">
                        <Input 
                          {...register("title")}
                          placeholder="e.g. Telegram Username, Netflix 4K, VoIP Number..." 
                          className="h-14 text-lg px-4 bg-[#2C2C2E] border-white/5 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all placeholder:text-zinc-500 rounded-xl"
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          autoComplete="off"
                        />
                        
                        {/* Suggestions Dropdown */}
                        {showSuggestions && filteredSuggestions.length > 0 && (
                           <div className="absolute top-full left-0 right-0 mt-2 bg-[#2C2C2E] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                             <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider bg-[#252527]">
                               Similar listings found
                             </div>
                             {filteredSuggestions.map((suggestion, index) => (
                               <button
                                 key={index}
                                 type="button"
                                 onClick={() => {
                                   setValue("title", suggestion);
                                   setShowSuggestions(false);
                                 }}
                                 className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between group"
                               >
                                 <span>{suggestion}</span>
                                 <span className="text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                   View Listing
                                 </span>
                               </button>
                             ))}
                           </div>
                        )}
                      </div>
                      {errors.title && (
                        <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5 pl-1">
                          <AlertCircle className="w-3 h-3" /> {errors.title.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <SearchableSelect
                          label="Category"
                          options={CATEGORY_OPTIONS}
                          value={watch("category")}
                          onChange={(val) => setValue("category", val as any, { shouldValidate: true })}
                          placeholder="Select category..."
                          searchPlaceholder="Search categories..."
                        />
                        {errors.category && (
                          <p className="text-xs text-red-400 mt-1.5 pl-1">{errors.category.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <SearchableSelect
                          label="Condition"
                          options={CONDITION_OPTIONS}
                          value={watch("condition")}
                          onChange={(val) => setValue("condition", val as any, { shouldValidate: true })}
                          placeholder="Select conditions..."
                          searchPlaceholder="Search condition..."
                        />
                        {errors.condition && (
                          <p className="text-xs text-red-400 mt-1.5 pl-1">{errors.condition.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-white/5" />

                {/* SECTION: BUDGET & PAYMENT */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 font-sans">
                    Budget & Payment
                  </div>
                  
                  {/* Budget Range */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#2C2C2E] p-4 rounded-2xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">Price Range</span>
                      <span className="text-xs text-zinc-500">Estimated budget in USD</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="relative w-full md:w-32">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none font-sans font-medium">
                          $
                        </div>
                        <input 
                          type="number"
                          {...register("budgetMin", { valueAsNumber: true })}
                          placeholder="Min"
                          className="w-full h-10 pl-8 pr-3 rounded-lg bg-[#1C1C1E] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors text-right"
                        />
                      </div>
                      <span className="text-zinc-600 font-medium">-</span>
                      <div className="relative w-full md:w-32">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none font-sans font-medium">
                          $
                        </div>
                        <input 
                          type="number"
                          {...register("budgetMax", { valueAsNumber: true })}
                          placeholder="Max"
                          className="w-full h-10 pl-8 pr-3 rounded-lg bg-[#1C1C1E] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment & Delivery Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <SearchableSelect
                          label="Payment Currency"
                          options={CRYPTO_CURRENCIES.map(c => ({
                            value: c.code,
                            label: c.name,
                            subtitle: c.code,
                            icon: <div className="w-5 h-5 flex items-center justify-center"><Image src={c.Icon} alt={c.code} width={20} height={20} /></div>
                          }))}
                          value={watch("paymentMethod")}
                          onChange={(val) => setValue("paymentMethod", val, { shouldValidate: true })}
                          placeholder="Select currency..."
                          searchPlaceholder="Search crypto..."
                        />
                    </div>

                    <div className="space-y-2">
                        <SearchableSelect
                          label="Delivery Timeframe"
                          options={DELIVERY_OPTIONS}
                          value={watch("deliveryTime")}
                          onChange={(val) => setValue("deliveryTime", val, { shouldValidate: true })}
                          placeholder="Select deliverability..."
                          searchPlaceholder="Search time..."
                        />
                        {errors.deliveryTime && (
                          <p className="text-xs text-red-400 mt-1.5 pl-1">{errors.deliveryTime.message}</p>
                        )}
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-white/5" />

                {/* SECTION: DETAILS */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 font-sans">
                    Details
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Additional Notes</label>
                    <textarea 
                      {...register("description")}
                      className="w-full min-h-[160px] rounded-xl border border-white/5 bg-[#2C2C2E] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all resize-y"
                      placeholder="Describe exactly what you need. Include specific requirements..."
                    />
                     {errors.description && (
                      <p className="text-xs text-red-400 mt-1.5 pl-1">{errors.description.message}</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-20 bg-[#1C1C1E]/95 backdrop-blur-md border-t border-white/5 p-6 md:px-10 flex items-center justify-between">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => router.back()}
                  className="text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={loading || !isValid} 
                  className={cn(
                    "min-w-[160px] h-12 rounded-xl font-bold text-base transition-all",
                    isValid 
                      ? "bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] shadow-lg shadow-white/10" 
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  )}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Post Request"}
                </Button>
              </div>

            </form>
          </Card>
        </motion.div>
        
        </div>
      </Container>
    </div>
  );
}
