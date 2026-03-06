"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, Ghost } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { TrendingCategoryTabs } from "@/components/market/TrendingCategoryTabs";
import { CurrencyIcon } from "@/components/market/CurrencyIcon";
import { useCrypto } from "@/contexts/CryptoContext";
import { Container } from "@/components/ui/primitives/container";
import { Card } from "@/components/ui/primitives/card";

// Mock Data moved here
const REQUESTS = [
  {
    id: "1",
    title: "Telegram Username @crypto",
    price: "$5,000",
    currencies: ["BTC", "USDC", "TRX"],
    category: "Accounts",
    offers: 3,
    time: "2h ago",
    details: { serviceType: "Username", turnaround: "Instant", region: "Global", verification: "Verified" }
  },
  {
    id: "2",
    title: "Discord Early Supporter Account",
    price: "$550",
    currencies: ["USDC"],
    category: "Gaming",
    offers: 1,
    time: "4h ago",
    details: { serviceType: "Account", turnaround: "< 1h", region: "Global", verification: "Verified" }
  },
  {
    id: "3",
    title: "VoIP Number (US) - Non-VoIP",
    price: "$15",
    unit: "/ month",
    currencies: ["USDT", "BNB"],
    category: "Telco",
    offers: 0,
    time: "5h ago",
    details: { serviceType: "VoIP", turnaround: "Instant", region: "US", verification: "Verified" }
  },
  {
    id: "4",
    title: "Netflix Premium 4K UHD - 12 Months",
    price: "$45",
    currencies: ["ETH"],
    category: "Software",
    offers: 12,
    time: "10m ago",
    details: { serviceType: "Subscription", turnaround: "Instant", region: "Global", verification: "Verified" }
  },
  {
    id: "5",
    title: "Twitter Gold Verification Service",
    price: "$1,200",
    currencies: ["USDC", "USDT"],
    category: "Social Media",
    offers: 5,
    time: "1h ago",
    details: { serviceType: "Verification", turnaround: "24-48h", region: "Global", verification: "Verified" }
  },
  {
    id: "6",
    title: "Exclusive Fortnite Skin Code",
    price: "$200",
    currencies: ["SOL", "LTC", "XMR"],
    category: "Skins",
    offers: 8,
    time: "30m ago",
    details: { serviceType: "Skin Code", turnaround: "Instant", region: "Global", verification: "Verified" }
  },
  {
    id: "7",
    title: "USDT Flash Exchange Service",
    price: "$10,000",
    currencies: ["USDT", "BTC"],
    category: "Crypto",
    offers: 2,
    time: "15m ago",
    details: { serviceType: "Exchange", turnaround: "Instant", region: "Global", verification: "Verified" }
  },
  {
    id: "8",
    title: "Custom SaaS Development",
    price: "$2,500",
    currencies: ["BTC", "ETH"],
    category: "Services",
    offers: 4,
    time: "3h ago",
    details: { serviceType: "Development", turnaround: "2 weeks", region: "Global", verification: "Verified" }
  }
];

export function TrendingRequests() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { selectedCrypto, selectedCryptoData, setIsSelectorOpen } = useCrypto();

  const filteredRequests = REQUESTS.filter(req => {
    if (selectedCategory !== "All" && req.category !== selectedCategory) return false;
    if (req.currencies && !req.currencies.includes(selectedCrypto)) return false;
    return true;
  }).slice(0, 8);

  return (
    <Container className="px-4 space-y-14">
      <Card
        radius={40}
        smoothing={1}
        border="default"
        padding="lg"
        innerClassName="bg-[#0A0A0A] space-y-8"
        className="shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-white">Trending requests</h2>
        </div>
        
        <div className="-mx-2">
            <TrendingCategoryTabs 
                selectedCategory={selectedCategory} 
                onSelect={setSelectedCategory} 
            />
        </div>

        <div className="relative min-h-[300px]">
            {filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <AnimatePresence mode="popLayout">
              {filteredRequests.map((req, i) => (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: 0.05 * i }}
                  className="h-full"
                >
                  <Link href={`/requests/${req.id}`} className="block group h-full">
                    <div className="flex flex-col h-full cursor-pointer">
                      <Card
                        as="div"
                        radius={24}
                        smoothing={0.8}
                        border="subtle"
                        className="relative transition-colors overflow-hidden z-10 flex-1 hover:stroke-white/[0.12]"
                        innerClassName="bg-[#1C1C1E] p-5 h-full flex flex-col justify-between"
                      >
                        <div className="flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-zinc-700/50 text-zinc-300 border border-white/5">
                              {req.category}
                              </span>
                              {req.offers > 0 && (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  {req.offers} offers
                              </span>
                              )}
                          </div>

                          <h3 className="text-[18px] font-bold text-white leading-snug mb-3 line-clamp-2 h-[54px]">
                              {req.title}
                          </h3>

                          <div className="mt-2 space-y-4">
                              <div>
                                  <div className="flex items-center gap-2">
                                      <div className="flex items-baseline gap-1">
                                          <span className="text-xl font-bold text-white">{req.price}</span>
                                          {req.unit && <span className="text-sm text-zinc-500 font-medium">{req.unit}</span>}
                                      </div>
                                      {req.currencies && req.currencies.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            {req.currencies.map((curr) => (
                                                <Tooltip key={curr} content={`Pay with ${curr}`} side="top">
                                                    <div className="opacity-80 hover:opacity-100 transition-opacity cursor-help">
                                                        <CurrencyIcon currency={curr} />
                                                    </div>
                                                </Tooltip>
                                            ))}
                                        </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 mt-2">
                            <div className="flex items-center gap-3">
                                <Tooltip content="Verified" side="top">
                                    <div className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors">
                                        <svg className="w-4 h-4" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M434.068,46.758L314.607,9.034C295.648,3.047,275.883,0,256,0s-39.648,3.047-58.607,9.034L77.932,46.758 C52.97,54.641,36,77.796,36,103.973v207.39c0,38.129,18.12,73.989,48.816,96.607l117.032,86.234 C217.537,505.764,236.513,512,256,512s38.463-6.236,54.152-17.796l117.032-86.234C457.88,385.352,476,349.492,476,311.363v-207.39 C476,77.796,459.03,54.641,434.068,46.758z M347.924,227.716l-98.995,98.995c-11.716,11.716-30.711,11.716-42.426,0l-42.427-42.426 c-11.716-11.716-11.716-30.711,0-42.426l0,0c11.716-11.716,30.711-11.716,42.426,0l21.213,21.213l77.782-77.782 c11.716-11.716,30.711-11.716,42.426,0h0C359.64,197.005,359.64,216,347.924,227.716z"></path>
                                        </svg>
                                    </div>
                                </Tooltip>
                                <Tooltip content={`Delivery: ${req.details?.turnaround || '24h'}`} side="top">
                                    <div className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors">
                                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM7 3V8.41421L10.2929 11.7071L11.7071 10.2929L9 7.58579V3H7Z"></path>
                                        </svg>
                                    </div>
                                </Tooltip>
                                <Tooltip content="Instant Delivery" side="top">
                                    <div className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors">
                                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M14.3479 10.5326L4.68585 18.6926C3.77085 19.3796 2.22085 18.8366 2.34085 17.8356L2.96285 11.7006C3.03785 11.0796 2.50885 10.5616 1.78185 10.5426L-3.87315 10.3996C-5.04615 10.3696 -5.58415 9.14159 -4.66915 8.45459L4.80185 -0.690411C5.71685 -1.37741 6.88285 -0.844411 6.76185 0.156589L6.13985 7.27159C6.06485 7.89259 6.59385 8.41059 7.32085 8.42859L13.7439 8.59259C14.9179 8.62259 15.2629 9.84559 14.3479 10.5326Z" transform="translate(3 0)"></path>
                                        </svg>
                                    </div>
                                </Tooltip>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                                    <Clock className="h-3.5 w-3.5 opacity-70" />
                                    <span>{req.time}</span>
                                </div>
                            </div>

                            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:bg-white/10 transition-colors ml-auto">
                              {req.details?.serviceType || 'Service'}
                            </span>
                        </div>
                      </Card>
                    </div>
                  </Link>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="p-6 rounded-full bg-zinc-900/50 border border-white/5 relative group">
                        <div className="absolute inset-0 bg-white/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Ghost className="w-10 h-10 text-zinc-500 relative z-10" />
                    </div>
                    <div className="space-y-2 max-w-md mx-auto">
                        <h3 className="text-xl font-bold text-white">No requests found</h3>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 text-sm text-zinc-400">
                            <span>No active requests in <span className="text-white font-medium">{selectedCategory}</span> accepting</span>
                            <span className="inline-flex items-center gap-1.5 text-white font-medium bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                <Image src={selectedCryptoData.Icon} alt={selectedCrypto} width={16} height={16} className="rounded-full" />
                                {selectedCrypto}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-zinc-300 transition-all"
                            onClick={() => setSelectedCategory("All")}
                        >
                            View all categories
                        </Button>
                        <Button 
                            variant="outline" 
                            style={{
                                backgroundColor: `${selectedCryptoData.color}10`, // 10% opacity
                                borderColor: `${selectedCryptoData.color}20`, // 20% opacity
                                color: selectedCryptoData.color
                            }}
                            className="transition-all hover:opacity-80"
                            onClick={() => setIsSelectorOpen(true)}
                        >
                            Change Crypto
                        </Button>
                    </div>
                </div>
            )}
        </div>

        <div className="-mt-12">
            <Link href="/requests" className="block w-full">
                <Card
                    as="button"
                    radius={20}
                    smoothing={1}
                    className="w-full group"
                    innerClassName="bg-white text-black font-bold text-sm py-3 flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                >
                    View all requests
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Card>
            </Link>
        </div>
      </Card>
    </Container>
  );
}
