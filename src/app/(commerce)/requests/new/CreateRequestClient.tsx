"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, AlertCircle, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/shared/ui/primitives/input";
import { Button } from "@/components/shared/ui/button";
import { Navbar } from "@/components/app/navigation/Navbar";
import { Card } from "@/components/shared/ui/primitives/card";
import { Container } from "@/components/shared/ui/primitives/container";
import { marketToast as toast } from "@/lib/domains/notifications";
import { cn } from "@/lib/core/utils/utils";
import { CRYPTO_CURRENCIES, useCrypto } from "@/contexts/CryptoContext";
import Image from "next/image";
import { SearchableSelect, Option } from "@/components/shared/ui/SearchableSelect";
import { CopyMap } from "@/lib/app/content/copy-system";

const CATEGORY_OPTIONS: Option[] = [
  { value: "accounts", label: "Accounts & Access", icon: "ðŸ”", subtitle: "Netflix, Spotify, VPNs, etc." },
  { value: "development", label: "Development", icon: "ðŸ’»", subtitle: "Websites, Scripts, Bots" },
  { value: "marketing", label: "Marketing & Social", icon: "ðŸ“¢", subtitle: "Followers, Likes, Ads" },
  { value: "crypto", label: "Crypto & DeFi", icon: "â‚¿", subtitle: "Tokens, NFTs, Wallet Recovery" },
  { value: "services", label: "Services", icon: "ðŸ› ï¸", subtitle: "Design, Writing, Consulting" },
  { value: "other", label: "Other", icon: "ðŸ“¦", subtitle: "Anything else" },
];

const CONDITION_OPTIONS: Option[] = [
  { value: "any", label: "Any Condition", icon: "âœ¨", subtitle: "New or Used is fine" },
  { value: "new", label: "New / Fresh", icon: "ðŸ”¥", subtitle: "Never used, sealed, fresh account" },
  { value: "aged", label: "Aged / History", icon: "â³", subtitle: "Account with history/reputation" },
];

const DELIVERY_OPTIONS: Option[] = [
  { value: "instant", label: "Instant / Auto", icon: "âš¡", subtitle: "Immediate delivery via bot" },
  { value: "24h", label: "Within 24 Hours", icon: "ðŸ•", subtitle: "Fast manual delivery" },
  { value: "3d", label: "Up to 3 Days", icon: "ðŸ“…", subtitle: "Standard processing time" },
  { value: "1w", label: "Up to 1 Week", icon: "ðŸ—“ï¸", subtitle: "Complex orders or services" },
  { value: "flexible", label: "Flexible", icon: "ðŸ¤", subtitle: "Negotiable timeframe" },
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

// Mock suggestions
const SUGGESTIONS = [
  "Netflix 4K Lifetime",
  "Spotify Premium Upgrade",
  "VPN 1 Year Key",
  "Telegram Premium Gift",
  "Discord Nitro 1 Month",
  "AWS $1000 Credit Account"
];

export function CreateRequestClient({ copy }: { copy: CopyMap }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { selectedCrypto, setSelectedCrypto } = useCrypto();
  
  const header = copy['header'] || {};
  const form = copy['form'] || {};
  
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
      paymentMethod: selectedCrypto,
      deliveryTime: "",
      description: "",
    },
    mode: "onChange",
  });

  // Keep form synced with context (Header -> Form)
  useEffect(() => {
    setValue("paymentMethod", selectedCrypto);
  }, [selectedCrypto, setValue]);

  const onSubmit = async (data: RequestFormValues) => {
    setLoading(true);
    try {
        const res = await fetch("/api/requests/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to create request");
        }

        const json = await res.json();
        toast.success("Request published successfully!");
        router.push(`/requests/${json.id}`);
    } catch (error: any) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  };

  const titleValue = watch("title");
  const filteredSuggestions = titleValue && titleValue.length > 2 
    ? SUGGESTIONS.filter(s => s.toLowerCase().includes(titleValue.toLowerCase()))
    : [];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans pb-20">
      <Navbar />
      
      <Container className="max-w-3xl py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
                className="rounded-full hover:bg-white/10"
            >
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
                <h1 className="text-3xl font-bold text-white">{header.title || "Create a Request"}</h1>
                <p className="text-zinc-400">{header.subtitle || "Tell us what you are looking for."}</p>
            </div>
          </div>

          <Card
            radius={24}
            smoothing={1}
            border="default"
            padding="lg"
            innerClassName="bg-[#1C1C1E] space-y-8"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Title */}
                <div className="space-y-2 relative">
                    <label className="text-sm font-bold text-zinc-300 ml-1">{form.title_label || "Title"}</label>
                    <Input 
                        {...register("title")}
                        placeholder="e.g. Netflix 4K Lifetime Account" 
                        className="bg-black/30 border-white/10 h-14 text-lg font-medium px-4 rounded-xl focus:border-white/30 transition-all"
                        autoComplete="off"
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {errors.title && <p className="text-red-400 text-xs ml-1">{errors.title.message}</p>}

                    {/* Suggestions */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-[#252528] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
                            {filteredSuggestions.map((s, i) => (
                                <div 
                                    key={i}
                                    className="px-4 py-3 hover:bg-white/5 cursor-pointer text-sm text-zinc-300 transition-colors"
                                    onMouseDown={() => setValue("title", s)}
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Category & Condition */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 ml-1">{form.category_label || "Category"}</label>
                        <SearchableSelect 
                            options={CATEGORY_OPTIONS}
                            value={watch("category")}
                            onChange={(val) => setValue("category", val, { shouldValidate: true })}
                            placeholder="Select Category"
                        />
                        {errors.category && <p className="text-red-400 text-xs ml-1">{errors.category.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 ml-1">{form.condition_label || "Condition"}</label>
                        <SearchableSelect 
                            options={CONDITION_OPTIONS}
                            value={watch("condition")}
                            onChange={(val) => setValue("condition", val, { shouldValidate: true })}
                            placeholder="Select Condition"
                        />
                        {errors.condition && <p className="text-red-400 text-xs ml-1">{errors.condition.message}</p>}
                    </div>
                </div>

                {/* Budget Range */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-300 ml-1">{form.budget_label || "Budget Range (USD)"}</label>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input 
                                type="number"
                                {...register("budgetMin", { valueAsNumber: true })}
                                placeholder="Min" 
                                className="bg-black/30 border-white/10 h-12 pl-9 rounded-xl"
                            />
                        </div>
                        <span className="text-zinc-500 font-bold">-</span>
                        <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input 
                                type="number"
                                {...register("budgetMax", { valueAsNumber: true })}
                                placeholder="Max" 
                                className="bg-black/30 border-white/10 h-12 pl-9 rounded-xl"
                            />
                        </div>
                    </div>
                    {errors.budgetMax && <p className="text-red-400 text-xs ml-1">{errors.budgetMax.message}</p>}
                </div>

                {/* Payment & Delivery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 ml-1">{form.payment_label || "Preferred Payment"}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {CRYPTO_CURRENCIES.map((c) => (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCrypto(c.code);
                                        setValue("paymentMethod", c.code, { shouldValidate: true });
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all",
                                        watch("paymentMethod") === c.code 
                                            ? "bg-white/10 border-white text-white" 
                                            : "bg-black/30 border-white/5 text-zinc-500 hover:bg-white/5"
                                    )}
                                >
                                    <c.Icon className="w-8 h-8" />
                                    <span className="text-xs font-bold">{c.code}</span>
                                </button>
                            ))}
                        </div>
                        {errors.paymentMethod && <p className="text-red-400 text-xs ml-1">{errors.paymentMethod.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 ml-1">{form.delivery_label || "Delivery Time"}</label>
                        <SearchableSelect 
                            options={DELIVERY_OPTIONS}
                            value={watch("deliveryTime")}
                            onChange={(val) => setValue("deliveryTime", val, { shouldValidate: true })}
                            placeholder="Select Timeframe"
                        />
                        {errors.deliveryTime && <p className="text-red-400 text-xs ml-1">{errors.deliveryTime.message}</p>}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-300 ml-1">{form.desc_label || "Description"}</label>
                    <textarea 
                        {...register("description")}
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 min-h-[150px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 resize-none transition-all"
                        placeholder="Provide more details about what you need. Be specific about features, region, or any other requirements."
                    />
                    {errors.description && <p className="text-red-400 text-xs ml-1">{errors.description.message}</p>}
                </div>

                {/* Submit */}
                <Button 
                    type="submit" 
                    className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-bold text-lg rounded-xl shadow-lg shadow-white/5 transition-all hover:scale-[1.01]"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (form.submit_button || "Post Request")}
                </Button>

            </form>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
}


