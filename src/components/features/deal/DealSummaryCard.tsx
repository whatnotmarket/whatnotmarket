"use client";

import { Squircle } from "@/components/shared/ui/Squircle";
import { cn } from "@/lib/core/utils/utils";
import { Calendar,ChevronDown,MapPin } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface DealSummaryCardProps {
  title: string;
  price: number;
  image: string;
  description: string;
  location?: string;
  postedDate?: string;
  category?: string;
  className?: string;
}

type Currency = "USDC" | "BTC" | "ETH";

export function DealSummaryCard({
  title,
  price,
  image,
  description,
  location,
  postedDate,
  category,
  className
}: DealSummaryCardProps) {
  const [currency, setCurrency] = useState<Currency>("USDC");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getDisplayPrice = () => {
    switch (currency) {
      case "BTC":
        return (price / 65000).toFixed(4);
      case "ETH":
        return (price / 3200).toFixed(3);
      default:
        return price.toLocaleString();
    }
  };

  const getSymbol = () => {
    switch (currency) {
      case "BTC":
        return "â‚¿";
      case "ETH":
        return "Îž";
      default:
        return "$";
    }
  };

  return (
    <Squircle
      radius={24}
      smoothing={0.8}
      className={cn("w-full shadow-lg", className)}
      innerClassName="bg-zinc-900/40 backdrop-blur-md border border-white/5 overflow-hidden"
    >
      <div className="relative h-64 w-full bg-zinc-800">
        <Image 
          src={image} 
          alt={title} 
          fill 
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                {category || "Item"}
            </span>
          </div>
          
          <div className="relative">
            <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-white bg-indigo-600/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-indigo-500/20 shrink-0 shadow-lg shadow-indigo-900/20 hover:bg-indigo-600 transition-colors"
            >
                <span className="font-bold font-sans text-lg flex items-center">
                    <span className="mr-0.5">{getSymbol()}</span>
                    {getDisplayPrice()}
                </span>
                <span className="text-xs font-medium opacity-80 border-l border-white/20 pl-2 ml-1 flex items-center gap-0.5">
                    {currency}
                    <ChevronDown className="h-3 w-3" />
                </span>
            </button>

            {isDropdownOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-32 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-10">
                    {(["USDC", "BTC", "ETH"] as Currency[]).map((c) => (
                        <button
                            key={c}
                            onClick={() => {
                                setCurrency(c);
                                setIsDropdownOpen(false);
                            }}
                            className={cn(
                                "w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center justify-between",
                                currency === c ? "text-indigo-400 font-medium" : "text-zinc-400"
                            )}
                        >
                            {c}
                            {currency === c && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                        </button>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div>
            <h2 className="text-2xl font-bold text-white leading-tight">{title}</h2>
            {location && (
                <div className="flex items-center gap-1.5 mt-2 text-zinc-400 text-sm">
                    <MapPin className="h-4 w-4 text-zinc-500" />
                    <span>{location}</span>
                </div>
            )}
        </div>

        <div className="h-px w-full bg-white/5" />

        <p className="text-zinc-400 text-sm leading-relaxed">
            {description}
        </p>

        {postedDate && (
            <div className="flex items-center gap-2 text-xs text-zinc-600 pt-2">
                <Calendar className="h-3 w-3" />
                <span>Posted {postedDate}</span>
            </div>
        )}
      </div>
    </Squircle>
  );
}


