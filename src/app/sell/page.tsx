"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, DollarSign, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { marketToast as toast } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { CRYPTO_CURRENCIES } from "@/contexts/CryptoContext";
import Image from "next/image";
import { SearchableSelect, Option } from "@/components/ui/SearchableSelect";
import { analytics } from "@/lib/analytics";

const CATEGORY_OPTIONS: Option[] = [
  { value: "accounts", label: "Accounts & Access", icon: "🔐", subtitle: "Netflix, Spotify, VPNs, etc." },
  { value: "development", label: "Development", icon: "💻", subtitle: "Websites, Scripts, Bots" },
  { value: "marketing", label: "Marketing & Social", icon: "📢", subtitle: "Followers, Likes, Ads" },
  { value: "crypto", label: "Crypto & DeFi", icon: "₿", subtitle: "Tokens, NFTs, Wallet Recovery" },
  { value: "services", label: "Services", icon: "🛠️", subtitle: "Design, Writing, Consulting" },
  { value: "other", label: "Other", icon: "📦", subtitle: "Anything else" },
];

const CONDITION_OPTIONS: Option[] = [
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

const sellSchema = z.object({
  title: z.string().min(5, "Title is too short (min 5 chars)"),
  category: z.string().min(1, "Please select a category"),
  condition: z.string().min(1, "Please select a condition"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  paymentMethods: z.array(z.string()).min(1, "Select at least one crypto"),
  deliveryTime: z.string().min(1, "Please select a delivery time"),
  description: z.string().min(10, "Please add more details (min 10 chars)"),
});

type SellFormValues = z.infer<typeof sellSchema>;

// Mock suggestions for selling
const SELL_SUGGESTIONS = [
  "Netflix Premium 4K Account",
  "Spotify Premium Lifetime",
  "NordVPN 2 Year Account",
  "Telegram Premium Gift Link",
  "Discord Nitro Monthly",
  "AWS $1k Credit Account",
  "Python Script Development",
  "Logo Design Service"
];

export default function SellPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  useEffect(() => {
    analytics.track("sell_page_viewed");
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<SellFormValues>({
    resolver: zodResolver(sellSchema),
    defaultValues: {
      title: "",
      category: "",
      condition: "",
      price: 0,
      paymentMethods: [],
      deliveryTime: "",
      description: "",
    },
    mode: "onChange",
  });

  const titleValue = watch("title");
  const filteredSuggestions = titleValue && titleValue.length > 2 
    ? SELL_SUGGESTIONS.filter(s => s.toLowerCase().includes(titleValue.toLowerCase()))
    : [];

  // Toggle crypto selection
  const handleCryptoToggle = (cryptoCode: string) => {
    const currentMethods = watch("paymentMethods") || [];
    if (currentMethods.includes(cryptoCode)) {
      setValue("paymentMethods", currentMethods.filter(c => c !== cryptoCode), { shouldValidate: true });
    } else {
      setValue("paymentMethods", [...currentMethods, cryptoCode], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: SellFormValues) => {
    setLoading(true);
    analytics.track("listing_submitted", {
      category: data.category,
      condition: data.condition,
      price: data.price,
      deliveryTime: data.deliveryTime,
      paymentMethods: data.paymentMethods.join(","),
    });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Sell Form Data:", data);
    toast.success("Product listed successfully!");
    router.push("/market");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-emerald-900/10 to-transparent opacity-50 blur-[100px]" />
      </div>

      <main className="relative z-10 container mx-auto px-6 py-12 max-w-[1200px]">
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
                Sell Something
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                List your digital product or service. Reach thousands of buyers instantly.
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
          <Squircle 
            radius={32} 
            smoothing={1} 
            className="w-full drop-shadow-2xl"
            innerClassName="bg-[#1C1C1E] border border-white/10 overflow-hidden"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
              
              {/* Form Content */}
              <div className="p-8 md:p-10 space-y-10">
                
                {/* SECTION: BASICS */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 font-sans">
                    Basics
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2 relative">
                      <label className="text-sm font-medium text-zinc-300">What are you selling?</label>
                      <div className="relative group">
                        <Input 
                          {...register("title")}
                          placeholder="e.g. Netflix 4K Lifetime Account, Custom Bot..." 
                          className="h-14 text-lg px-4 bg-[#2C2C2E] border-white/5 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all placeholder:text-zinc-500 rounded-xl"
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          autoComplete="off"
                        />
                        
                        {/* Suggestions Dropdown */}
                        {showSuggestions && filteredSuggestions.length > 0 && (
                           <div className="absolute top-full left-0 right-0 mt-2 bg-[#2C2C2E] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                             <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider bg-[#252527]">
                               Similar products
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
                          onChange={(val) => setValue("category", val, { shouldValidate: true })}
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
                          onChange={(val) => setValue("condition", val, { shouldValidate: true })}
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

                {/* SECTION: PRICING & DELIVERY */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 font-sans">
                    Pricing & Delivery
                  </div>
                  
                  {/* Price Input */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#2C2C2E] p-4 rounded-2xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">Selling Price</span>
                      <span className="text-xs text-zinc-500">Set your price in USD</span>
                    </div>
                    
                    <div className="relative w-full md:w-48">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none font-sans font-medium">
                        $
                      </div>
                        <input 
                          type="number"
                          step="0.01"
                          {...register("price", { valueAsNumber: true })}
                          placeholder="0.00"
                          className="w-full h-10 pl-8 pr-3 rounded-lg bg-[#1C1C1E] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors text-right"
                        />
                    </div>
                  </div>
                   {errors.price && (
                      <p className="text-xs text-red-400 pl-1">{errors.price.message}</p>
                    )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <SearchableSelect
                        label="Accepted Crypto"
                        options={CRYPTO_CURRENCIES.map(c => ({
                          value: c.code,
                          label: c.name,
                          subtitle: c.code,
                          icon: <div className="w-5 h-5 flex items-center justify-center"><Image src={c.Icon} alt={c.code} width={20} height={20} /></div>
                        }))}
                        value={watch("paymentMethods")}
                        onChange={(val) => setValue("paymentMethods", val, { shouldValidate: true })}
                        placeholder="Select crypto..."
                        searchPlaceholder="Search crypto..."
                        multiple={true}
                      />
                      {errors.paymentMethods && (
                        <p className="text-xs text-red-400 mt-1.5 pl-1">{errors.paymentMethods.message}</p>
                      )}
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
                    <label className="text-sm font-medium text-zinc-300">Description</label>
                    <textarea 
                      {...register("description")}
                      className="w-full min-h-[160px] rounded-xl border border-white/5 bg-[#2C2C2E] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all resize-y"
                      placeholder="Describe your product in detail. Include features, warranty, and instructions..."
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
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.02] shadow-lg shadow-emerald-500/20" 
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  )}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "List Item"}
                </Button>
              </div>

            </form>
          </Squircle>
        </motion.div>
        
        </div>
      </main>
    </div>
  );
}

