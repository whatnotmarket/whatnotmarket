"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  ClipboardList,
  Database,
  HandCoins,
  Loader2,
  MessageSquareWarning,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Modal } from "@/components/ui/Modal";

type SectionKey =
  | "overview"
  | "admin_activity"
  | "users"
  | "sellers"
  | "wallets"
  | "requests"
  | "offers"
  | "deals"
  | "escrow"
  | "payment_intents"
  | "ledger"
  | "disputes"
  | "messages"
  | "notifications"
  | "proxy_orders"
  | "invites"
  | "audit"
  | "risk"
  | "system"
  | "config";

type DashboardData = {
  metrics: Record<string, number>;
  charts: {
    activity: Array<{ date: string; users?: number; requests?: number; deals?: number; payments?: number }>;
    payment_status?: Array<{ status: string; value: number }>;
    deal_status?: Array<{ status: string; value: number }>;
    ledger_flow?: Array<{ type: string; value: number }>;
  };
  sections: Record<string, any>;
};

const sectionList: Array<{ key: SectionKey; slug: string; label: string; icon: React.ReactNode }> = [
  { key: "overview", slug: "", label: "Overview", icon: <ShieldCheck /> },
  { key: "admin_activity", slug: "admin-activity", label: "Admin Activity", icon: <BarChart3 /> },
  { key: "users", slug: "users", label: "Users", icon: <Users /> },
  { key: "sellers", slug: "sellers", label: "Sellers & Verifications", icon: <UserCog /> },
  { key: "wallets", slug: "wallets", label: "Wallets & Identities", icon: <Wallet /> },
  { key: "requests", slug: "requests", label: "Requests", icon: <ClipboardList /> },
  { key: "offers", slug: "offers", label: "Offers", icon: <ClipboardList /> },
  { key: "deals", slug: "deals", label: "Deals", icon: <ClipboardList /> },
  { key: "escrow", slug: "escrow", label: "Escrow", icon: <HandCoins /> },
  { key: "payment_intents", slug: "payment-intents", label: "Payment Intents", icon: <Database /> },
  { key: "ledger", slug: "ledger", label: "Ledger", icon: <Database /> },
  { key: "disputes", slug: "disputes", label: "Disputes", icon: <AlertTriangle /> },
  { key: "messages", slug: "messages", label: "Messages & Moderation", icon: <MessageSquareWarning /> },
  { key: "notifications", slug: "notifications", label: "Notifications", icon: <Bell /> },
  { key: "proxy_orders", slug: "proxy-orders", label: "Proxy Orders", icon: <PackageSearch /> },
  { key: "invites", slug: "invites", label: "Invites", icon: <ShieldAlert /> },
  { key: "audit", slug: "audit", label: "Audit Logs", icon: <ClipboardList /> },
  { key: "risk", slug: "risk", label: "Risk", icon: <AlertTriangle /> },
  { key: "system", slug: "system", label: "System", icon: <Wrench /> },
  { key: "config", slug: "config", label: "Config", icon: <Wrench /> },
];

const slugToSection = new Map<string, SectionKey>(sectionList.map((item) => [item.slug || "overview", item.key]));

const chartConfig = {
  users: { label: "Users", color: "#3b82f6" },
  requests: { label: "Requests", color: "#22c55e" },
  deals: { label: "Deals", color: "#a855f7" },
  payments: { label: "Payments", color: "#f59e0b" },
} satisfies ChartConfig;

const proxyStatuses = [
  "CREATED",
  "PLACED",
  "PROCESSING",
  "LOCKER_ASSIGNED",
  "READY_FOR_PICKUP",
  "PICKED_UP",
  "COMPLETED",
  "CANCELLED",
];

function short(value: string | null | undefined) {
  return value ? value.slice(0, 8) : "-";
}

function fdate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function adminFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, {
    ...init,
    headers,
    cache: init?.cache || "no-store",
  });
}

function JsonTable({ title, rows }: { title: string; rows: Array<Record<string, any>> }) {
  const columns = useMemo(() => {
    const sample = rows[0] || {};
    return Object.keys(sample).slice(0, 8);
  }, [rows]);

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{rows.length} records</CardDescription>
      </CardHeader>
      <CardContent className="overflow-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-400">
              {columns.map((column) => (
                <th key={column} className="p-2">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${title}-${idx}`} className="border-b border-zinc-900">
                {columns.map((column) => (
                  <td key={column} className="p-2">
                    {typeof row[column] === "string" ? row[column] : JSON.stringify(row[column] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const pathname = usePathname();
  const [active, setActive] = useState<SectionKey>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalResults, setGlobalResults] = useState<Record<string, Array<Record<string, any>>> | null>(null);
  const [notificationDraft, setNotificationDraft] = useState({
    recipientId: "",
    type: "admin_manual",
    title: "",
    body: "",
    link: "",
  });
  const [followDraft, setFollowDraft] = useState({ followerHandle: "", targetHandle: "whatnotmarket" });
  const [configDraft, setConfigDraft] = useState({ key: "", value: "{}", description: "" });
  const [inviteDraft, setInviteDraft] = useState({
    code: "",
    type: "buyer",
    singleUse: false,
    usageLimit: "",
    expiresAt: "",
  });
  const [overviewRange, setOverviewRange] = useState("30d");
  const [releaseTxByPayment, setReleaseTxByPayment] = useState<Record<string, string>>({});
  const [proxyDraftByOrder, setProxyDraftByOrder] = useState<
    Record<string, { status: string; message: string }>
  >({});
  const [pendingNoteAction, setPendingNoteAction] = useState<{
    action: string;
    targetId: string;
    value?: unknown;
    success?: string;
    title?: string;
  } | null>(null);
  const [pendingNoteText, setPendingNoteText] = useState("");
  const [submittingNoteAction, setSubmittingNoteAction] = useState(false);

  useEffect(() => {
    const path = pathname || "/admintest";
    const basePath = path.startsWith("/admin") ? "/admin" : "/admintest";
    const slug = path.startsWith(`${basePath}/`)
      ? path.slice(`${basePath}/`.length).split("/")[0] || "overview"
      : "overview";
    setActive(slugToSection.get(slug) || "overview");
  }, [pathname]);

  const loadDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await adminFetch("/api/admin/dashboard/overview");
      const payload = (await res.json().catch(() => null)) as unknown;
      const isObjectPayload = payload !== null && typeof payload === "object";
      const maybeError =
        isObjectPayload && "error" in payload
          ? String((payload as { error?: string }).error || "Load failed")
          : null;
      if (!res.ok || !isObjectPayload || maybeError) {
        throw new Error(maybeError || "Load failed");
      }
      setData(payload as DashboardData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const q = globalSearch.trim();
    if (q.length < 2) {
      setGlobalResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await adminFetch(`/api/admin/dashboard/search?q=${encodeURIComponent(q)}`);
        const payload = (await res.json().catch(() => null)) as
          | { results?: Record<string, Array<Record<string, any>>>; error?: string }
          | null;
        if (!res.ok || !payload || payload.error) throw new Error(payload?.error || "Search failed");
        setGlobalResults(payload.results || null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Search failed");
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  const executeAction = async (
    action: string,
    targetId: string,
    value?: unknown,
    note?: string | null,
    success?: string
  ) => {
    try {
      const res = await adminFetch("/api/admin/dashboard/action", {
        method: "POST",
        body: JSON.stringify({ action, targetId, value: value ?? null, note: note || "" }),
      });
      const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || "Action failed");
      toast.success(success || "Action completed");
      await loadDashboard(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  };

  const runAction = async (
    action: string,
    targetId: string,
    value?: unknown,
    options?: { requireNote?: boolean; success?: string; title?: string }
  ) => {
    const needNote = options?.requireNote ?? false;
    if (needNote) {
      setPendingNoteText("");
      setPendingNoteAction({
        action,
        targetId,
        value,
        success: options?.success,
        title: options?.title,
      });
      return;
    }

    await executeAction(action, targetId, value, null, options?.success);
  };

  const submitPendingAction = async () => {
    if (!pendingNoteAction) return;
    if (pendingNoteText.trim().length < 3) {
      toast.error("Add an internal note (min 3 chars)");
      return;
    }

    setSubmittingNoteAction(true);
    try {
      const justRanAction = pendingNoteAction.action;
      await executeAction(
        pendingNoteAction.action,
        pendingNoteAction.targetId,
        pendingNoteAction.value,
        pendingNoteText.trim(),
        pendingNoteAction.success
      );
      if (justRanAction === "invite.create") {
        setInviteDraft({
          code: "",
          type: "buyer",
          singleUse: false,
          usageLimit: "",
          expiresAt: "",
        });
      }
      setPendingNoteAction(null);
      setPendingNoteText("");
    } finally {
      setSubmittingNoteAction(false);
    }
  };

  const getProxyDraft = (order: { id: string; status?: string }) =>
    proxyDraftByOrder[order.id] || {
      status: String(order.status || "CREATED"),
      message: "",
    };

  const filteredUsers = useMemo(() => {
    const users = data?.sections.users || [];
    const q = userSearch.toLowerCase().trim();
    if (!q) return users;
    return users.filter((user: any) => {
      const wallets = Array.isArray(user.wallets) ? user.wallets.map((w: any) => String(w.address || "")).join(" ") : "";
      return (
        String(user.id || "").toLowerCase().includes(q) ||
        String(user.email || "").toLowerCase().includes(q) ||
        String(user.username || "").toLowerCase().includes(q) ||
        String(user.telegram_username || user.telegram_user_id || "").toLowerCase().includes(q) ||
        wallets.toLowerCase().includes(q)
      );
    });
  }, [data?.sections.users, userSearch]);

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

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total users", data?.metrics.totalUsers],
          ["DAU / WAU", `${data?.metrics.dau || 0} / ${data?.metrics.wau || 0}`],
          ["GMV", `$${Number(data?.metrics.gmv || 0).toFixed(2)}`],
          ["Fees", `$${Number(data?.metrics.feesGenerated || 0).toFixed(2)}`],
          ["Open requests", data?.metrics.requestsOpen || 0],
          ["Escrow queue", data?.metrics.listingPaymentsAwaitingRelease || 0],
          ["Dispute rate", `${Number(data?.metrics.disputeRate || 0).toFixed(2)}%`],
          ["Refund rate", `${Number(data?.metrics.refundRate || 0).toFixed(2)}%`],
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
              <Area dataKey="requests" type="natural" fill="url(#fillRequests)" stroke="var(--color-requests)" stackId="a" />
              <Area dataKey="users" type="natural" fill="url(#fillUsers)" stroke="var(--color-users)" stackId="a" />
              <ChartLegend content={<ChartLegendContent />} />
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
            <CardDescription>Deposits, fees and payouts over time (expanded).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                deposits: { label: "Deposits", color: "var(--chart-1)" },
                fees: { label: "Fees", color: "var(--chart-2)" },
                payouts: { label: "Payouts", color: "var(--chart-3)" },
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
                <Area dataKey="payouts" type="natural" fill="var(--color-payouts)" fillOpacity={0.2} stroke="var(--color-payouts)" stackId="a" />
                <Area dataKey="fees" type="natural" fill="var(--color-fees)" fillOpacity={0.35} stroke="var(--color-fees)" stackId="a" />
                <Area dataKey="deposits" type="natural" fill="var(--color-deposits)" fillOpacity={0.35} stroke="var(--color-deposits)" stackId="a" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAdminActivity = () => <ChartAreaInteractive activityData={data?.charts.activity} />;

  const renderUsers = () => (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader>
        <CardTitle>User Center</CardTitle>
        <CardDescription>Role/access, ban/suspend, force logout, delete user.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="Search email, handle, id, wallet, telegram"
          className="max-w-xl border-zinc-700 bg-black"
        />
        <div className="overflow-auto">
          <table className="w-full min-w-[1400px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-zinc-400">
                <th className="p-2">User</th><th className="p-2">Role</th><th className="p-2">Seller</th>
                <th className="p-2">Wallets</th><th className="p-2">Access</th><th className="p-2">Last Login</th><th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user: any) => (
                <tr key={user.id} className="border-b border-zinc-900 align-top">
                  <td className="p-2">
                    <div className="font-semibold text-white">{String(user.username || user.full_name || short(user.id)).replace(/^@+/, "@")}</div>
                    <div className="text-xs text-zinc-500">{user.email || "-"}</div>
                    <div className="text-[11px] text-zinc-600">{user.id}</div>
                  </td>
                  <td className="p-2">
                    <Select value={String(user.role_preference || "buyer")} onValueChange={(v) => runAction("user.setRole", user.id, v)}>
                      <SelectTrigger className="h-8 w-[130px] border-zinc-700 bg-black"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="buyer">buyer</SelectItem><SelectItem value="seller">seller</SelectItem><SelectItem value="both">both</SelectItem></SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Select value={String(user.seller_status || "unverified")} onValueChange={(v) => runAction("user.setSellerStatus", user.id, v)}>
                      <SelectTrigger className="h-8 w-[160px] border-zinc-700 bg-black"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unverified">unverified</SelectItem><SelectItem value="pending_telegram">pending_telegram</SelectItem>
                        <SelectItem value="verified">verified</SelectItem><SelectItem value="rejected">rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2 text-xs text-zinc-400">
                    {(Array.isArray(user.wallets) ? user.wallets : []).slice(0, 2).map((w: any) => `${w.chain}:${String(w.address).slice(0, 10)}...`).join(" | ") || "-"}
                  </td>
                  <td className="p-2">
                    <Badge variant="outline">{user.is_admin ? "admin" : "user"}</Badge>{" "}
                    <Badge variant="outline">{user.account_status || "active"}</Badge>
                  </td>
                  <td className="p-2 text-xs text-zinc-400">{fdate(user.last_sign_in_at)}</td>
                  <td className="p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => runAction("user.resetOnboarding", user.id)}>Reset Onboarding</Button>
                      {user.is_admin ? (
                        <Button size="sm" variant="outline" className="border-red-800 text-red-300" onClick={() => runAction("user.revokeAdmin", user.id, null, { requireNote: true })}>Revoke Admin</Button>
                      ) : (
                        <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => runAction("user.setAdmin", user.id, true, { requireNote: true })}>Grant Admin</Button>
                      )}
                      <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => runAction("user.setAccountStatus", user.id, { status: "suspended", duration: "24h" }, { requireNote: true })}>Suspend 24h</Button>
                      <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => runAction("user.setAccountStatus", user.id, { status: "active" }, { requireNote: true })}>Activate</Button>
                      <Button size="sm" variant="outline" className="border-red-800 text-red-300" onClick={() => runAction("user.ban", user.id, { duration: "720h" }, { requireNote: true })}>Ban</Button>
                      <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => runAction("user.unban", user.id)}>Unban</Button>
                      <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => runAction("user.forceLogout", user.id, null, { requireNote: true })}>Force Logout</Button>
                      <Button size="sm" variant="outline" className="border-red-800 text-red-300" onClick={() => runAction("user.delete", user.id, null, { requireNote: true })}>Delete User</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderEscrow = () => (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader><CardTitle>Escrow & Payments</CardTitle><CardDescription>Release / fail / cancel with note.</CardDescription></CardHeader>
      <CardContent className="overflow-auto">
        <table className="w-full min-w-[1300px] text-sm">
          <thead><tr className="border-b border-zinc-800 text-left text-zinc-400"><th className="p-2">Payment</th><th className="p-2">Users</th><th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">Tx In/Out</th><th className="p-2">Actions</th></tr></thead>
          <tbody>
            {(data?.sections.listing_payments || []).map((p: any) => (
              <tr key={p.id} className="border-b border-zinc-900">
                <td className="p-2"><div className="font-mono text-xs">{p.id}</div><div className="text-xs text-zinc-500">{p.escrow_reference}</div></td>
                <td className="p-2">{p.payer_handle} {"->"} {p.payee_handle}</td>
                <td className="p-2">{p.amount} {p.currency} ({p.chain})</td>
                <td className="p-2"><Badge variant="outline">{p.status}</Badge></td>
                <td className="p-2 font-mono text-xs">IN:{p.tx_hash_in || "-"}<br />OUT:{p.tx_hash_out || "-"}</td>
                <td className="p-2">
                  <div className="space-y-2">
                    <Input
                      value={releaseTxByPayment[p.id] || ""}
                      onChange={(event) =>
                        setReleaseTxByPayment((prev) => ({
                          ...prev,
                          [p.id]: event.target.value,
                        }))
                      }
                      placeholder="tx hash out for release"
                      className="h-8 border-zinc-700 bg-black font-mono text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-zinc-700"
                        onClick={() =>
                          runAction(
                            "payment.transition",
                            p.id,
                            { status: "awaiting_release" },
                            { requireNote: true, title: "Queue Escrow Payment" }
                          )
                        }
                      >
                        Queue
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-500 text-black hover:bg-emerald-400"
                        onClick={() => {
                          const txHashOut = (releaseTxByPayment[p.id] || "").trim();
                          if (!txHashOut) {
                            toast.error("Tx hash out is required for release");
                            return;
                          }
                          runAction(
                            "payment.transition",
                            p.id,
                            { status: "released", txHashOut },
                            { requireNote: true, title: "Release Escrow Payment" }
                          );
                        }}
                      >
                        Release
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-800 text-red-300"
                        onClick={() =>
                          runAction(
                            "payment.transition",
                            p.id,
                            { status: "failed" },
                            { requireNote: true, title: "Fail Escrow Payment" }
                          )
                        }
                      >
                        Fail
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-zinc-700"
                        onClick={() =>
                          runAction(
                            "payment.transition",
                            p.id,
                            { status: "cancelled" },
                            { requireNote: true, title: "Cancel Escrow Payment" }
                          )
                        }
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  const renderStatusSection = (
    title: string,
    rows: Array<Record<string, any>>,
    action: string,
    statuses: string[]
  ) => (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Operational control with mandatory action note.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-400">
              <th className="p-2">ID</th>
              <th className="p-2">Details</th>
              <th className="p-2">Actors</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-900">
                <td className="p-2 font-mono text-xs">{row.id}</td>
                <td className="p-2">{row.title || row.request_id || row.offer_id || "-"}</td>
                <td className="p-2">{row.creator_handle || `${row.buyer_handle || "-"} -> ${row.seller_handle || "-"}`}</td>
                <td className="p-2">
                  <Select
                    value={String(row.status)}
                    onValueChange={(value) => runAction(action, row.id, value, { requireNote: true })}
                  >
                    <SelectTrigger className="h-8 w-[170px] border-zinc-700 bg-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2 text-zinc-400">{fdate(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  const renderNotifications = () => (
    <div className="space-y-4">
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader><CardTitle>Notification Center</CardTitle><CardDescription>Manual send + follow trigger test.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Input placeholder="recipient user id" value={notificationDraft.recipientId} onChange={(e) => setNotificationDraft((p) => ({ ...p, recipientId: e.target.value }))} className="border-zinc-700 bg-black" />
            <Input placeholder="type" value={notificationDraft.type} onChange={(e) => setNotificationDraft((p) => ({ ...p, type: e.target.value }))} className="border-zinc-700 bg-black" />
            <Input placeholder="title" value={notificationDraft.title} onChange={(e) => setNotificationDraft((p) => ({ ...p, title: e.target.value }))} className="border-zinc-700 bg-black" />
            <Input placeholder="link" value={notificationDraft.link} onChange={(e) => setNotificationDraft((p) => ({ ...p, link: e.target.value }))} className="border-zinc-700 bg-black" />
          </div>
          <Input placeholder="body" value={notificationDraft.body} onChange={(e) => setNotificationDraft((p) => ({ ...p, body: e.target.value }))} className="border-zinc-700 bg-black" />
          <Button onClick={() => runAction("notification.send", notificationDraft.recipientId, notificationDraft, { success: "Notification sent" })} className="bg-white text-black hover:bg-zinc-200">Send Notification</Button>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Input placeholder="follower handle" value={followDraft.followerHandle} onChange={(e) => setFollowDraft((p) => ({ ...p, followerHandle: e.target.value }))} className="border-zinc-700 bg-black" />
            <Input placeholder="target handle" value={followDraft.targetHandle} onChange={(e) => setFollowDraft((p) => ({ ...p, targetHandle: e.target.value }))} className="border-zinc-700 bg-black" />
            <Button variant="outline" className="border-zinc-700" onClick={async () => { try { const res = await adminFetch("/api/admin/notifications/test-follow", { method: "POST", body: JSON.stringify(followDraft) }); const payload = await res.json(); if (!res.ok || !payload?.ok) throw new Error(payload?.error || "Follow test failed"); toast.success("Follow test sent"); } catch (error) { toast.error(error instanceof Error ? error.message : "Follow test failed"); } }}>Test Follow Trigger</Button>
          </div>
        </CardContent>
      </Card>
      <JsonTable title="Notifications" rows={data?.sections.notifications || []} />
    </div>
  );

  const renderProxyOrders = () => (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader><CardTitle>Proxy Orders Operations</CardTitle><CardDescription>Update status, notes, locker/pickup flow.</CardDescription></CardHeader>
      <CardContent className="overflow-auto">
        <table className="w-full min-w-[1200px] text-sm">
          <thead><tr className="border-b border-zinc-800 text-left text-zinc-400"><th className="p-2">Order</th><th className="p-2">Tracking</th><th className="p-2">Product URL</th><th className="p-2">Status</th><th className="p-2">Update Status</th><th className="p-2">Update Message</th><th className="p-2">Action</th></tr></thead>
          <tbody>
            {(data?.sections.proxy_orders || []).map((order: any) => {
              const draft = getProxyDraft(order);
              return (
                <tr key={order.id} className="border-b border-zinc-900">
                  <td className="p-2 font-mono text-xs">{order.id}</td>
                  <td className="p-2">{order.tracking_id}</td>
                  <td className="p-2 max-w-[360px] truncate">{order.product_url}</td>
                  <td className="p-2"><Badge variant="outline">{order.status}</Badge></td>
                  <td className="p-2">
                    <Select
                      value={draft.status}
                      onValueChange={(status) =>
                        setProxyDraftByOrder((prev) => ({
                          ...prev,
                          [order.id]: { ...draft, status },
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 w-[190px] border-zinc-700 bg-black"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {proxyStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input
                      value={draft.message}
                      onChange={(event) =>
                        setProxyDraftByOrder((prev) => ({
                          ...prev,
                          [order.id]: { ...draft, message: event.target.value },
                        }))
                      }
                      placeholder="Internal update message"
                      className="h-8 min-w-[260px] border-zinc-700 bg-black text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-zinc-700"
                      onClick={() => {
                        if (!draft.message.trim()) {
                          toast.error("Update message is required");
                          return;
                        }
                        runAction(
                          "proxyOrder.updateStatus",
                          order.id,
                          { status: draft.status, message: draft.message.trim() },
                          { requireNote: true, title: "Proxy Order Status Update" }
                        );
                      }}
                    >
                      Update
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  const renderConfig = () => (
    <div className="space-y-4">
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle>Config Panel</CardTitle>
          <CardDescription>Runtime admin settings stored in database.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Input
              placeholder="config key (e.g. invite_rules)"
              value={configDraft.key}
              onChange={(e) => setConfigDraft((p) => ({ ...p, key: e.target.value }))}
              className="border-zinc-700 bg-black"
            />
            <Input
              placeholder='JSON value (e.g. {"seller_review_required":true})'
              value={configDraft.value}
              onChange={(e) => setConfigDraft((p) => ({ ...p, value: e.target.value }))}
              className="border-zinc-700 bg-black"
            />
            <Input
              placeholder="description"
              value={configDraft.description}
              onChange={(e) => setConfigDraft((p) => ({ ...p, description: e.target.value }))}
              className="border-zinc-700 bg-black"
            />
          </div>
          <Button
            onClick={() => {
              try {
                const parsed = JSON.parse(configDraft.value || "{}");
                runAction(
                  "config.set",
                  configDraft.key,
                  { key: configDraft.key, value: parsed, description: configDraft.description },
                  { requireNote: true, success: "Config updated" }
                );
              } catch {
                toast.error("Config value must be valid JSON");
              }
            }}
            className="bg-white text-black hover:bg-zinc-200"
          >
            Save Config
          </Button>
        </CardContent>
      </Card>
      <JsonTable title="Admin Settings" rows={data?.sections.config?.admin_settings || []} />
      <JsonTable title="Support Matrix" rows={data?.sections.config?.support_matrix || []} />
      <JsonTable title="Networks" rows={data?.sections.config?.networks || []} />
      <JsonTable title="Currencies" rows={data?.sections.config?.currencies || []} />
    </div>
  );

  const title = sectionList.find((section) => section.key === active)?.label || "Overview";
  const routeBase = pathname?.startsWith("/admin") ? "/admin" : "/admintest";
  const sectionByKey = new Map(sectionList.map((section) => [section.key, section]));
  const sectionUrl = (key: SectionKey) => {
    const section = sectionByKey.get(key);
    if (!section) return routeBase;
    return section.slug ? `${routeBase}/${section.slug}` : routeBase;
  };

  const sidebarGroups: Array<{ label: string; items: Array<{ key: SectionKey; label?: string }> }> = [
    { label: "Overview", items: [{ key: "overview" }] },
    { label: "Admin Activity", items: [{ key: "admin_activity", label: "Users and Requests" }] },
    { label: "Users", items: [{ key: "users" }, { key: "sellers" }, { key: "wallets" }] },
    { label: "Marketplace", items: [{ key: "requests" }, { key: "offers" }, { key: "deals" }, { key: "escrow" }] },
    { label: "Documents", items: [{ key: "payment_intents" }, { key: "ledger" }, { key: "disputes" }] },
    { label: "Messages", items: [{ key: "messages" }, { key: "notifications" }] },
    { label: "Proxy Orders", items: [{ key: "proxy_orders" }] },
    { label: "More", items: [{ key: "invites" }, { key: "audit" }, { key: "risk" }, { key: "system" }, { key: "config" }] },
  ];

  const globalResultSummary = globalResults
    ? Object.entries(globalResults)
        .map(([key, rows]) => `${key}:${rows.length}`)
        .join(" | ")
    : "";

  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as CSSProperties
        }
      >
        <Sidebar variant="inset" collapsible="offcanvas" className="border-r border-zinc-900">
          <SidebarHeader className="border-b border-zinc-900">
            <Link href={routeBase} className="flex items-center gap-2 rounded-md px-1 py-1.5">
              <Image src="/logowhite.svg" alt="WhatnotMarket logo" width={28} height={28} className="h-7 w-7 object-contain" />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold">WhatnotMarket</span>
                <span className="text-[11px] uppercase tracking-wide text-zinc-500">Admin</span>
              </div>
            </Link>
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search everything..."
                  className="h-9 border-zinc-700 bg-black pl-8 text-sm"
                />
              </div>
              <Button
                onClick={() => loadDashboard(true)}
                className="h-8 w-full rounded-lg bg-white text-xs font-bold text-black hover:bg-zinc-200"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
                Refresh
              </Button>
            </div>
            {globalResultSummary ? (
              <div className="rounded border border-zinc-800 bg-zinc-950 p-2 text-[11px] text-zinc-300">
                {globalResultSummary}
              </div>
            ) : null}
          </SidebarHeader>
          <SidebarContent>
            {sidebarGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const section = sectionByKey.get(item.key);
                      if (!section) return null;
                      return (
                        <SidebarMenuItem key={item.key}>
                          <SidebarMenuButton
                            asChild
                            isActive={active === item.key}
                            className="data-[active=true]:bg-zinc-100 data-[active=true]:font-semibold data-[active=true]:text-black"
                          >
                            <Link href={sectionUrl(item.key)}>
                              {section.icon}
                              <span>{item.label || section.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
            <SidebarGroup className="mt-auto">
              <SidebarGroupLabel>Utility</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={routeBase === "/admin" ? "/admintest" : "/admin"}>
                        <ShieldAlert />
                        <span>{routeBase === "/admin" ? "Open Admin Test" : "Open Admin"}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <SiteHeader title={title} subtitle="Control center linked to real admin actions" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <main className="space-y-4 px-4 md:px-6">
                  {loading && !data ? <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-zinc-300" /></div> : null}
                  {!loading && data ? (
                    <>
                {active === "overview" && renderOverview()}
                {active === "admin_activity" && renderAdminActivity()}
                {active === "users" && renderUsers()}
                {active === "sellers" && (
                  <Card className="border-zinc-800 bg-zinc-950">
                    <CardHeader><CardTitle>Sellers & Verifications</CardTitle><CardDescription>Manage issued/used/expired verification flow.</CardDescription></CardHeader>
                    <CardContent className="overflow-auto">
                      <table className="w-full min-w-[1100px] text-sm">
                        <thead><tr className="border-b border-zinc-800 text-left text-zinc-400"><th className="p-2">Verification</th><th className="p-2">Telegram</th><th className="p-2">Status</th><th className="p-2">User</th><th className="p-2">Issued</th><th className="p-2">Expires</th></tr></thead>
                        <tbody>
                          {(data.sections.seller_verifications || []).map((row: any) => (
                            <tr key={row.id} className="border-b border-zinc-900">
                              <td className="p-2 font-mono text-xs">{short(row.id)}</td>
                              <td className="p-2">{row.telegram_username || "-"} <span className="text-zinc-500">{row.telegram_user_id || ""}</span></td>
                              <td className="p-2">
                                <Select value={String(row.status)} onValueChange={(v) => runAction("sellerVerification.setStatus", row.id, v)}>
                                  <SelectTrigger className="h-8 w-[140px] border-zinc-700 bg-black"><SelectValue /></SelectTrigger>
                                  <SelectContent><SelectItem value="issued">issued</SelectItem><SelectItem value="used">used</SelectItem><SelectItem value="expired">expired</SelectItem></SelectContent>
                                </Select>
                              </td>
                              <td className="p-2">{row.used_by_handle || "-"}</td>
                              <td className="p-2 text-zinc-400">{fdate(row.issued_at)}</td>
                              <td className="p-2 text-zinc-400">{fdate(row.expires_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                )}
                {active === "wallets" && (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Card className="border-zinc-800 bg-zinc-950">
                      <CardHeader><CardTitle>Wallets</CardTitle><CardDescription>Manual unlink wallet ownership.</CardDescription></CardHeader>
                      <CardContent className="overflow-auto">
                        <table className="w-full min-w-[700px] text-sm">
                          <thead><tr className="border-b border-zinc-800 text-left text-zinc-400"><th className="p-2">Wallet</th><th className="p-2">User</th><th className="p-2">Provider</th><th className="p-2">Action</th></tr></thead>
                          <tbody>
                            {(data.sections.wallets || []).map((wallet: any) => (
                              <tr key={wallet.id} className="border-b border-zinc-900">
                                <td className="p-2 font-mono text-xs">{wallet.chain}:{wallet.address}</td>
                                <td className="p-2">{short(wallet.user_id)}</td>
                                <td className="p-2">{wallet.provider}</td>
                                <td className="p-2"><Button size="sm" variant="outline" className="border-red-800 text-red-300" onClick={() => runAction("wallet.unlink", wallet.id, null, { requireNote: true })}>Unlink</Button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                    <Card className="border-zinc-800 bg-zinc-950">
                      <CardHeader><CardTitle>Bridge Identities</CardTitle><CardDescription>Manual unlink provider identity.</CardDescription></CardHeader>
                      <CardContent className="overflow-auto">
                        <table className="w-full min-w-[700px] text-sm">
                          <thead><tr className="border-b border-zinc-800 text-left text-zinc-400"><th className="p-2">Subject</th><th className="p-2">Provider</th><th className="p-2">User</th><th className="p-2">Action</th></tr></thead>
                          <tbody>
                            {(data.sections.identities || []).map((identity: any) => (
                              <tr key={identity.auth_subject} className="border-b border-zinc-900">
                                <td className="p-2 font-mono text-xs">{identity.auth_subject}</td>
                                <td className="p-2">{identity.provider}</td>
                                <td className="p-2">{short(identity.supabase_user_id)}</td>
                                <td className="p-2"><Button size="sm" variant="outline" className="border-red-800 text-red-300" onClick={() => runAction("identity.unlink", identity.auth_subject, null, { requireNote: true })}>Unlink</Button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {active === "requests" &&
                  renderStatusSection("Requests", data.sections.requests || [], "request.setStatus", [
                    "open",
                    "accepted",
                    "closed",
                  ])}
                {active === "offers" &&
                  renderStatusSection("Offers", data.sections.offers || [], "offer.setStatus", [
                    "pending",
                    "accepted",
                    "rejected",
                  ])}
                {active === "deals" &&
                  renderStatusSection("Deals", data.sections.deals || [], "deal.setStatus", [
                    "verification",
                    "completed",
                    "cancelled",
                  ])}
                {active === "escrow" && renderEscrow()}
                {active === "payment_intents" && <JsonTable title="Payment Intents" rows={data.sections.payment_intents || []} />}
                {active === "ledger" && <JsonTable title="Ledger Entries" rows={data.sections.ledger_entries || []} />}
                {active === "disputes" && <JsonTable title="Disputes" rows={data.sections.disputes || []} />}
                {active === "messages" && <JsonTable title="Messages & Moderation" rows={data.sections.messages || []} />}
                {active === "notifications" && renderNotifications()}
                {active === "proxy_orders" && renderProxyOrders()}
                {active === "invites" && (
                  <div className="space-y-4">
                    <Card className="border-zinc-800 bg-zinc-950">
                      <CardHeader>
                        <CardTitle>Invite Management</CardTitle>
                        <CardDescription>Create / revoke / delete invites</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                          <Input
                            placeholder="Code (e.g. SELLER-01)"
                            value={inviteDraft.code}
                            onChange={(event) =>
                              setInviteDraft((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
                            }
                            className="border-zinc-700 bg-black"
                          />
                          <Select
                            value={inviteDraft.type}
                            onValueChange={(value) => setInviteDraft((prev) => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger className="border-zinc-700 bg-black"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buyer">buyer</SelectItem>
                              <SelectItem value="seller">seller</SelectItem>
                              <SelectItem value="founder">founder</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Usage limit (optional)"
                            value={inviteDraft.usageLimit}
                            onChange={(event) =>
                              setInviteDraft((prev) => ({ ...prev, usageLimit: event.target.value }))
                            }
                            className="border-zinc-700 bg-black"
                          />
                          <Input
                            placeholder="Expires at ISO (optional)"
                            value={inviteDraft.expiresAt}
                            onChange={(event) =>
                              setInviteDraft((prev) => ({ ...prev, expiresAt: event.target.value }))
                            }
                            className="border-zinc-700 bg-black"
                          />
                          <Button
                            variant={inviteDraft.singleUse ? "default" : "outline"}
                            className={
                              inviteDraft.singleUse
                                ? "border-zinc-700 bg-white text-black hover:bg-zinc-200"
                                : "border-zinc-700"
                            }
                            onClick={() =>
                              setInviteDraft((prev) => ({ ...prev, singleUse: !prev.singleUse }))
                            }
                          >
                            {inviteDraft.singleUse ? "Single-use: ON" : "Single-use: OFF"}
                          </Button>
                        </div>
                        <Button
                          className="bg-white text-black hover:bg-zinc-200"
                          onClick={() => {
                            const code = inviteDraft.code.trim().toUpperCase();
                            if (!code) {
                              toast.error("Invite code is required");
                              return;
                            }
                            const usageLimitRaw = inviteDraft.usageLimit.trim();
                            const usageLimit =
                              usageLimitRaw.length > 0 ? Number(usageLimitRaw) : null;
                            if (
                              usageLimit !== null &&
                              (!Number.isFinite(usageLimit) || usageLimit <= 0)
                            ) {
                              toast.error("Usage limit must be a positive number");
                              return;
                            }

                            runAction(
                              "invite.create",
                              code,
                              {
                                code,
                                type: inviteDraft.type,
                                single_use: inviteDraft.singleUse,
                                usage_limit: usageLimit,
                                expires_at: inviteDraft.expiresAt.trim() || null,
                              },
                              {
                                success: "Invite created",
                                requireNote: true,
                                title: "Create Invite Code",
                              }
                            );
                          }}
                        >
                          Create Invite
                        </Button>
                      </CardContent>
                    </Card>
                    <Card className="border-zinc-800 bg-zinc-950">
                      <CardContent className="overflow-auto pt-6">
                        <table className="w-full min-w-[1000px] text-sm">
                          <thead>
                            <tr className="border-b border-zinc-800 text-left text-zinc-400">
                              <th className="p-2">Code</th><th className="p-2">Type</th><th className="p-2">Status</th><th className="p-2">Usage</th><th className="p-2">Last used</th><th className="p-2">Expires</th><th className="p-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(data.sections.invites || []).map((invite: any) => (
                              <tr key={invite.code} className="border-b border-zinc-900">
                                <td className="p-2 font-mono">{invite.code}</td>
                                <td className="p-2">{invite.type || "buyer"}</td>
                                <td className="p-2"><Badge variant="outline">{invite.status}</Badge></td>
                                <td className="p-2">{invite.usage_count || 0}{invite.usage_limit ? ` / ${invite.usage_limit}` : ""}{invite.single_use ? " (single)" : ""}</td>
                                <td className="p-2">{fdate(invite.last_used_at)} {invite.last_used_by_handle ? `- ${invite.last_used_by_handle}` : ""}</td>
                                <td className="p-2">{fdate(invite.expires_at)}</td>
                                <td className="p-2">
                                  <div className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => runAction("invite.setStatus", invite.code, { code: invite.code, status: "active" }, { requireNote: true })}>Activate</Button>
                                    <Button size="sm" variant="outline" className="border-red-800 text-red-300" onClick={() => runAction("invite.setStatus", invite.code, { code: invite.code, status: "revoked" }, { requireNote: true })}>Revoke</Button>
                                    <Button size="sm" variant="outline" className="border-red-800 text-red-300" onClick={() => runAction("invite.delete", invite.code, null, { requireNote: true })}>Delete</Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                    <JsonTable title="Invite Usages" rows={data.sections.invite_usages || []} />
                  </div>
                )}
                {active === "audit" && <JsonTable title="Audit Logs" rows={data.sections.audit_logs || []} />}
                {active === "risk" && <JsonTable title="Risk Signals" rows={[...(data.sections.risk?.reused_wallets || []), ...(data.sections.risk?.duplicate_telegrams || []), ...(data.sections.risk?.duplicate_emails || []), ...(data.sections.risk?.suspicious_providers || []), ...(data.sections.risk?.high_risk_messages || [])]} />}
                {active === "system" && <JsonTable title="System Health" rows={Object.entries(data.sections.system || {}).map(([key, value]) => ({ key, value }))} />}
                {active === "config" && renderConfig()}
              </>
            ) : null}
                </main>
              </div>
            </div>
          </div>
          <Modal
            isOpen={Boolean(pendingNoteAction)}
            onClose={() => {
              if (submittingNoteAction) return;
              setPendingNoteAction(null);
              setPendingNoteText("");
            }}
            title={pendingNoteAction?.title || "Admin Action Note"}
          >
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                Add a mandatory internal reason for this sensitive action.
              </p>
              <textarea
                value={pendingNoteText}
                onChange={(event) => setPendingNoteText(event.target.value)}
                placeholder="Write internal note / reason..."
                className="min-h-[120px] w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm outline-none ring-offset-black focus:border-zinc-500"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-zinc-700"
                  onClick={() => {
                    if (submittingNoteAction) return;
                    setPendingNoteAction(null);
                    setPendingNoteText("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-white text-black hover:bg-zinc-200"
                  disabled={submittingNoteAction || pendingNoteText.trim().length < 3}
                  onClick={submitPendingAction}
                >
                  {submittingNoteAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirm Action
                </Button>
              </div>
            </div>
          </Modal>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

