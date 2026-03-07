"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
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
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

type SectionKey =
  | "overview"
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

  const runAction = async (
    action: string,
    targetId: string,
    value?: unknown,
    options?: { requireNote?: boolean; success?: string }
  ) => {
    const needNote = options?.requireNote ?? false;
    const note = needNote ? window.prompt("Nota interna obbligatoria")?.trim() || "" : "";
    if (needNote && note.length < 3) {
      toast.error("Nota obbligatoria (min 3 caratteri)");
      return;
    }
    try {
      const res = await adminFetch("/api/admin/dashboard/action", {
        method: "POST",
        body: JSON.stringify({ action, targetId, value: value ?? null, note }),
      });
      const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || "Action failed");
      toast.success(options?.success || "Action completed");
      await loadDashboard(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
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
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle>Trend (30 days)</CardTitle>
          <CardDescription>Users, requests, deals, payments.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[320px] w-full">
            <AreaChart data={data?.charts.activity || []}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={0.08} fill="#3b82f6" strokeWidth={2} />
              <Area type="monotone" dataKey="requests" stroke="#22c55e" fillOpacity={0.08} fill="#22c55e" strokeWidth={2} />
              <Area type="monotone" dataKey="deals" stroke="#a855f7" fillOpacity={0} strokeWidth={2} />
              <Area type="monotone" dataKey="payments" stroke="#f59e0b" fillOpacity={0} strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader>
            <CardTitle>Payments By Status</CardTitle>
            <CardDescription>Escrow pipeline health.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ value: { label: "Payments", color: "#22c55e" } }}
              className="h-[280px] w-full"
            >
              <BarChart data={data?.charts.payment_status || []}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="status" tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader>
            <CardTitle>Ledger Flow</CardTitle>
            <CardDescription>Amounts by ledger type.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ value: { label: "Amount", color: "#f59e0b" } }}
              className="h-[280px] w-full"
            >
              <BarChart data={data?.charts.ledger_flow || []}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="type" tickLine={false} axisLine={false} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

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
                <td className="p-2"><div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => runAction("payment.transition", p.id, { status: "awaiting_release" }, { requireNote: true })}>Queue</Button>
                  <Button size="sm" className="bg-emerald-500 text-black hover:bg-emerald-400" onClick={() => { const tx = window.prompt("Tx hash out")?.trim() || ""; if (!tx) return; runAction("payment.transition", p.id, { status: "released", txHashOut: tx }, { requireNote: true }); }}>Release</Button>
                  <Button size="sm" variant="outline" className="border-red-800 text-red-300" onClick={() => runAction("payment.transition", p.id, { status: "failed" }, { requireNote: true })}>Fail</Button>
                  <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => runAction("payment.transition", p.id, { status: "cancelled" }, { requireNote: true })}>Cancel</Button>
                </div></td>
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
          <thead><tr className="border-b border-zinc-800 text-left text-zinc-400"><th className="p-2">Order</th><th className="p-2">Tracking</th><th className="p-2">Product URL</th><th className="p-2">Status</th><th className="p-2">Action</th></tr></thead>
          <tbody>
            {(data?.sections.proxy_orders || []).map((order: any) => (
              <tr key={order.id} className="border-b border-zinc-900">
                <td className="p-2 font-mono text-xs">{order.id}</td><td className="p-2">{order.tracking_id}</td>
                <td className="p-2 max-w-[360px] truncate">{order.product_url}</td><td className="p-2"><Badge variant="outline">{order.status}</Badge></td>
                <td className="p-2"><Button size="sm" variant="outline" className="border-zinc-700" onClick={() => { const status = window.prompt("New status (CREATED,PLACED,PROCESSING,LOCKER_ASSIGNED,READY_FOR_PICKUP,PICKED_UP,COMPLETED,CANCELLED)")?.trim() || ""; if (!status) return; const message = window.prompt("Update message")?.trim() || ""; if (!message) return; runAction("proxyOrder.updateStatus", order.id, { status, message }, { requireNote: true }); }}>Update</Button></td>
              </tr>
            ))}
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
  const navMainItems = sectionList.slice(0, 8).map((section) => ({
    title: section.label,
    url: section.slug ? `${routeBase}/${section.slug}` : routeBase,
    icon: section.icon,
    isActive: active === section.key,
  }));
  const documentItems = sectionList.slice(8, 14).map((section) => ({
    name: section.label,
    url: section.slug ? `${routeBase}/${section.slug}` : routeBase,
    icon: section.icon,
  }));
  const navSecondaryItems = [
    ...sectionList.slice(14).map((section) => ({
      title: section.label,
      url: section.slug ? `${routeBase}/${section.slug}` : routeBase,
      icon: section.icon,
    })),
    {
      title: routeBase === "/admin" ? "Open Admin Test" : "Open Admin",
      url: routeBase === "/admin" ? "/admintest" : "/admin",
      icon: <ShieldAlert />,
    },
  ];

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
        <AppSidebar
          variant="inset"
          brandName="Whatnot Admin"
          brandHref={routeBase}
          navMainItems={navMainItems}
          documentItems={documentItems}
          navSecondaryItems={navSecondaryItems}
          showQuickCreate={false}
          user={{
            name: "Admin Console",
            email: "admin@whatnotmarket.local",
            avatar: "/avatars/shadcn.jpg",
          }}
        />
        <SidebarInset>
          <SiteHeader title={title} subtitle="Template dashboard + real /admin data/actions" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <SectionCards metrics={data?.metrics} />
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive activityData={data?.charts.activity} />
                </div>
                <div className="px-4 lg:px-6">
                  <Card className="border-zinc-800 bg-zinc-950">
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="w-full max-w-md">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                            <Input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="Search everything..." className="h-9 border-zinc-700 bg-black pl-8 text-sm" />
                          </div>
                        </div>
                        <Button onClick={() => loadDashboard(true)} className="rounded-xl border-0 bg-white px-4 font-bold text-black hover:bg-zinc-200" disabled={loading}>
                          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh
                        </Button>
                      </div>
                      {globalResults ? <div className="mt-2 rounded border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-300">{Object.entries(globalResults).map(([key, rows]) => `${key}:${rows.length}`).join(" | ")}</div> : null}
                    </CardContent>
                  </Card>
                </div>
                <main className="space-y-4 px-4 md:px-6">
                  {loading && !data ? <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-zinc-300" /></div> : null}
                  {!loading && data ? (
                    <>
                {active === "overview" && renderOverview()}
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
                    <Card className="border-zinc-800 bg-zinc-950"><CardHeader><CardTitle>Invite Management</CardTitle><CardDescription>Create / revoke / delete invites</CardDescription></CardHeader>
                      <CardContent><Button className="bg-white text-black hover:bg-zinc-200" onClick={() => { const code = window.prompt("Invite code")?.trim().toUpperCase() || ""; if (!code) return; const type = (window.prompt("Invite type: buyer | seller | founder")?.trim().toLowerCase() || "buyer"); const singleUse = (window.prompt("Single use? yes/no")?.trim().toLowerCase() || "no") === "yes"; const usageLimitRaw = window.prompt("Usage limit (empty = unlimited)")?.trim() || ""; const usageLimit = usageLimitRaw ? Number(usageLimitRaw) : null; const expiresAt = window.prompt("Expires at ISO (optional)")?.trim() || null; runAction("invite.create", code, { code, type, singleUse, usageLimit, expiresAt }, { success: "Invite created", requireNote: true }); }}>Create Invite</Button></CardContent>
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
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

