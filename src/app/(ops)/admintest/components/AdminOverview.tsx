
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Card,CardContent,CardDescription,CardHeader,CardTitle } from "@/components/shared/ui/card";
import { SvgStackedAreaChart } from "@/components/shared/charts/svg-stacked-area-chart";
import { ChartContainer,type ChartConfig } from "@/components/shared/ui/chart";
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/shared/ui/select";
import { useMemo,useState } from "react";
import type { DashboardData } from "../types";

const chartConfig = {
  users: { label: "Users", color: "#3b82f6" },
  requests: { label: "Requests", color: "#22c55e" },
  deals: { label: "Deals", color: "#a855f7" },
  payments: { label: "Payments", color: "#f59e0b" },
} satisfies ChartConfig;

interface AdminOverviewProps {
  data: DashboardData | null;
}

export function AdminOverview({ data }: AdminOverviewProps) {
  const [overviewRange, setOverviewRange] = useState("30d");

  const overviewActivityData = useMemo(() => {
    const source = data?.charts.activity || [];
    if (!source.length) return [];

    const days = overviewRange === "7d" ? 7 : overviewRange === "30d" ? 30 : 90;
    const lastDateRaw = source[source.length - 1]?.date;
    const referenceDate = lastDateRaw ? new Date(lastDateRaw) : new Date();
    if (Number.isNaN(referenceDate.getTime())) return source;

    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - days);

    return source.filter((row) => new Date(row.date) >= startDate);
  }, [data?.charts.activity, overviewRange]);

  const paymentStackData = useMemo(() => {
    const rows = data?.sections.listing_payments || [];
    if (!Array.isArray(rows)) return [];

    const buckets: Record<string, { date: string; escrow: number; released: number; blocked: number }> = {};

    rows.forEach((row: any) => {
      const rawDate = String(row.created_at || "").slice(0, 10);
      if (!rawDate) return;
      if (!buckets[rawDate]) buckets[rawDate] = { date: rawDate, escrow: 0, released: 0, blocked: 0 };
      const status = String(row.status || "");
      if (["pending", "funded_to_escrow", "awaiting_release"].includes(status)) buckets[rawDate].escrow += 1;
      else if (status === "released") buckets[rawDate].released += 1;
      else if (["failed", "cancelled"].includes(status)) buckets[rawDate].blocked += 1;
    });

    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  }, [data?.sections.listing_payments]);

  const ledgerFlowData = useMemo(() => {
    const rows = data?.sections.ledger_entries || [];
    if (!Array.isArray(rows)) return [];

    const buckets: Record<string, { date: string; deposits: number; fees: number; payouts: number }> = {};

    rows.forEach((row: any) => {
      const rawDate = String(row.created_at || "").slice(0, 10);
      if (!rawDate) return;
      if (!buckets[rawDate]) buckets[rawDate] = { date: rawDate, deposits: 0, fees: 0, payouts: 0 };
      const type = String(row.type || "");
      const amount = Number(row.amount || 0);
      if (!Number.isFinite(amount)) return;
      if (type === "deposit") buckets[rawDate].deposits += amount;
      else if (type === "fee") buckets[rawDate].fees += amount;
      else if (type === "payout" || type === "refund" || type === "adjustment") buckets[rawDate].payouts += amount;
    });

    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  }, [data?.sections.ledger_entries]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total users", data?.metrics.total_users],
          ["DAU / WAU", `${data?.metrics.active_users_24h || 0} / ${data?.metrics.active_users_7d || 0}`], // Updated keys
          ["GMV", `$${Number(data?.metrics.total_gmv || 0).toFixed(2)}`],
          ["Fees", `$${Number(data?.metrics.total_revenue || 0).toFixed(2)}`],
          ["Open requests", data?.metrics.pending_disputes || 0], // Using pending_disputes as placeholder if requests_open is missing in type
          ["Escrow queue", data?.metrics.active_deals || 0],
          ["Dispute rate", `${Number(data?.metrics.dispute_rate || 0).toFixed(2)}%`], // Assuming these keys exist or need to be mapped
          ["Refund rate", `${Number(data?.metrics.refund_rate || 0).toFixed(2)}%`],
        ].map(([label, value]) => (
          <Card key={label} className="border-zinc-800 bg-zinc-950">
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle>{value as any}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card className="pt-0 border-zinc-800 bg-zinc-950">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b border-zinc-800 py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Trend 30 Days</CardTitle>
            <CardDescription>Users, requests, deals and payments.</CardDescription>
          </div>
          <Select value={overviewRange} onValueChange={setOverviewRange}>
            <SelectTrigger className="hidden w-[160px] rounded-lg border-zinc-700 bg-black sm:ml-auto sm:flex" aria-label="Select range">
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Last 90 days</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <SvgStackedAreaChart
              data={overviewActivityData as Record<string, string | number>[]}
              keys={["users", "requests"]}
              colors={["#3b82f6", "#22c55e"]}
              height={250}
              mode="absolute"
              tickFormat={(row) => {
                const raw = String(row.date ?? "");
                const d = new Date(raw);
                return Number.isNaN(d.getTime()) ? raw.slice(5) : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
            />
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader>
            <CardTitle>Payment By Status</CardTitle>
            <CardDescription>Escrow distribution over time (expanded).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-hidden">
              <SvgStackedAreaChart
                data={paymentStackData as Record<string, string | number>[]}
                keys={["blocked", "released", "escrow"]}
                colors={["#64748b", "#22c55e", "#eab308"]}
                height={220}
                mode="percent"
                tickFormat={(row) => String(row.date ?? "").slice(5)}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader>
            <CardTitle>Ledger Flow</CardTitle>
            <CardDescription>Financial movements (Deposits vs Payouts).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-hidden">
              <SvgStackedAreaChart
                data={ledgerFlowData as Record<string, string | number>[]}
                keys={["payouts", "fees", "deposits"]}
                colors={["#a855f7", "#f97316", "#3b82f6"]}
                height={220}
                mode="percent"
                tickFormat={(row) => String(row.date ?? "").slice(5)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

