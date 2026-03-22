"use client";

import { Navbar } from "@/components/app/navigation/Navbar";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Squircle } from "@/components/shared/ui/Squircle";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/core/utils/utils";
import { motion } from "framer-motion";
import {
ArrowRight,
CheckCircle2,
Clock,
Filter,
MessageSquare,
Package,
Search,
ShoppingBag,
XCircle
} from "lucide-react";
import { useState } from "react";

// Mock Buyer Deals (Purchases)
const BUYER_DEALS = [
  {
    id: "ORD-7829-XJ",
    title: "Netflix 4K UHD Lifetime",
    image: "ðŸ¿",
    price: 15.00,
    status: "completed",
    date: "2 mins ago",
    counterparty: "CryptoKing_99",
    type: "buy"
  },
  {
    id: "ORD-9921-MC",
    title: "Spotify Premium Upgrade",
    image: "ðŸŽµ",
    price: 8.50,
    status: "processing",
    date: "1 hour ago",
    counterparty: "MusicMan",
    type: "buy"
  },
  {
    id: "ORD-3321-AZ",
    title: "NordVPN 2 Year Account",
    image: "ðŸ”’",
    price: 12.00,
    status: "cancelled",
    date: "1 week ago",
    counterparty: "SecureNet",
    type: "buy"
  }
];

// Mock Seller Deals (Sales)
const SELLER_DEALS = [
  {
    id: "ORD-1102-PP",
    title: "Custom Telegram Bot",
    image: "ðŸ¤–",
    price: 150.00,
    status: "active",
    date: "2 days ago",
    counterparty: "SilentBuyer_01",
    type: "sell"
  },
  {
    id: "ORD-5543-KL",
    title: "Instagram 10k Followers",
    image: "ðŸ“¸",
    price: 45.00,
    status: "completed",
    date: "5 hours ago",
    counterparty: "InfluencerWannabe",
    type: "sell"
  },
  {
    id: "ORD-8892-GH",
    title: "Python Web Scraper Script",
    image: "ðŸ",
    price: 80.00,
    status: "processing",
    date: "1 day ago",
    counterparty: "DataMiner_X",
    type: "sell"
  },
  {
    id: "ORD-2219-WQ",
    title: "Discord Server Setup",
    image: "ðŸŽ®",
    price: 25.00,
    status: "completed",
    date: "3 days ago",
    counterparty: "CommunityMgr",
    type: "sell"
  }
];

export default function MyDealsPage() {
  const { role } = useUser();
  const [filter, setFilter] = useState<"all" | "active" | "processing" | "completed" | "cancelled">("all");
  const [search, setSearch] = useState("");
  
  const isSeller = role === "seller";
  const deals = isSeller ? SELLER_DEALS : BUYER_DEALS;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "processing": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "active": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "cancelled": return "text-red-400 bg-red-400/10 border-red-400/20";
      default: return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "processing": return <Clock className="w-3.5 h-3.5 animate-pulse" />;
      case "active": return <ShoppingBag className="w-3.5 h-3.5" />;
      case "cancelled": return <XCircle className="w-3.5 h-3.5" />;
      default: return <Package className="w-3.5 h-3.5" />;
    }
  };

  const filteredDeals = deals.filter(deal => {
    const matchesFilter = filter === "all" || deal.status === filter;
    const matchesSearch = deal.title.toLowerCase().includes(search.toLowerCase()) || 
                          deal.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-zinc-800 selection:text-white pb-20">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-[1000px]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2">My Deals</h1>
            <p className="text-zinc-400 text-sm">{isSeller ? "Manage your sales securely." : "Manage your purchases securely."}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders..."
                className="w-full md:w-64 pl-9 h-10 bg-[#1C1C1E] border-white/10 focus:border-white/20 rounded-xl"
              />
            </div>
            <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-white/10 bg-[#1C1C1E] hover:bg-white/5">
              <Filter className="w-4 h-4 text-zinc-400" />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {["all", "active", "processing", "completed", "cancelled"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as "all" | "active" | "processing" | "completed" | "cancelled")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold border transition-all whitespace-nowrap",
                filter === tab 
                  ? "bg-white text-black border-white" 
                  : "bg-[#1C1C1E] text-zinc-400 border-white/5 hover:border-white/20 hover:text-white"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Deals List */}
        <div className="space-y-4">
          {filteredDeals.length > 0 ? (
            filteredDeals.map((deal, index) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Squircle 
                  radius={20} 
                  smoothing={1} 
                  className="w-full group cursor-pointer"
                  innerClassName="bg-[#1C1C1E] border border-white/5 hover:border-white/10 transition-colors p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    {/* Left: Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-[#2C2C2E] rounded-xl flex items-center justify-center text-3xl shrink-0 border border-white/5">
                        {deal.image}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1.5",
                            getStatusColor(deal.status)
                          )}>
                            {getStatusIcon(deal.status)}
                            {deal.status}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">{deal.id}</span>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-emerald-400 transition-colors">
                          {deal.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <span>{deal.date}</span>
                          <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                          <span>{isSeller ? `Buyer: ${deal.counterparty}` : `Seller: ${deal.counterparty}`}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Action */}
                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pl-[80px] md:pl-0">
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">${deal.price.toFixed(2)}</div>
                        <div className="text-xs text-zinc-500">USDC</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-[#2C2C2E] hover:bg-white/10 text-zinc-400 hover:text-white">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button className="h-10 rounded-xl font-bold bg-white text-black hover:bg-zinc-200">
                          Details <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>

                  </div>
                </Squircle>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-[#1C1C1E] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                <ShoppingBag className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">No deals found</h3>
              <p className="text-zinc-500">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}


