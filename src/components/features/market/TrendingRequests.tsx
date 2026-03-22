"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, Ghost } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/shared/ui/button";
import { HoverTooltip as Tooltip } from "@/components/shared/ui/tooltip";
import { TrendingCategoryTabs } from "@/components/features/market/TrendingCategoryTabs";
import { CurrencyIcon } from "@/components/features/market/CurrencyIcon";
import { useCrypto } from "@/contexts/CryptoContext";
import { Container } from "@/components/shared/ui/primitives/container";
import { Card } from "@/components/shared/ui/primitives/card";
import { createClient } from "@/lib/infra/supabase/supabase";

type RequestRow = {
  id: string;
  title: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  payment_method: string | null;
  delivery_time: string | null;
};

type RequestRowCompact = Omit<RequestRow, "payment_method" | "delivery_time">;

type RequestCard = {
  id: string;
  title: string;
  categoryRaw: string;
  category: string;
  price: string;
  currencies: string[];
  offers: number;
  time: string;
  details: {
    serviceType: string;
    turnaround: string;
  };
};

function toCategoryLabel(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatBudget(min: number | null, max: number | null) {
  if (min !== null && max !== null) return `$${min} - $${max}`;
  if (min !== null) return `From $${min}`;
  if (max !== null) return `Up to $${max}`;
  return "Budget on request";
}

function formatDelivery(value: string | null) {
  if (!value) return "Flexible";

  if (value === "instant") return "Instant";
  if (value === "24h") return "Within 24h";
  if (value === "3d") return "Up to 3 days";
  if (value === "1w") return "Up to 1 week";
  if (value === "flexible") return "Flexible";

  return value;
}

function formatTimeAgo(isoDate: string) {
  const now = Date.now();
  const created = new Date(isoDate).getTime();
  const seconds = Math.max(1, Math.floor((now - created) / 1000));

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function TrendingRequests() {
  const supabase = useMemo(() => createClient(), []);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [requests, setRequests] = useState<RequestCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedCrypto, selectedCryptoData, setIsSelectorOpen } = useCrypto();

  useEffect(() => {
    let active = true;

    async function loadTrendingRequests() {
      setLoading(true);

      const queryOpenRequests = (selectClause: string) =>
        supabase.from("requests").select(selectClause).eq("status", "open").order("created_at", { ascending: false }).limit(40);

      const fullSelect = "id,title,category,budget_min,budget_max,created_at,payment_method,delivery_time";
      const compactSelect = "id,title,category,budget_min,budget_max,created_at";
      let requestRows: RequestRow[] = [];

      const initialResult = await queryOpenRequests(fullSelect);

      if (initialResult.error) {
        const fallbackResult = await queryOpenRequests(compactSelect);

        if (fallbackResult.error || !fallbackResult.data) {
          console.error("Failed to load requests", {
            initial: {
              message: initialResult.error.message,
              code: initialResult.error.code,
              details: initialResult.error.details,
            },
            fallback: fallbackResult.error
              ? {
                  message: fallbackResult.error.message,
                  code: fallbackResult.error.code,
                  details: fallbackResult.error.details,
                }
              : null,
          });
          if (active) {
            setRequests([]);
            setLoading(false);
          }
          return;
        }

        requestRows = ((fallbackResult.data as unknown) as RequestRowCompact[]).map((row) => ({
          id: row.id,
          title: row.title,
          category: row.category,
          budget_min: row.budget_min,
          budget_max: row.budget_max,
          created_at: row.created_at,
          payment_method: null,
          delivery_time: null,
        }));
      } else if (initialResult.data) {
        requestRows = (initialResult.data as unknown) as RequestRow[];
      }

      const requestIds = requestRows.map((row) => row.id);

      let offerCountByRequestId: Record<string, number> = {};
      if (requestIds.length > 0) {
        const { data: offerRows, error: offerError } = await supabase
          .from("offers")
          .select("request_id")
          .in("request_id", requestIds);

        if (offerError) {
          console.error("Failed to load offer counters", {
            message: offerError.message,
            code: offerError.code,
            details: offerError.details,
          });
        } else {
          offerCountByRequestId = (offerRows || []).reduce<Record<string, number>>((acc, row) => {
            acc[row.request_id] = (acc[row.request_id] || 0) + 1;
            return acc;
          }, {});
        }
      }

      if (!active) return;

      const mapped = requestRows.map((row) => ({
        id: row.id,
        title: row.title,
        categoryRaw: row.category,
        category: toCategoryLabel(row.category),
        price: formatBudget(row.budget_min, row.budget_max),
        currencies: row.payment_method ? [row.payment_method.toUpperCase()] : [],
        offers: offerCountByRequestId[row.id] || 0,
        time: formatTimeAgo(row.created_at),
        details: {
          serviceType: toCategoryLabel(row.category),
          turnaround: formatDelivery(row.delivery_time),
        },
      }));

      setRequests(mapped);
      setLoading(false);
    }

    loadTrendingRequests();

    return () => {
      active = false;
    };
  }, [supabase]);

  const categories = useMemo(() => {
    const dynamicCategories = Array.from(new Set(requests.map((req) => req.category))).sort();
    return ["All", ...dynamicCategories];
  }, [requests]);

  const filteredRequests = requests
    .filter((req) => {
      if (selectedCategory !== "All" && req.category !== selectedCategory) return false;
      if (req.currencies.length > 0 && !req.currencies.includes(selectedCrypto)) return false;
      return true;
    })
    .slice(0, 8);

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
          <TrendingCategoryTabs selectedCategory={selectedCategory} onSelect={setSelectedCategory} categories={categories} />
        </div>

        <div className="relative min-h-[300px]">
          {loading ? (
            <div className="py-20 text-center text-zinc-500">Loading requests...</div>
          ) : filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
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
                    <Link href={`/requests/${req.id}`} className="block h-full group">
                      <div className="flex h-full cursor-pointer flex-col">
                        <Card
                          as="div"
                          radius={24}
                          smoothing={0.8}
                          border="subtle"
                          className="relative z-10 flex-1 overflow-hidden transition-colors hover:stroke-white/[0.12]"
                          innerClassName="bg-[#1C1C1E] p-5 h-full flex flex-col justify-between"
                        >
                          <div className="flex flex-col">
                            <div className="mb-4 flex items-start justify-between">
                              <span className="rounded-full border border-white/5 bg-zinc-700/50 px-2.5 py-1 text-[11px] font-bold text-zinc-300">
                                {req.category}
                              </span>
                              {req.offers > 0 && (
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                                  {req.offers} offers
                                </span>
                              )}
                            </div>

                            <h3 className="mb-3 line-clamp-2 h-[54px] text-[18px] font-bold leading-snug text-white">{req.title}</h3>

                            <div className="mt-2 space-y-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold text-white">{req.price}</span>
                                  </div>
                                  {req.currencies.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      {req.currencies.map((curr) => (
                                        <Tooltip key={curr} content={`Pay with ${curr}`} side="top">
                                          <div className="cursor-help opacity-80 transition-opacity hover:opacity-100">
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

                          <div className="mt-2 flex items-center justify-between pt-6">
                            <div className="flex items-center gap-3">
                              <Tooltip content={`Delivery: ${req.details.turnaround}`} side="top">
                                <div className="flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-white">
                                  <Clock className="h-3.5 w-3.5 opacity-70" />
                                  <span className="text-xs font-medium">{req.time}</span>
                                </div>
                              </Tooltip>
                            </div>

                            <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:bg-white/10">
                              {req.details.serviceType}
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
            <div className="flex flex-col items-center justify-center space-y-6 py-20 text-center">
              <div className="group relative rounded-full border border-white/5 bg-zinc-900/50 p-6">
                <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
                <Ghost className="relative z-10 h-10 w-10 text-zinc-500" />
              </div>
              <div className="mx-auto max-w-md space-y-2">
                <h3 className="text-xl font-bold text-white">No requests found</h3>
                <div className="flex flex-col items-center justify-center gap-1.5 text-sm text-zinc-400 md:flex-row">
                  <span>
                    No active requests in <span className="font-medium text-white">{selectedCategory}</span> accepting
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2.5 py-1 font-medium text-white">
                    <Image src={selectedCryptoData.Icon} alt={selectedCrypto} width={16} height={16} className="rounded-full" />
                    {selectedCrypto}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
                  onClick={() => setSelectedCategory("All")}
                >
                  View all categories
                </Button>
                <Button
                  variant="outline"
                  style={{
                    backgroundColor: `${selectedCryptoData.color}10`,
                    borderColor: `${selectedCryptoData.color}20`,
                    color: selectedCryptoData.color,
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
              className="group w-full"
              innerClassName="bg-white text-black font-bold text-sm py-3 flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
            >
              View all requests
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Card>
          </Link>
        </div>
      </Card>
    </Container>
  );
}



