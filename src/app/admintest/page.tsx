"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
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
import { adminToast as toast } from "@/lib/notifications";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DashboardData, EscrowDashboardData, ProxyDashboardData, CryptoWalletsPayload, CryptoWallet, User, Deal, Payment, ProxyOrder } from "./types";
import { AdminOverview } from "./components/AdminOverview";

type SectionKey =
  | "search"
  | "overview"
  | "admin_activity"
  | "users"
  | "sellers"
  | "wallets"
  | "crypto_wallets"
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

const sectionList: Array<{ key: SectionKey; slug: string; label: string; icon: React.ReactNode }> = [
  { key: "search", slug: "search", label: "Search Everything", icon: <Search /> },
  { key: "overview", slug: "", label: "Overview", icon: <ShieldCheck /> },
  { key: "admin_activity", slug: "admin-activity", label: "Admin Activity", icon: <BarChart3 /> },
  { key: "users", slug: "users", label: "Users", icon: <Users /> },
  { key: "sellers", slug: "sellers", label: "Sellers & Verifications", icon: <UserCog /> },
  { key: "wallets", slug: "wallets", label: "Wallets & Identities", icon: <Wallet /> },
  { key: "crypto_wallets", slug: "crypto-wallets", label: "Crypto Wallets", icon: <Wallet /> },
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

function prettyCategoryLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toQueryString(input: Record<string, string | number | null | undefined>) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    const stringValue = String(value).trim();
    if (!stringValue) return;
    params.set(key, stringValue);
  });
  return params.toString();
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTab, setSearchTab] = useState("users");
  const [globalResults, setGlobalResults] = useState<Record<string, Array<Record<string, any>>> | null>(null);
  const [escrowData, setEscrowData] = useState<EscrowDashboardData | null>(null);
  const [escrowLoading, setEscrowLoading] = useState(false);
  const [escrowFilters, setEscrowFilters] = useState({
    q: "",
    status: "all",
    chain: "",
    currency: "",
    user: "",
    listing: "",
    deal: "",
  });
  const [proxyData, setProxyData] = useState<ProxyDashboardData | null>(null);
  const [proxyLoading, setProxyLoading] = useState(false);
  const [proxyFilters, setProxyFilters] = useState({
    q: "",
    status: "ALL",
    tracking: "",
    telegram: "",
    product: "",
  });
  const [cryptoWalletsData, setCryptoWalletsData] = useState<CryptoWalletsPayload | null>(null);
  const [cryptoWalletsLoading, setCryptoWalletsLoading] = useState(false);
  const [savingCryptoWallet, setSavingCryptoWallet] = useState(false);
  const [cryptoWalletDraft, setCryptoWalletDraft] = useState({
    id: "",
    label: "",
    network: "",
    currency: "",
    address: "",
    memo_tag: "",
    notes: "",
    is_active: true,
  });
  const [notificationDraft, setNotificationDraft] = useState({
    recipientId: "",
    type: "admin_manual",
    title: "",
    body: "",
    link: "",
  });
  const [followDraft, setFollowDraft] = useState({ followerHandle: "", targetHandle: "swaprmarket" });
  const [configDraft, setConfigDraft] = useState({ key: "", value: "{}", description: "" });
  const [inviteDraft, setInviteDraft] = useState({
    code: "",
    type: "buyer",
    singleUse: false,
    usageLimit: "",
    expiresAt: "",
  });
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
      setLastRefreshedAt(new Date().toISOString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const performGlobalSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setGlobalResults(null);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await adminFetch(`/api/admin/dashboard/search?q=${encodeURIComponent(q)}`);
      const payload = (await res.json().catch(() => null)) as
        | { results?: Record<string, Array<Record<string, any>>>; error?: string }
        | null;
      if (!res.ok || !payload || payload.error) throw new Error(payload?.error || "Search failed");
      setGlobalResults(payload.results || null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const loadEscrow = useCallback(async (silent = false) => {
    if (!silent) setEscrowLoading(true);
    try {
      const queryString = toQueryString({
        q: escrowFilters.q,
        status: escrowFilters.status,
        chain: escrowFilters.chain,
        currency: escrowFilters.currency,
        user: escrowFilters.user,
        listing: escrowFilters.listing,
        deal: escrowFilters.deal,
        limit: 250,
      });
      const res = await adminFetch(`/api/admin/dashboard/escrow${queryString ? `?${queryString}` : ""}`);
      const payload = (await res.json().catch(() => null)) as
        | (EscrowDashboardData & { error?: string })
        | null;
      if (!res.ok || !payload || payload.error) throw new Error(payload?.error || "Unable to load escrow dashboard");
      setEscrowData(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load escrow dashboard");
    } finally {
      setEscrowLoading(false);
    }
  }, [
    escrowFilters.q,
    escrowFilters.status,
    escrowFilters.chain,
    escrowFilters.currency,
    escrowFilters.user,
    escrowFilters.listing,
    escrowFilters.deal,
  ]);

  const loadProxyOrders = useCallback(async (silent = false) => {
    if (!silent) setProxyLoading(true);
    try {
      const queryString = toQueryString({
        q: proxyFilters.q,
        status: proxyFilters.status,
        tracking: proxyFilters.tracking,
        telegram: proxyFilters.telegram,
        product: proxyFilters.product,
        limit: 250,
      });
      const res = await adminFetch(`/api/admin/dashboard/proxy-orders${queryString ? `?${queryString}` : ""}`);
      const payload = (await res.json().catch(() => null)) as
        | (ProxyDashboardData & { error?: string })
        | null;
      if (!res.ok || !payload || payload.error) throw new Error(payload?.error || "Unable to load proxy orders");
      setProxyData(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load proxy orders");
    } finally {
      setProxyLoading(false);
    }
  }, [
    proxyFilters.q,
    proxyFilters.status,
    proxyFilters.tracking,
    proxyFilters.telegram,
    proxyFilters.product,
  ]);

  const loadCryptoWallets = useCallback(async (silent = false) => {
    if (!silent) setCryptoWalletsLoading(true);
    try {
      const res = await adminFetch("/api/admin/dashboard/crypto-wallets");
      const payload = (await res.json().catch(() => null)) as
        | (CryptoWalletsPayload & { error?: string })
        | null;
      if (!res.ok || !payload || payload.error) {
        throw new Error(payload?.error || "Unable to load crypto wallets");
      }
      setCryptoWalletsData(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load crypto wallets");
    } finally {
      setCryptoWalletsLoading(false);
    }
  }, []);

  const refreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadDashboard(true),
        loadEscrow(true),
        loadProxyOrders(true),
        loadCryptoWallets(true),
        globalSearch.trim().length >= 2 ? performGlobalSearch(globalSearch) : Promise.resolve(),
      ]);
      const nowIso = new Date().toISOString();
      setLastRefreshedAt(nowIso);
      toast.success("Dashboard refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const q = globalSearch.trim();
    if (q.length < 2) {
      setGlobalResults(null);
      return;
    }
    const timer = setTimeout(() => {
      void performGlobalSearch(q);
    }, 250);
    return () => clearTimeout(timer);
  }, [globalSearch, performGlobalSearch]);

  useEffect(() => {
    if (active !== "escrow") return;
    const timer = setTimeout(() => {
      void loadEscrow();
    }, 250);
    return () => clearTimeout(timer);
  }, [active, loadEscrow]);

  useEffect(() => {
    if (active !== "proxy_orders") return;
    const timer = setTimeout(() => {
      void loadProxyOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [active, loadProxyOrders]);

  useEffect(() => {
    if (active !== "crypto_wallets") return;
    void loadCryptoWallets();
  }, [active, loadCryptoWallets]);

  useEffect(() => {
    if (!globalResults) return;
    const firstNonEmpty = Object.entries(globalResults).find(([, rows]) => Array.isArray(rows) && rows.length > 0);
    if (firstNonEmpty) {
      setSearchTab(firstNonEmpty[0]);
    }
  }, [globalResults]);

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
      await Promise.all([loadDashboard(true), loadEscrow(true), loadProxyOrders(true), loadCryptoWallets(true)]);
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

  const saveCryptoWallet = async () => {
    const network = cryptoWalletDraft.network.trim();
    const currency = cryptoWalletDraft.currency.trim();
    const address = cryptoWalletDraft.address.trim();

    if (!network || !currency || !address) {
      toast.error("Network, currency and address are required");
      return;
    }

    setSavingCryptoWallet(true);
    try {
      const res = await adminFetch("/api/admin/dashboard/crypto-wallets", {
        method: "POST",
        body: JSON.stringify({
          id: cryptoWalletDraft.id || undefined,
          label: cryptoWalletDraft.label,
          network,
          currency,
          address,
          memo_tag: cryptoWalletDraft.memo_tag,
          notes: cryptoWalletDraft.notes,
          is_active: cryptoWalletDraft.is_active,
          metadata: {},
          note: "updated from admin dashboard",
        }),
      });

      const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || "Unable to save crypto wallet");
      toast.success(cryptoWalletDraft.id ? "Crypto wallet updated" : "Crypto wallet created");
      setCryptoWalletDraft({
        id: "",
        label: "",
        network: "",
        currency: "",
        address: "",
        memo_tag: "",
        notes: "",
        is_active: true,
      });
      await loadCryptoWallets(true);
      await loadDashboard(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save crypto wallet");
    } finally {
      setSavingCryptoWallet(false);
    }
  };

  const deleteCryptoWallet = async (walletId: string) => {
    try {
      const res = await adminFetch(`/api/admin/dashboard/crypto-wallets?id=${encodeURIComponent(walletId)}`, {
        method: "DELETE",
        body: JSON.stringify({ note: "deleted from admin dashboard" }),
      });
      const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || "Unable to delete crypto wallet");
      toast.success("Crypto wallet removed");
      await loadCryptoWallets(true);
      await loadDashboard(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete crypto wallet");
    }
  };

  const filteredUsers = useMemo(() => {
    const users = data?.sections.users || [];
    const q = userSearch.toLowerCase().trim();
    if (!q) return users;
    return users.filter((user) => {
      const wallets = Array.isArray(user.wallets) ? user.wallets.map((w) => String(w.address || "")).join(" ") : "";
      return (
        String(user.id || "").toLowerCase().includes(q) ||
        String(user.email || "").toLowerCase().includes(q) ||
        String(user.username || "").toLowerCase().includes(q) ||
        String(user.telegram_username || user.telegram_user_id || "").toLowerCase().includes(q) ||
        wallets.toLowerCase().includes(q)
      );
    });
  }, [data?.sections.users, userSearch]);

  const searchEntries = useMemo(
    () =>
      Object.entries(globalResults || {}).filter(
        ([, rows]) => Array.isArray(rows) && rows.length > 0
      ),
    [globalResults]
  );

  const escrowChainOptions = useMemo(
    () =>
      Array.from(new Set((escrowData?.payments || []).map((payment) => String(payment.chain || "").trim())))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [escrowData?.payments]
  );

  const escrowCurrencyOptions = useMemo(
    () =>
      Array.from(new Set((escrowData?.payments || []).map((payment) => String(payment.currency || "").trim())))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [escrowData?.payments]
  );

  const renderAdminActivity = () => <ChartAreaInteractive activityData={data?.charts.activity} />;


















  const renderSearchEverything = () => (
    <div className="space-y-4">
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle>Search Everything</CardTitle>
          <CardDescription>
            Global admin lookup across users, payments, deals, proxy orders, moderation, audit and configs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Search user, order, deal, tx hash, wallet, telegram, tracking..."
              className="border-zinc-700 bg-black"
            />
            <Button
              variant="outline"
              className="border-zinc-700"
              onClick={() => performGlobalSearch(globalSearch)}
              disabled={searchLoading || globalSearch.trim().length < 2}
            >
              {searchLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>
          {globalSearch.trim().length < 2 ? (
            <p className="text-sm text-zinc-400">Type at least 2 characters to start global search.</p>
          ) : null}
          {searchEntries.length > 0 ? (
            <Tabs value={searchTab} onValueChange={setSearchTab} className="space-y-3">
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-zinc-900 p-2">
                {searchEntries.map(([key, rows]) => (
                  <TabsTrigger key={key} value={key} className="data-[state=active]:bg-white data-[state=active]:text-black">
                    {prettyCategoryLabel(key)} ({rows.length})
                  </TabsTrigger>
                ))}
              </TabsList>
              {searchEntries.map(([key, rows]) => (
                <TabsContent key={key} value={key}>
                  <JsonTable title={prettyCategoryLabel(key)} rows={rows} />
                </TabsContent>
              ))}
            </Tabs>
          ) : globalSearch.trim().length >= 2 && !searchLoading ? (
            <p className="text-sm text-zinc-400">No results for this query.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );

  const renderCryptoWallets = () => (
    <div className="space-y-4">
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle>Crypto Wallet Vault</CardTitle>
          <CardDescription>Manage operational wallets per network/currency with editable addresses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <Input
              placeholder="Label (optional)"
              value={cryptoWalletDraft.label}
              onChange={(event) => setCryptoWalletDraft((prev) => ({ ...prev, label: event.target.value }))}
              className="border-zinc-700 bg-black"
            />
            <Input
              placeholder="Network (e.g. ethereum)"
              value={cryptoWalletDraft.network}
              onChange={(event) => setCryptoWalletDraft((prev) => ({ ...prev, network: event.target.value }))}
              className="border-zinc-700 bg-black"
            />
            <Input
              placeholder="Currency (e.g. USDT)"
              value={cryptoWalletDraft.currency}
              onChange={(event) => setCryptoWalletDraft((prev) => ({ ...prev, currency: event.target.value }))}
              className="border-zinc-700 bg-black"
            />
            <Input
              placeholder="Address"
              value={cryptoWalletDraft.address}
              onChange={(event) => setCryptoWalletDraft((prev) => ({ ...prev, address: event.target.value }))}
              className="border-zinc-700 bg-black"
            />
            <Input
              placeholder="Memo/tag (optional)"
              value={cryptoWalletDraft.memo_tag}
              onChange={(event) => setCryptoWalletDraft((prev) => ({ ...prev, memo_tag: event.target.value }))}
              className="border-zinc-700 bg-black"
            />
            <Input
              placeholder="Internal notes (optional)"
              value={cryptoWalletDraft.notes}
              onChange={(event) => setCryptoWalletDraft((prev) => ({ ...prev, notes: event.target.value }))}
              className="border-zinc-700 bg-black lg:col-span-2"
            />
            <Button
              variant={cryptoWalletDraft.is_active ? "default" : "outline"}
              className={
                cryptoWalletDraft.is_active
                  ? "bg-white text-black hover:bg-zinc-200"
                  : "border-zinc-700"
              }
              onClick={() =>
                setCryptoWalletDraft((prev) => ({ ...prev, is_active: !prev.is_active }))
              }
            >
              {cryptoWalletDraft.is_active ? "Active wallet" : "Inactive wallet"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={saveCryptoWallet}
              className="bg-white text-black hover:bg-zinc-200"
              disabled={savingCryptoWallet}
            >
              {savingCryptoWallet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {cryptoWalletDraft.id ? "Update wallet" : "Add wallet"}
            </Button>
            {cryptoWalletDraft.id ? (
              <Button
                variant="outline"
                className="border-zinc-700"
                onClick={() =>
                  setCryptoWalletDraft({
                    id: "",
                    label: "",
                    network: "",
                    currency: "",
                    address: "",
                    memo_tag: "",
                    notes: "",
                    is_active: true,
                  })
                }
              >
                Cancel edit
              </Button>
            ) : null}
          </div>
          {cryptoWalletsData?.warning ? (
            <p className="rounded border border-amber-700/40 bg-amber-950/30 p-2 text-xs text-amber-300">
              {cryptoWalletsData.warning}
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Card className="border-zinc-800 bg-zinc-950">
        <CardContent className="overflow-auto pt-6">
          {cryptoWalletsLoading ? (
            <div className="flex min-h-[180px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
            </div>
          ) : (
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-400">
                  <th className="p-2">Label</th>
                  <th className="p-2">Network</th>
                  <th className="p-2">Currency</th>
                  <th className="p-2">Address</th>
                  <th className="p-2">Memo</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Updated</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(cryptoWalletsData?.wallets || []).map((wallet) => (
                  <tr key={wallet.id} className="border-b border-zinc-900">
                    <td className="p-2">{wallet.label || "-"}</td>
                    <td className="p-2">{wallet.network}</td>
                    <td className="p-2">{wallet.currency}</td>
                    <td className="p-2 font-mono text-xs">{wallet.address}</td>
                    <td className="p-2 font-mono text-xs">{wallet.memo_tag || "-"}</td>
                    <td className="p-2"><Badge variant="outline">{wallet.is_active ? "active" : "inactive"}</Badge></td>
                    <td className="p-2 text-xs text-zinc-400">{fdate(wallet.updated_at)}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700"
                          onClick={() =>
                            setCryptoWalletDraft({
                              id: String(wallet.id || ""),
                              label: String(wallet.label || ""),
                              network: String(wallet.network || ""),
                              currency: String(wallet.currency || ""),
                              address: String(wallet.address || ""),
                              memo_tag: String(wallet.memo_tag || ""),
                              notes: String(wallet.notes || ""),
                              is_active: Boolean(wallet.is_active),
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-800 text-red-300"
                          onClick={() => deleteCryptoWallet(String(wallet.id))}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
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
    <div className="space-y-4">
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle>Escrow & Payments</CardTitle>
          <CardDescription>Operational queue with status transitions and tx controls.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-7">
            <Input
              value={escrowFilters.q}
              onChange={(event) => setEscrowFilters((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Search tx hash / escrow ref / payment id"
              className="border-zinc-700 bg-black lg:col-span-2"
            />
            <Select
              value={escrowFilters.status}
              onValueChange={(value) => setEscrowFilters((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="border-zinc-700 bg-black"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all statuses</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="funded_to_escrow">funded_to_escrow</SelectItem>
                <SelectItem value="awaiting_release">awaiting_release</SelectItem>
                <SelectItem value="released">released</SelectItem>
                <SelectItem value="failed">failed</SelectItem>
                <SelectItem value="cancelled">cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={escrowFilters.chain || "all"}
              onValueChange={(value) =>
                setEscrowFilters((prev) => ({ ...prev, chain: value === "all" ? "" : value }))
              }
            >
              <SelectTrigger className="border-zinc-700 bg-black"><SelectValue placeholder="chain" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all chains</SelectItem>
                {escrowChainOptions.map((chain) => (
                  <SelectItem key={chain} value={chain}>
                    {chain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={escrowFilters.currency || "all"}
              onValueChange={(value) =>
                setEscrowFilters((prev) => ({ ...prev, currency: value === "all" ? "" : value }))
              }
            >
              <SelectTrigger className="border-zinc-700 bg-black"><SelectValue placeholder="currency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all currencies</SelectItem>
                {escrowCurrencyOptions.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={escrowFilters.user}
              onChange={(event) => setEscrowFilters((prev) => ({ ...prev, user: event.target.value }))}
              placeholder="User ID"
              className="border-zinc-700 bg-black"
            />
            <Button
              variant="outline"
              className="border-zinc-700"
              onClick={() =>
                setEscrowFilters({
                  q: "",
                  status: "all",
                  chain: "",
                  currency: "",
                  user: "",
                  listing: "",
                  deal: "",
                })
              }
            >
              Clear filters
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Input
              value={escrowFilters.listing}
              onChange={(event) => setEscrowFilters((prev) => ({ ...prev, listing: event.target.value }))}
              placeholder="Listing ID filter"
              className="border-zinc-700 bg-black"
            />
            <Input
              value={escrowFilters.deal}
              onChange={(event) => setEscrowFilters((prev) => ({ ...prev, deal: event.target.value }))}
              placeholder="Deal ID/reference filter"
              className="border-zinc-700 bg-black"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[
              ["Total", escrowData?.metrics?.total_payments || 0],
              ["Queue", escrowData?.metrics?.escrow_queue || 0],
              ["Awaiting release", escrowData?.metrics?.awaiting_release || 0],
              ["Released", escrowData?.metrics?.released || 0],
              ["Failed", escrowData?.metrics?.failed || 0],
              ["Illegal transitions", escrowData?.metrics?.illegal_transitions || 0],
            ].map(([label, value]) => (
              <Card key={String(label)} className="border-zinc-800 bg-black">
                <CardContent className="space-y-1 p-3">
                  <p className="text-xs text-zinc-400">{label}</p>
                  <p className="text-lg font-semibold">{value as any}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border-zinc-800 bg-zinc-950">
        <CardContent className="overflow-auto pt-6">
          {escrowLoading ? (
            <div className="flex min-h-[180px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
            </div>
          ) : (
            <table className="w-full min-w-[1300px] text-sm">
              <thead><tr className="border-b border-zinc-800 text-left text-zinc-400"><th className="p-2">Payment</th><th className="p-2">Users</th><th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">Tx In/Out</th><th className="p-2">Actions</th></tr></thead>
              <tbody>
                {(escrowData?.payments || []).map((p: any) => (
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
          )}
        </CardContent>
      </Card>
    </div>
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
      <JsonTable title="Notifications" rows={(data?.sections.notifications || []) as Record<string, any>[]} />
    </div>
  );

  const renderProxyOrders = () => (
    <div className="space-y-4">
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader><CardTitle>Proxy Orders Operations</CardTitle><CardDescription>Filter, inspect and update lifecycle with internal notes.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
            <Input
              value={proxyFilters.q}
              onChange={(event) => setProxyFilters((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Search id/tracking/url/telegram"
              className="border-zinc-700 bg-black lg:col-span-2"
            />
            <Select
              value={proxyFilters.status}
              onValueChange={(value) => setProxyFilters((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="border-zinc-700 bg-black"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ALL</SelectItem>
                {proxyStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={proxyFilters.tracking}
              onChange={(event) => setProxyFilters((prev) => ({ ...prev, tracking: event.target.value }))}
              placeholder="Tracking ID"
              className="border-zinc-700 bg-black"
            />
            <Input
              value={proxyFilters.telegram}
              onChange={(event) => setProxyFilters((prev) => ({ ...prev, telegram: event.target.value }))}
              placeholder="Telegram username"
              className="border-zinc-700 bg-black"
            />
            <Input
              value={proxyFilters.product}
              onChange={(event) => setProxyFilters((prev) => ({ ...prev, product: event.target.value }))}
              placeholder="Product URL"
              className="border-zinc-700 bg-black"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Total", proxyData?.metrics?.total_orders || 0],
              ["Open", proxyData?.metrics?.open_orders || 0],
              ["Completed", proxyData?.metrics?.completed_orders || 0],
              ["Cancelled", proxyData?.metrics?.cancelled_orders || 0],
            ].map(([label, value]) => (
              <Card key={String(label)} className="border-zinc-800 bg-black">
                <CardContent className="space-y-1 p-3">
                  <p className="text-xs text-zinc-400">{label}</p>
                  <p className="text-lg font-semibold">{value as any}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border-zinc-800 bg-zinc-950">
        <CardContent className="overflow-auto pt-6">
          {proxyLoading ? (
            <div className="flex min-h-[180px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
            </div>
          ) : (
            <table className="w-full min-w-[1200px] text-sm">
              <thead><tr className="border-b border-zinc-800 text-left text-zinc-400"><th className="p-2">Order</th><th className="p-2">Tracking</th><th className="p-2">Product URL</th><th className="p-2">Status</th><th className="p-2">Update Status</th><th className="p-2">Update Message</th><th className="p-2">Action</th></tr></thead>
              <tbody>
                {(proxyData?.orders || []).map((order: any) => {
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
          )}
        </CardContent>
      </Card>
    </div>
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
      <JsonTable title="Admin Settings" rows={(data?.sections.config as any)?.admin_settings || []} />
      <JsonTable title="Support Matrix" rows={(data?.sections.config as any)?.support_matrix || []} />
      <JsonTable title="Networks" rows={(data?.sections.config as any)?.networks || []} />
      <JsonTable title="Currencies" rows={(data?.sections.config as any)?.currencies || []} />
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
    { label: "Search Everything", items: [{ key: "search" }] },
    { label: "Overview", items: [{ key: "overview" }] },
    { label: "Admin Activity", items: [{ key: "admin_activity", label: "Users and Requests" }] },
    { label: "Users", items: [{ key: "users" }, { key: "sellers" }, { key: "wallets" }, { key: "crypto_wallets" }] },
    { label: "Marketplace", items: [{ key: "requests" }, { key: "offers" }, { key: "deals" }, { key: "escrow" }] },
    { label: "Documents", items: [{ key: "payment_intents" }, { key: "ledger" }, { key: "disputes" }] },
    { label: "Messages", items: [{ key: "messages" }, { key: "notifications" }] },
    { label: "Proxy Orders", items: [{ key: "proxy_orders" }] },
    { label: "More", items: [{ key: "invites" }, { key: "audit" }, { key: "risk" }, { key: "system" }, { key: "config" }] },
  ];

  const globalResultSummary = globalResults
    ? Object.entries(globalResults)
        .filter(([, rows]) => rows.length > 0)
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
              <Image src="/logowhite.svg" alt="SwaprMarket logo" width={28} height={28} className="h-7 w-7 object-contain" />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold">SwaprMarket</span>
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
                onClick={refreshAll}
                className="h-8 w-full rounded-lg bg-white text-xs font-bold text-black hover:bg-zinc-200"
                disabled={refreshing}
              >
                {refreshing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
                Refresh
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-8 w-full border-zinc-700 text-xs"
              >
                <Link href={sectionUrl("search")}>Open Search Results</Link>
              </Button>
              {lastRefreshedAt ? (
                <p className="text-[11px] text-zinc-500">Last refresh: {fdate(lastRefreshedAt)}</p>
              ) : null}
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
                {active === "search" && renderSearchEverything()}
                {active === "overview" && <AdminOverview data={data} />}
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
                {active === "crypto_wallets" && renderCryptoWallets()}
                {active === "requests" &&
                  renderStatusSection("Requests", (data.sections.requests as Record<string, any>[]) || [], "request.setStatus", [
                    "open",
                    "accepted",
                    "closed",
                  ])}
                {active === "offers" &&
                  renderStatusSection("Offers", (data.sections.offers as Record<string, any>[]) || [], "offer.setStatus", [
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
                {active === "payment_intents" && <JsonTable title="Payment Intents" rows={(data.sections.payment_intents as Record<string, any>[]) || []} />}
                {active === "ledger" && <JsonTable title="Ledger Entries" rows={data.sections.ledger_entries || []} />}
                {active === "disputes" && <JsonTable title="Disputes" rows={(data.sections.disputes as Record<string, any>[]) || []} />}
                {active === "messages" && <JsonTable title="Messages & Moderation" rows={(data.sections.messages as Record<string, any>[]) || []} />}
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
                    <JsonTable title="Invite Usages" rows={(data.sections.invite_usages as Record<string, any>[]) || []} />
                  </div>
                )}
                {active === "audit" && <JsonTable title="Audit Logs" rows={(data.sections.audit_logs as Record<string, any>[]) || []} />}
                {active === "risk" && <JsonTable title="Risk Signals" rows={[...((data.sections.risk as any)?.reused_wallets || []), ...((data.sections.risk as any)?.duplicate_telegrams || []), ...((data.sections.risk as any)?.duplicate_emails || []), ...((data.sections.risk as any)?.suspicious_providers || []), ...((data.sections.risk as any)?.high_risk_messages || [])]} />}
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


