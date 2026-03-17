"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/primitives/container";
import { createClient } from "@/lib/supabase";
import { Squircle } from "@/components/ui/Squircle";
import { Ghost } from "lucide-react";

interface Seller {
  id: string;
  name: string;
  avatar: string;
  status?: "online" | "offline";
  platform?: string; // Icon identifier
}

function toSellerProfileHref(name: string) {
  const handle = name?.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "") || "seller";
  return `/seller/@${encodeURIComponent(handle)}`;
}

function SellerRow({ title, sellers }: { title: string; sellers: Seller[] }) {
  if (sellers.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
        {sellers.map((seller) => (
          <Link href={toSellerProfileHref(seller.name)} key={seller.id} className="group flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-zinc-800 border-2 border-transparent group-hover:border-white/20 transition-all relative">
                <Image 
                  src={seller.avatar || "/images/ico/faviconbianco.ico"} 
                  alt={seller.name || "Seller"} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              
              {/* Online Status Indicator - Hidden for now as we don't track real-time status yet */}
              {/* {seller.status === "online" && (
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-black rounded-full" />
              )} */}
            </div>
            
            <div className="text-center space-y-1">
              <span className="block text-sm font-bold text-white group-hover:text-zinc-200 transition-colors">
                {seller.name || "Unknown Seller"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TopSellersSection() {
  const [topSellersWeek, setTopSellersWeek] = useState<Seller[]>([]);
  const [topSellersMonth, setTopSellersMonth] = useState<Seller[]>([]);
  const [topEscrowMonth, setTopEscrowMonth] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      const supabase = createClient();

      try {
        // Fetch Top Sellers Week
        const { data: weekData } = await supabase.rpc("get_top_sellers", {
          time_range: "week",
          limit_count: 6,
        });

        if (weekData) {
          setTopSellersWeek(
            weekData.map((d: any) => ({
              id: d.user_id,
              name: d.username,
              avatar: d.avatar_url,
              status: "offline",
            }))
          );
        }

        // Fetch Top Sellers Month
        const { data: monthData } = await supabase.rpc("get_top_sellers", {
          time_range: "month",
          limit_count: 6,
        });

        if (monthData) {
          setTopSellersMonth(
            monthData.map((d: any) => ({
              id: d.user_id,
              name: d.username,
              avatar: d.avatar_url,
              status: "offline",
            }))
          );
        }

        // Fetch Top Escrow Month
        const { data: escrowData } = await supabase.rpc("get_top_escrow", {
          time_range: "month",
          limit_count: 6,
        });

        if (escrowData) {
          setTopEscrowMonth(
            escrowData.map((d: any) => ({
              id: d.user_id,
              name: d.username,
              avatar: d.avatar_url,
              status: "offline",
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch leaderboards:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboards();
  }, []);

  if (isLoading) {
    return (
      <section className="py-20 bg-black">
        <Container>
          <div className="space-y-12">
            <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-3xl bg-zinc-800 animate-pulse" />
                  <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  // If no data at all, hide section or show empty state? 
  // For now we show what we have. If empty, the row component handles it (returns null).
  if (topSellersWeek.length === 0 && topSellersMonth.length === 0 && topEscrowMonth.length === 0) {
    return (
      <section className="py-20 bg-black relative overflow-hidden">
        <Container>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-zinc-900/50 p-6 rounded-3xl mb-4 border border-zinc-800/50">
              <Ghost className="w-12 h-12 text-zinc-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-white">No sellers found</h3>
            {/* <p className="text-zinc-500 mt-2">Check back later for top sellers.</p> */}
          </div>
        </Container>
      </section>
    ); 
  }

  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_40%)]" />
      
      <Container className="relative z-10">
        <div className="space-y-16">
          <SellerRow title="Best Sellers of the Week" sellers={topSellersWeek} />
          <SellerRow title="Best Sellers of the Month" sellers={topSellersMonth} />
          <SellerRow title="Best Escrow of the Month" sellers={topEscrowMonth} />
        </div>
      </Container>
    </section>
  );
}
