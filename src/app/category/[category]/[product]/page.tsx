"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Search, 
  Share2, 
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/primitives/container";
import { Card } from "@/components/ui/primitives/card";
import { Input } from "@/components/ui/primitives/input";
import { ListingWalletPayment } from "@/components/listing/ListingWalletPayment";

// Mock Offers Data
const OFFERS = Array.from({ length: 8 }).map((_, i) => ({
  id: `offer-${i}`,
  title: i % 2 === 0 ? "[INSTANT] Full Access + Email | High Quality" : "Level 50+ | Rare Skins | Verified Seller",
  price: (10 + (i * 7) % 90).toFixed(2), // Deterministic price
  seller: {
    name: `Seller_${100 + (i * 13) % 900}`, // Deterministic seller name
    rating: (4 + (i % 10) / 10).toFixed(1), // Deterministic rating
    level: 10 + (i * 5) % 90, // Deterministic level
    online: i % 2 === 0 // Deterministic online status
  },
  deliveryTime: "Instant",
  stock: 1 + (i * 3) % 50, // Deterministic stock
  badges: i % 3 === 0 ? ["Insurance"] : [],
  targetWalletAddress: `0x${(i + 1).toString(16).padStart(40, "0")}`,
}));

export default function ProductListingPage() {
  const router = useRouter();
  const params = useParams();
  const categorySlug = params.category as string;
  const productSlug = decodeURIComponent(params.product as string);
  const productName = productSlug.replace(/-/g, " ");

  const [activeSort, setActiveSort] = useState("Recommended");

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent opacity-50 blur-[100px]" />
      </div>

      <main className="relative z-10 py-8 space-y-12">
        
        {/* Breadcrumb & Header */}
        <Container>
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="hover:text-white cursor-pointer" onClick={() => router.push('/market')}>Home</span>
            <span>&gt;</span>
            <span className="hover:text-white cursor-pointer capitalize" onClick={() => router.push(`/category/${categorySlug}`)}>{categorySlug}</span>
            <span>&gt;</span>
            <span className="text-white font-medium capitalize">{productName}</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <span className="text-2xl font-bold text-white">{productName.charAt(0)}</span>
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white capitalize">{productName}</h1>
                    <p className="text-zinc-400 text-sm">
                        {categorySlug === 'accounts' ? 'Accounts' : 'Items'} ({OFFERS.length} offers)
                    </p>
                </div>
            </div>
            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-zinc-300 gap-2">
                <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
        </section>
        </Container>

        {/* Search & Filter Bar */}
        <section className="sticky top-20 z-30 bg-black/80 backdrop-blur-md py-4 border-b border-white/5">
            <Container>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                    <Input 
                        type="text" 
                        placeholder="Type to filter..." 
                        className="pl-12"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <select className="h-12 px-4 bg-[#1C1C1E] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 min-w-[140px]">
                        <option>Platform: All</option>
                        <option>PC</option>
                        <option>PlayStation</option>
                        <option>Xbox</option>
                    </select>
                    <select className="h-12 px-4 bg-[#1C1C1E] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 min-w-[140px]">
                        <option>Server: All</option>
                        <option>Global</option>
                        <option>NA</option>
                        <option>EU</option>
                    </select>
                </div>
            </div>
            </Container>
        </section>

        {/* Sorting */}
        <Container>
        <section className="flex flex-wrap items-center gap-4 text-sm mb-6">
            <span className="text-zinc-500">Sort by:</span>
            {["Recommended", "Lowest Price", "Highest Price", "Newest"].map((sort) => (
                <button
                    key={sort}
                    onClick={() => setActiveSort(sort)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
                        activeSort === sort 
                            ? "bg-white text-black border-white font-bold" 
                            : "bg-transparent text-zinc-400 border-white/10 hover:border-white/30"
                    )}
                >
                    {activeSort === sort && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                    {sort}
                </button>
            ))}
        </section>

        {/* Offers Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {OFFERS.map((offer) => (
                <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <Card
                        radius={16}
                        smoothing={1}
                        border="default"
                        className="h-full min-h-[280px]"
                        innerClassName="bg-[#1C1C1E] p-4 flex flex-col justify-between h-full group hover:bg-[#222224] transition-colors hover:stroke-white/20"
                    >
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-white font-bold text-sm line-clamp-2 leading-relaxed">
                                    {offer.title}
                                </h3>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] text-zinc-400">
                                    Min. 1
                                </span>
                                <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] text-zinc-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {offer.deliveryTime}
                                </span>
                                {offer.badges.includes("Insurance") && (
                                    <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[10px] text-green-400 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Insured
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 space-y-4 border-t border-white/5 pt-4">
                            <div className="flex items-end justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <div className="w-8 h-8 bg-zinc-800 rounded-full overflow-hidden border border-white/10">
                                            {/* Avatar placeholder */}
                                            <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-600" />
                                        </div>
                                        {offer.seller.online && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1C1C1E]" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white flex items-center gap-1">
                                            {offer.seller.name}
                                            <span className="text-[10px] text-yellow-500">★ {offer.seller.rating}</span>
                                        </span>
                                        <span className="text-[10px] text-zinc-500">Level {offer.seller.level}</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-lg font-bold text-white">${offer.price}</div>
                                    <div className="text-[10px] text-zinc-500">per unit</div>
                                </div>
                            </div>

                            <ListingWalletPayment
                              listingId={`${categorySlug}/${productSlug}/${offer.id}`}
                              amount={Number(offer.price)}
                              currency="ETH"
                              chain="eip155:1"
                              targetWalletAddress={offer.targetWalletAddress}
                            />
                        </div>
                    </Card>
                </motion.div>
            ))}
        </section>

        {/* Info Section */}
        <section className="space-y-8 pt-8 border-t border-white/5 mt-8">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white capitalize">{productName} For Sale</h2>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-4xl">
                    Buy {productName} {categorySlug} securely on SwaprMarket. 
                    All transactions are protected by our Escrow system. 
                    Sellers are verified and funds are only released when you confirm delivery.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5 space-y-3">
                    <ShieldCheck className="w-8 h-8 text-white" />
                    <h3 className="font-bold text-white">Buyer Protection</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Funds are held in escrow until the order is complete. 100% money-back guarantee if not delivered.
                    </p>
                </div>
                <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5 space-y-3">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                    <h3 className="font-bold text-white">Verified Sellers</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        All sellers undergo identity verification and performance checks to ensure quality.
                    </p>
                </div>
                <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5 space-y-3">
                    <AlertCircle className="w-8 h-8 text-white" />
                    <h3 className="font-bold text-white">24/7 Support</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Our support team is always ready to help you with any issues via Telegram or Live Chat.
                    </p>
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-6 pt-8">
            <h2 className="text-2xl font-bold text-white">FAQ</h2>
            <div className="space-y-4">
                <div className="space-y-2">
                    <h4 className="font-bold text-white text-sm">How do I receive the account?</h4>
                    <p className="text-xs text-zinc-400">After payment, a chat room will open with the seller where they will provide the credentials securely.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold text-white text-sm">Is it safe?</h4>
                    <p className="text-xs text-zinc-400">Yes, the seller does not receive payment until you verify the account works as described.</p>
                </div>
            </div>
        </section>
        </Container>

      </main>
    </div>
  );
}

