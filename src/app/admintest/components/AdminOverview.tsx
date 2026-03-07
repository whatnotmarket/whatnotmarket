
"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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
            <AreaChart data={overviewActivityData}>
              <defs>
                <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-users)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-requests)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-requests)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area dataKey="users" type="natural" fill="url(#fillUsers)" stroke="var(--color-users)" stackId="a" />
              <Area dataKey="requests" type="natural" fill="url(#fillRequests)" stroke="var(--color-requests)" stackId="a" />
            </AreaChart>
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
            <ChartContainer
              config={{
                escrow: { label: "Escrow", color: "var(--chart-1)" },
                released: { label: "Released", color: "var(--chart-2)" },
                blocked: { label: "Blocked", color: "var(--chart-3)" },
              }}
            >
              <AreaChart data={paymentStackData} margin={{ left: 12, right: 12, top: 12 }} stackOffset="expand">
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => String(value).slice(5)}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="blocked" type="natural" fill="var(--color-blocked)" fillOpacity={0.2} stroke="var(--color-blocked)" stackId="a" />
                <Area dataKey="released" type="natural" fill="var(--color-released)" fillOpacity={0.35} stroke="var(--color-released)" stackId="a" />
                <Area dataKey="escrow" type="natural" fill="var(--color-escrow)" fillOpacity={0.35} stroke="var(--color-escrow)" stackId="a" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader>
            <CardTitle>Ledger Flow</CardTitle>
            <CardDescription>Financial movements (Deposits vs Payouts).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                deposits: { label: "Deposits", color: "var(--chart-1)" },
                payouts: { label: "Payouts", color: "var(--chart-2)" },
                fees: { label: "Fees", color: "var(--chart-3)" },
              }}
            >
              <AreaChart data={ledgerFlowData} margin={{ left: 12, right: 12, top: 12 }} stackOffset="expand">
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => String(value).slice(5)}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="payouts" type="natural" fill="var(--color-payouts)" fillOpacity={0.1} stroke="var(--color-payouts)" stackId="a" />
                <Area dataKey="fees" type="natural" fill="var(--color-fees)" fillOpacity={0.4} stroke="var(--color-fees)" stackId="a" />
                <Area dataKey="deposits" type="natural" fill="var(--color-deposits)" fillOpacity={0.4} stroke="var(--color-deposits)" stackId="a" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
