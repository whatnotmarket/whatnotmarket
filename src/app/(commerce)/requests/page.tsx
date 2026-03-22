"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/app/navigation/Navbar";
import { Button } from "@/components/shared/ui/button";
import { createClient } from "@/lib/infra/supabase/supabase";

type RequestRow = {
  id: string;
  title: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  condition: string | null;
  payment_method: string | null;
  created_at: string;
};

type RequestRowCompact = Omit<RequestRow, "condition" | "payment_method">;

type RequestListItem = RequestRow & {
  offers: number;
};

function formatBudget(min: number | null, max: number | null) {
  if (min !== null && max !== null) return `$${min} - $${max}`;
  if (min !== null) return `From $${min}`;
  if (max !== null) return `Up to $${max}`;
  return "Budget on request";
}

function formatTimeAgo(isoDate: string) {
  const now = Date.now();
  const created = new Date(isoDate).getTime();
  const seconds = Math.max(1, Math.floor((now - created) / 1000));

  if (seconds < 60) return "now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function toLabel(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function RequestsListPage() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [requests, setRequests] = useState<RequestListItem[]>([]);

  useEffect(() => {
    let active = true;

    async function loadRequests() {
      setLoading(true);

      const queryOpenRequests = (selectClause: string) =>
        supabase.from("requests").select(selectClause).eq("status", "open").order("created_at", { ascending: false }).limit(100);

      const fullSelect = "id,title,category,budget_min,budget_max,condition,payment_method,created_at";
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
          condition: null,
          payment_method: null,
        }));
      } else if (initialResult.data) {
        requestRows = (initialResult.data as unknown) as RequestRow[];
      }

      const requestIds = requestRows.map((row) => row.id);

      let offerCountByRequestId: Record<string, number> = {};
      if (requestIds.length > 0) {
        const { data: offerRows } = await supabase.from("offers").select("request_id").in("request_id", requestIds);

        offerCountByRequestId = (offerRows || []).reduce<Record<string, number>>((acc, row) => {
          acc[row.request_id] = (acc[row.request_id] || 0) + 1;
          return acc;
        }, {});
      }

      if (!active) return;

      const rows = requestRows.map((row) => ({
        ...row,
        offers: offerCountByRequestId[row.id] || 0,
      }));

      setRequests(rows);
      setLoading(false);
    }

    loadRequests();

    return () => {
      active = false;
    };
  }, [supabase]);

  const categories = useMemo(() => {
    const values = Array.from(new Set(requests.map((req) => toLabel(req.category)))).sort();
    return ["All", ...values];
  }, [requests]);

  const filtered = requests.filter((request) => {
    if (selectedCategory !== "All" && toLabel(request.category) !== selectedCategory) return false;

    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();

    return (
      request.title.toLowerCase().includes(term) ||
      request.category.toLowerCase().includes(term) ||
      (request.payment_method || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">All Requests</h1>
            <p className="mt-2 text-sm text-zinc-400">Live marketplace requests from buyers.</p>
          </div>

          <Link href="/requests/new">
            <Button className="bg-white font-bold text-black hover:bg-zinc-200">Create request</Button>
          </Link>
        </div>

        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests"
            className="h-11 w-full rounded-lg border border-white/10 bg-zinc-900 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-white/20 focus:outline-none"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-11 rounded-lg border border-white/10 bg-zinc-900 px-4 text-sm text-white focus:border-white/20 focus:outline-none"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-6 text-zinc-400">Loading requests...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-6 text-zinc-400">No requests found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((request) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="block rounded-xl border border-white/10 bg-zinc-900/40 p-4 transition-colors hover:bg-zinc-900/60"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-white">{request.title}</h2>
                  <span className="text-xs text-zinc-500">{formatTimeAgo(request.created_at)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-zinc-300">{toLabel(request.category)}</span>
                  {request.condition && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-zinc-300">{toLabel(request.condition)}</span>
                  )}
                  {request.payment_method && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-zinc-300">{request.payment_method}</span>
                  )}
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
                    {request.offers} offers
                  </span>
                </div>

                <div className="mt-3 text-sm font-semibold text-white">{formatBudget(request.budget_min, request.budget_max)}</div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}



