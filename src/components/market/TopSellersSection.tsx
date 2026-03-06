"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/primitives/container";
import { motion } from "framer-motion";

interface Seller {
  id: string;
  name: string;
  avatar: string;
  status?: "online" | "offline";
  platform?: string; // Icon identifier
}

const TOP_SELLERS_WEEK: Seller[] = [
  { id: "1", name: "uhKelsie", avatar: "/placeholder.svg", status: "online", platform: "tiktok" },
  { id: "2", name: "BoostRoom", avatar: "/placeholder.svg", status: "online" },
  { id: "3", name: "SPlusSquad", avatar: "/placeholder.svg" },
  { id: "4", name: "AlexDota2", avatar: "/placeholder.svg" },
  { id: "5", name: "Bieganzafro", avatar: "/placeholder.svg" },
  { id: "6", name: "HLEB24", avatar: "/placeholder.svg" },
];

const TOP_SELLERS_MONTH: Seller[] = [
  { id: "7", name: "gisellestyle", avatar: "/placeholder.svg", status: "online", platform: "tiktok" },
  { id: "8", name: "shi3rrr", avatar: "/placeholder.svg", platform: "tiktok" },
  { id: "9", name: "Mrshacostore", avatar: "/placeholder.svg", status: "online" },
  { id: "10", name: "byyudhis", avatar: "/placeholder.svg" },
  { id: "11", name: "FPSkinG", avatar: "/placeholder.svg" },
  { id: "12", name: "RyokoSanura", avatar: "/placeholder.svg", platform: "tiktok" },
];

const TOP_ESCROW: Seller[] = [
  { id: "13", name: "SafeTrade", avatar: "/placeholder.svg", status: "online" },
  { id: "14", name: "CryptoGuard", avatar: "/placeholder.svg" },
  { id: "15", name: "TrustLink", avatar: "/placeholder.svg", status: "online" },
  { id: "16", name: "SecureDeal", avatar: "/placeholder.svg" },
  { id: "17", name: "EscrowPro", avatar: "/placeholder.svg" },
  { id: "18", name: "VerifiedAgent", avatar: "/placeholder.svg" },
];

function toSellerProfileHref(name: string) {
  const handle = name.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return `/seller/@${encodeURIComponent(handle || "seller")}`;
}

function SellerRow({ title, sellers }: { title: string; sellers: Seller[] }) {
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
                  src={seller.avatar} 
                  alt={seller.name} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              
              {/* Online Status Indicator */}
              {seller.status === "online" && (
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-black rounded-full" />
              )}
            </div>
            
            <div className="text-center space-y-1">
              <span className="block text-sm font-bold text-white group-hover:text-zinc-200 transition-colors">
                {seller.name}
              </span>
              
              {/* Optional Platform Icon */}
              {seller.platform === 'tiktok' && (
                <div className="flex justify-center">
                    <svg className="w-3 h-3 text-zinc-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { Squircle } from "@/components/ui/Squircle";

export function TopSellersSection() {
  return (
    <Container className="py-0">
      <Squircle
        radius={40}
        smoothing={1}
        borderWidth={1}
        borderColor="rgba(255, 255, 255, 0.1)"
        className="w-full"
        innerClassName="bg-[#0A0A0A] p-8 md:p-12 space-y-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <SellerRow title="Best Sellers of the Week" sellers={TOP_SELLERS_WEEK} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <SellerRow title="Best Sellers of the Month" sellers={TOP_SELLERS_MONTH} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SellerRow title="Best Escrow of the Month" sellers={TOP_ESCROW} />
        </motion.div>
      </Squircle>
    </Container>
  );
}
