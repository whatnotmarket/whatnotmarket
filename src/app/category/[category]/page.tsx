"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Search, 
  Filter,
  TrendingUp,
  LayoutGrid,
  Gamepad2,
  User,
  Shield,
  Smartphone,
  Globe,
  Monitor,
  ChevronRight
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/primitives/container";
import { Section } from "@/components/ui/primitives/section";
import { Card } from "@/components/ui/primitives/card";

// Mock Data Generators
const generateItems = (category: string, count: number) => {
  const prefixes = ["Epic", "Legendary", "Rare", "Common", "Starter", "Pro", "Elite", "Master"];
  const suffixes = ["Bundle", "Pack", "Account", "Key", "Service", "Boost", "Coins", "Items"];
  
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    name: `${prefixes[i % prefixes.length]} ${category} ${suffixes[i % suffixes.length]}`,
    offers: 100 + (i * 27) % 500, // Deterministic offers
    trending: i < 4
  }));
};

const CATEGORY_CONFIG: Record<string, { label: string, icon: any, description: string }> = {
  accounts: { 
    label: "Accounts", 
    icon: User,
    description: "Premium accounts for gaming, streaming, and social media."
  },
  gaming: { 
    label: "Gaming", 
    icon: Gamepad2,
    description: "In-game items, currency, and boosting services."
  },
  telco: { 
    label: "Telco", 
    icon: Smartphone,
    description: "VoIP numbers, eSIMs, and mobile data plans."
  },
  software: { 
    label: "Software", 
    icon: Monitor,
    description: "Licenses, keys, and SaaS subscriptions."
  },
  skins: { 
    label: "Skins", 
    icon: Shield,
    description: "Exclusive skins and cosmetics for your favorite games."
  },
  crypto: { 
    label: "Crypto", 
    icon: Globe,
    description: "P2P exchange, wallet services, and more."
  }
};

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categorySlug = params.category as string;
  const config = CATEGORY_CONFIG[categorySlug] || { 
    label: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1), 
    icon: LayoutGrid,
    description: "Explore the best deals in this category."
  };

  const [searchQuery, setSearchQuery] = useState("");

  // Mock data based on category
  const trendingItems = generateItems(config.label, 4).map((item, i) => ({ 
    ...item, 
    name: `${config.label} ${['Prime', 'Gold', 'Elite', 'Pro'][i]} Edition`, 
    offers: 1000 + i * 500 
  }));
  const allItems = generateItems(config.label, 32);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent opacity-50 blur-[100px]" />
      </div>

      <main className="relative z-10 space-y-16 py-8">
        
        {/* Header & Search Section */}
        <Container>
          <div className="space-y-8">
          <Button 
            variant="ghost" 
            className="pl-0 hover:bg-transparent hover:text-zinc-300 text-zinc-500 transition-colors"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-900/50">
                <config.icon className="w-10 h-10 text-white" />
            </div>
            
            <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">{config.label}</h1>
                <p className="text-zinc-400 text-lg max-w-2xl mx-auto">{config.description}</p>
            </div>

            {/* Wide Search Bar */}
            <div className="w-full max-w-3xl relative group mt-8">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Search className="h-6 w-6 text-zinc-500 group-focus-within:text-white transition-colors" />
                </div>
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search brand in ${config.label}...`}
                    className="w-full h-16 pl-16 pr-32 bg-[#1C1C1E] border border-white/10 rounded-full text-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all shadow-xl"
                />
                <div className="absolute inset-y-0 right-2 flex items-center pr-2">
                    <div className="h-8 w-px bg-white/10 mx-4" />
                    <button className="text-sm font-bold text-zinc-400 hover:text-white transition-colors px-2">
                        All
                    </button>
                </div>
            </div>
          </div>
          </div>
        </Container>

        {/* Trending Section */}
        <Section spacing="none">
          <Container>
          <div className="space-y-8">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-bold text-white text-center">Trending</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/category/${categorySlug}/${item.name.toLowerCase().replace(/ /g, '-')}`} className="block h-full">
                <Card
                  as="div"
                  radius={20}
                  smoothing={1}
                  border="none"
                  className="w-full h-32 group relative overflow-hidden shadow-lg hover:shadow-blue-900/20 transition-all duration-300"
                  innerClassName="bg-[#1C1C1E] h-full flex items-center relative z-10"
                >
                  {/* Left Gradient Bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-blue-600/80 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="w-full px-6 py-4 flex flex-col items-start justify-center relative z-20">
                    <h3 className="font-bold text-lg text-white group-hover:scale-[1.02] transition-transform origin-left line-clamp-1 w-full text-left drop-shadow-md">
                        {item.name}
                    </h3>
                    <div className="mt-2 px-3 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm">
                        <p className="text-xs text-blue-200 font-bold">{item.offers.toLocaleString()} offers</p>
                    </div>
                  </div>
                </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          </div>
          </Container>
        </Section>

        {/* All Brands Grid */}
        <Section spacing="none" className="pt-8">
          <Container>
          <div className="space-y-8">
          <div className="text-center space-y-2">
             <h2 className="text-2xl font-bold text-white">All brands for {config.label}</h2>
             <div className="w-16 h-1 bg-white/10 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {allItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + (i * 0.01) }}
              >
                <Link href={`/category/${categorySlug}/${item.name.toLowerCase().replace(/ /g, '-')}`} className="block h-full">
                <Card
                  as="div"
                  radius={16}
                  smoothing={1}
                  border="default"
                  className="w-full group h-[100px]"
                  innerClassName="bg-[#1C1C1E] group-hover:bg-[#161618] transition-colors relative overflow-hidden group-hover:stroke-blue-500/30"
                >
                  {/* Subtle Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                      <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors text-center line-clamp-2 leading-tight">
                        {item.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-zinc-500 border border-white/5 group-hover:bg-blue-500/20 group-hover:text-blue-200 group-hover:border-blue-500/20 transition-all">
                          {item.offers} offers
                      </span>
                  </div>
                </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          </div>
          </Container>
        </Section>

        {/* Pagination */}
        <Container>
        <div className="flex justify-center pt-12 pb-20">
            <div className="flex items-center gap-2 bg-[#1C1C1E] p-2 rounded-2xl border border-white/5 shadow-xl">
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                {[1, 2, 3, 4, 5].map((page) => (
                    <Button 
                        key={page}
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                            "h-10 w-10 p-0 font-bold text-sm hover:bg-white/10 rounded-xl transition-all",
                            page === 1 ? "bg-white text-black hover:bg-zinc-200 shadow-lg" : "text-zinc-400"
                        )}
                    >
                        {page}
                    </Button>
                ))}
                <span className="text-zinc-600 text-sm px-2 font-bold">...</span>
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl font-bold">
                    53
                </Button>
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl">
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>
        </div>
        </Container>

      </main>
    </div>
  );
}
