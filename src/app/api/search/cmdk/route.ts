import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase-admin";

type AnySupabaseClient = SupabaseClient;

type CmdkItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  group: string;
  icon: string;
  entityType?: "product" | "brand" | "category" | "seller" | "collection" | "service" | "page" | "action" | "wallet" | "request";
  keywords: string[];
  badge?: string;
  scoreHint?: number;
  avatarUrl?: string;
  popularity?: number;
  recencyTs?: number;
  conversionScore?: number;
  businessPriority?: number;
  availability?: "in_stock" | "low_stock" | "out_of_stock";
};

type CmdkPayload = {
  query: string;
  items: CmdkItem[];
  predictions: string[];
  trendingSearches: Array<{ query: string; count: number }>;
  generatedAt: string;
  tookMs: number;
};

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  seller_status: string | null;
  wallet_address: string | null;
  avatar_url: string | null;
};

type RequestRow = {
  id: string;
  title: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  payment_method: string | null;
  delivery_time: string | null;
  created_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  icon: string | null;
};

type TopSellerRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  total_deals: number | null;
};

type ActivityRow = {
  user_id: string | null;
  created_at: string;
};

type CacheEntry = {
  expiresAt: number;
  payload: CmdkPayload;
};

type TrendingSnapshot = {
  items: CmdkItem[];
  predictions: string[];
};

type TrendingSearchRow = {
  query: string;
  search_count: number;
};

type CopyWebsiteRow = {
  page: string | null;
  key: string | null;
  content: string | null;
  updated_at: string | null;
};

type DiscoveredRoute = {
  route: string;
  title: string;
};

type SearchScope = "users" | "services" | "products" | "wallet" | "pages" | "verified-sellers";

const QUERY_CACHE_TTL_MS = 12_000;
const TRENDING_TTL_MS = process.env.NODE_ENV === "development" ? 0 : 20_000;
const MAX_QUERY_LENGTH = 72;
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 40;
const VALID_SCOPES = new Set<SearchScope>(["users", "services", "products", "wallet", "pages", "verified-sellers"]);
const ROUTE_DISCOVERY_TTL_MS = process.env.NODE_ENV === "development" ? 0 : 20_000;
const EXCLUDED_ROUTE_PREFIXES = ["/api", "/admin", "/admintest", "/copywebsiteadmin", "/testlogin"];

const queryCache = new Map<string, CacheEntry>();
let trendingCache: { expiresAt: number; snapshot: TrendingSnapshot } | null = null;
let discoveredRouteCache: { expiresAt: number; routes: DiscoveredRoute[] } | null = null;

const STATIC_PREDICTIONS = [
  "users",
  "services",
  "products",
  "wallet address",
  "buy anywhere with crypto",
  "proxy order",
  "trending requests",
  "category",
  "best sellers",
  "venditori verificati",
  "escrow",
  "become affiliate",
  "requests",
  "global chat",
];

const ETH_WALLET_REGEX = /^0x[a-fA-F0-9]{16,}$/;
const TRON_WALLET_REGEX = /^T[1-9A-HJ-NP-Za-km-z]{20,}$/;
const SOL_WALLET_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function normalizeQuery(value: string | null): string {
  return String(value || "").trim().slice(0, MAX_QUERY_LENGTH);
}

function normalizeForFilter(value: string): string {
  return value
    .replace(/[,%()"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 32);
}

function toHandle(profile: Pick<ProfileRow, "username" | "full_name">, id: string): string {
  const username = slugify(String(profile.username || ""));
  if (username) return username;

  const fallback = slugify(String(profile.full_name || ""));
  if (fallback) return fallback;

  return `user_${id.slice(0, 8)}`;
}

function formatBudget(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `$${min} - $${max}`;
  if (min !== null) return `From $${min}`;
  if (max !== null) return `Up to $${max}`;
  return "Budget on request";
}

function looksLikeWallet(query: string): boolean {
  return ETH_WALLET_REGEX.test(query) || TRON_WALLET_REGEX.test(query) || SOL_WALLET_REGEX.test(query);
}

function dedupeItems(items: CmdkItem[]): CmdkItem[] {
  const map = new Map<string, CmdkItem>();
  for (const item of items) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
    if (map.size >= MAX_RESULTS) break;
  }
  return Array.from(map.values());
}

function safeText(value: unknown): string {
  return String(value ?? "").trim();
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function normalizeRoutePath(value: string): string | null {
  const raw = safeText(value);
  if (!raw) return null;

  const base = raw.split(/[?#]/)[0] || "";
  if (!base.startsWith("/")) return null;
  if (base !== "/" && base.endsWith("/")) return base.slice(0, -1);
  return base;
}

function isExcludedRoute(route: string): boolean {
  return EXCLUDED_ROUTE_PREFIXES.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
}

function routeToFallbackTitle(route: string): string {
  if (route === "/") return "Home";
  const tokens = route
    .split("/")
    .filter(Boolean)
    .flatMap((segment) => segment.split("-"))
    .map((segment) => segment.replace(/[[\]().]/g, ""))
    .filter(Boolean);

  if (!tokens.length) return "Page";
  return toTitleCase(tokens.join(" "));
}

function routeFromFileSystemRelative(relativeDir: string): string {
  if (!relativeDir || relativeDir === ".") return "/";
  const segments = relativeDir
    .split(path.sep)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
    .map((segment) => {
      if (segment.startsWith("[[...") && segment.endsWith("]]")) {
        return "";
      }
      if (segment.startsWith("[...") && segment.endsWith("]")) {
        return "all";
      }
      if (segment.startsWith("[") && segment.endsWith("]")) {
        return segment.slice(1, -1);
      }
      return segment;
    })
    .filter(Boolean);

  if (!segments.length) return "/";
  return `/${segments.join("/")}`;
}

function walkPageDirectories(rootDir: string, relative = ".", acc: Set<string>) {
  let entries: string[] = [];
  try {
    entries = readdirSync(path.join(rootDir, relative));
  } catch {
    return;
  }

  const hasPage = entries.includes("page.tsx") || entries.includes("page.ts") || entries.includes("page.jsx");
  if (hasPage) {
    const route = routeFromFileSystemRelative(relative);
    if (!isExcludedRoute(route)) {
      acc.add(route);
    }
  }

  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    if (entry === "node_modules") continue;
    const nextRelative = relative === "." ? entry : path.join(relative, entry);
    const absolutePath = path.join(rootDir, nextRelative);

    let isDirectory = false;
    try {
      isDirectory = statSync(absolutePath).isDirectory();
    } catch {
      isDirectory = false;
    }

    if (!isDirectory) continue;
    walkPageDirectories(rootDir, nextRelative, acc);
  }
}

function discoverAppRoutes(): DiscoveredRoute[] {
  const now = Date.now();
  if (discoveredRouteCache && discoveredRouteCache.expiresAt > now) {
    return discoveredRouteCache.routes;
  }

  const routeSet = new Set<string>();
  const roots = [path.join(process.cwd(), "src", "app"), path.join(process.cwd(), "app")];
  for (const root of roots) {
    walkPageDirectories(root, ".", routeSet);
  }

  const routes = Array.from(routeSet)
    .filter((route) => route.startsWith("/"))
    .sort((a, b) => a.localeCompare(b))
    .map((route) => ({
      route,
      title: routeToFallbackTitle(route),
    }));

  discoveredRouteCache = {
    expiresAt: now + ROUTE_DISCOVERY_TTL_MS,
    routes,
  };

  return routes;
}

function computeQueryBoost(item: CmdkItem, normalizedQuery: string): number {
  if (!normalizedQuery) return item.scoreHint ?? 0;

  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  const keywords = item.keywords.join(" ").toLowerCase();

  let score = item.scoreHint ?? 0;
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (title === token) score += 140;
    else if (title.startsWith(token)) score += 90;
    else if (title.includes(token)) score += 56;

    if (keywords.includes(token)) score += 28;
    if (description.includes(token)) score += 16;
  }

  return score;
}

function buildPredictionTerms(source: string[]): string[] {
  const compact = source
    .map((entry) => entry.trim())
    .filter((entry) => entry.length >= 3)
    .map((entry) => entry.toLowerCase());
  return Array.from(new Set(compact)).slice(0, 30);
}

function filterPredictions(predictions: string[], normalizedQuery: string): string[] {
  if (!normalizedQuery) return predictions.slice(0, 10);

  const filtered = predictions.filter((entry) => entry.includes(normalizedQuery) && entry !== normalizedQuery);
  return filtered.slice(0, 10);
}

function normalizeScope(value: string | null): SearchScope | null {
  const normalized = String(value || "").trim().toLowerCase() as SearchScope;
  return VALID_SCOPES.has(normalized) ? normalized : null;
}

function matchesScope(item: CmdkItem, scope: SearchScope): boolean {
  const group = item.group.toLowerCase();
  const href = item.href.toLowerCase();
  const words = `${item.title} ${item.description} ${item.keywords.join(" ")}`.toLowerCase();

  if (scope === "verified-sellers") {
    return (
      item.badge === "VERIFIED" ||
      group.includes("verified sellers") ||
      words.includes("venditore verificato") ||
      words.includes("verified seller")
    );
  }

  if (scope === "users") {
    return (
      group.includes("users") ||
      group.includes("verified sellers") ||
      group.includes("best sellers") ||
      href.includes("/profile/") ||
      href.includes("/seller/") ||
      words.includes("user") ||
      words.includes("seller") ||
      words.includes("buyer")
    );
  }

  if (scope === "services") {
    return words.includes("service") || words.includes("services") || words.includes("offer");
  }

  if (scope === "products") {
    return (
      words.includes("product") ||
      words.includes("products") ||
      words.includes("listing") ||
      words.includes("marketplace") ||
      group.includes("categories") ||
      href.includes("/category/")
    );
  }

  if (scope === "wallet") {
    return (
      group.includes("wallet") ||
      href.includes("type=wallet") ||
      words.includes("wallet") ||
      words.includes("address") ||
      words.includes("crypto")
    );
  }

  return (
    group.includes("site pages") ||
    group.includes("trust & safety") ||
    words.includes("page") ||
    words.includes("pagine") ||
    words.includes("navigate") ||
    words.includes("menu")
  );
}

function getReadClient(): { client: AnySupabaseClient } {
  try {
    return { client: createAdminClient() };
  } catch {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !anonKey) {
      throw new Error("Supabase search connection is not configured.");
    }

    return {
      client: createSupabaseClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    };
  }
}

async function safeSelect<T>(
  promise: PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const { data, error } = await promise;
  if (error || !data) return [];
  return data;
}

async function safeRpc<T>(
  promise: PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const { data, error } = await promise;
  if (error || !data) return [];
  return data;
}

async function getTrendingSearches(
  client: AnySupabaseClient,
  scope: SearchScope | null
): Promise<Array<{ query: string; count: number }>> {
  const rows = await safeRpc<TrendingSearchRow>(
    client.rpc(
      "get_trending_searches",
      {
        hours_window: 168,
        limit_count: 8,
        scope_filter: scope,
      } as never
    ) as PromiseLike<{ data: TrendingSearchRow[] | null; error: { message: string } | null }>
  );

  return rows
    .map((row) => ({
      query: safeText(row.query).toLowerCase(),
      count: Number(row.search_count || 0),
    }))
    .filter((row) => row.query.length > 1 && row.count > 0)
    .slice(0, 8);
}

async function getDynamicPageItems(client: AnySupabaseClient): Promise<CmdkItem[]> {
  const discoveredRoutes = discoverAppRoutes();
  const routeMap = new Map<string, { title: string; updatedAtTs?: number }>();

  for (const route of discoveredRoutes) {
    routeMap.set(route.route, { title: route.title });
  }

  const copyRows = await safeSelect<CopyWebsiteRow>(
    client
      .from("copy_website")
      .select("page,key,content,updated_at")
      .limit(5000)
  );

  for (const row of copyRows) {
    const route = normalizeRoutePath(safeText(row.page));
    if (!route || isExcludedRoute(route)) continue;

    const existing = routeMap.get(route) || { title: routeToFallbackTitle(route) };
    const key = safeText(row.key).toLowerCase();
    const content = safeText(row.content);
    const isTitleKey = key === "title" || key === "meta_title" || key.endsWith("_title");

    if (isTitleKey && content.length >= 3) {
      existing.title = content;
    }

    const updatedAtTs = row.updated_at ? new Date(row.updated_at).getTime() : Number.NaN;
    if (!Number.isNaN(updatedAtTs)) {
      existing.updatedAtTs = Math.max(existing.updatedAtTs || 0, updatedAtTs);
    }

    routeMap.set(route, existing);
  }

  return Array.from(routeMap.entries())
    .filter(([route]) => route.startsWith("/"))
    .slice(0, 180)
    .map(([route, meta]) => {
      const title = safeText(meta.title) || routeToFallbackTitle(route);
      const routeKeywords = route
        .split("/")
        .filter(Boolean)
        .flatMap((entry) => entry.split("-"))
        .filter(Boolean);
      return {
        id: `site-page-${route.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "home"}`,
        title,
        description: route,
        href: route,
        group: "Site Pages",
        icon: "compass",
        entityType: "page",
        keywords: ["site page", "page", "navigate", route, title, ...routeKeywords],
        scoreHint: 26,
        recencyTs: meta.updatedAtTs,
        popularity: 58,
        businessPriority: 5,
      } satisfies CmdkItem;
    });
}

async function getTrendingSnapshot(client: AnySupabaseClient): Promise<TrendingSnapshot> {
  const now = Date.now();
  if (trendingCache && trendingCache.expiresAt > now) {
    return trendingCache.snapshot;
  }

  const since24hIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const [requests, categories, topSellers, verifiedSellers, recentActivity, dynamicPages] = await Promise.all([
    safeSelect<RequestRow>(
      client
        .from("requests")
        .select("id,title,category,budget_min,budget_max,payment_method,delivery_time,created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(8)
    ),
    safeSelect<CategoryRow>(
      client
        .from("categories")
        .select("id,name,icon")
        .eq("is_verified", true)
        .order("name", { ascending: true })
        .limit(12)
    ),
    safeRpc<TopSellerRow>(
      client.rpc("get_top_sellers", {
        time_range: "week",
        limit_count: 8,
      } as never) as PromiseLike<{ data: TopSellerRow[] | null; error: { message: string } | null }>
    ),
    safeSelect<ProfileRow>(
      client
        .from("profiles")
        .select("id,username,full_name,seller_status,wallet_address,avatar_url")
        .eq("seller_status", "verified")
        .order("updated_at", { ascending: false })
        .limit(8)
    ),
    safeSelect<ActivityRow>(
      client
        .from("global_chat_messages")
        .select("user_id,created_at")
        .gte("created_at", since24hIso)
        .order("created_at", { ascending: false })
        .limit(500)
    ),
    getDynamicPageItems(client),
  ]);

  const items: CmdkItem[] = [];

  for (const request of requests) {
    items.push({
      id: `trend-request-${request.id}`,
      title: request.title,
      description: `${request.category} · ${formatBudget(request.budget_min, request.budget_max)}`,
      href: `/requests/${request.id}`,
      group: "Live Requests",
      icon: "file-text",
      entityType: "request",
      keywords: [
        "trending requests",
        request.category,
        request.payment_method || "",
        request.delivery_time || "",
        request.title,
      ].filter(Boolean),
      scoreHint: 36,
      popularity: 70,
      recencyTs: new Date(request.created_at).getTime(),
      conversionScore: 0.54,
      businessPriority: 5,
    });
  }

  for (const category of categories) {
    items.push({
      id: `category-${category.id}`,
      title: category.name,
      description: "Category",
      href: `/category/${category.id}`,
      group: "Categories",
      icon: "tag",
      entityType: "category",
      keywords: ["category", category.id, category.name],
      scoreHint: 28,
      popularity: 62,
      conversionScore: 0.48,
      businessPriority: 4,
    });
  }

  for (const seller of topSellers) {
    const handle = slugify(safeText(seller.username));
    if (!seller.user_id) continue;

    items.push({
      id: `best-seller-${seller.user_id}`,
      title: safeText(seller.username) || `Seller ${seller.user_id.slice(0, 6)}`,
      description: `Best Sellers of the Week · ${Number(seller.total_deals || 0)} deals`,
      href: handle ? `/seller/@${encodeURIComponent(handle)}` : `/profile/${seller.user_id}`,
      group: "Best Sellers",
      icon: "flame",
      entityType: "seller",
      keywords: ["best sellers", "week", safeText(seller.username)],
      scoreHint: 40,
      avatarUrl: safeText(seller.avatar_url) || undefined,
      popularity: Math.min(100, Math.max(50, Number(seller.total_deals || 0) * 6)),
      conversionScore: 0.72,
      businessPriority: 6,
    });
  }

  const verifiedById = new Map(verifiedSellers.map((seller) => [seller.id, seller]));
  const activityCounter = new Map<string, number>();

  for (const row of recentActivity) {
    const userId = String(row.user_id || "");
    if (!userId || !verifiedById.has(userId)) continue;
    activityCounter.set(userId, (activityCounter.get(userId) || 0) + 1);
  }

  const topActiveVerifiedIds = Array.from(activityCounter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map((entry) => entry[0]);

  const topActiveVerifiedProfiles = topActiveVerifiedIds.length
    ? topActiveVerifiedIds
        .map((id) => verifiedById.get(id))
        .filter((entry): entry is ProfileRow => Boolean(entry))
    : verifiedSellers.slice(0, 2);

  for (const seller of topActiveVerifiedProfiles) {
    const handle = toHandle(seller, seller.id);
    const label = safeText(seller.full_name) || safeText(seller.username) || `Seller ${seller.id.slice(0, 6)}`;
    const activityHits = activityCounter.get(seller.id) || 0;

    items.push({
      id: `verified-seller-${seller.id}`,
      title: label,
      description: "Venditore verificato",
      href: `/seller/@${encodeURIComponent(handle)}`,
      group: "Verified Sellers",
      icon: "badge-check",
      entityType: "seller",
      keywords: ["venditori verificati", "verified sellers", "active 24h", label, handle],
      badge: "VERIFIED",
      scoreHint: 54,
      avatarUrl: safeText(seller.avatar_url) || undefined,
      popularity: Math.min(100, 70 + activityHits * 5),
      conversionScore: 0.74,
      businessPriority: 8,
    });
  }

  items.push(...dynamicPages);

  const predictions = buildPredictionTerms([
    ...STATIC_PREDICTIONS,
    ...requests.map((entry) => entry.title),
    ...categories.map((entry) => entry.name),
    ...topSellers.map((entry) => safeText(entry.username)),
    ...dynamicPages.map((entry) => entry.title),
  ]);

  const snapshot: TrendingSnapshot = {
    items: dedupeItems(items).slice(0, 24),
    predictions,
  };

  trendingCache = {
    expiresAt: now + TRENDING_TTL_MS,
    snapshot,
  };

  return snapshot;
}

async function getLiveQueryItems(
  client: AnySupabaseClient,
  query: string,
  normalizedQuery: string
): Promise<CmdkItem[]> {
  if (normalizedQuery.length < MIN_QUERY_LENGTH) return [];

  const clean = normalizeForFilter(query);
  if (!clean) return [];
  const ilike = `%${clean}%`;
  const walletQuery = looksLikeWallet(clean) || normalizedQuery.includes("wallet");

  const profileFilters = [`username.ilike.${ilike}`, `full_name.ilike.${ilike}`];
  if (walletQuery) {
    profileFilters.push(`wallet_address.ilike.${ilike}`);
  }

  const [profiles, requests, categories] = await Promise.all([
    safeSelect<ProfileRow>(
      client
        .from("profiles")
        .select("id,username,full_name,seller_status,wallet_address,avatar_url")
        .or(profileFilters.join(","))
        .limit(12)
    ),
    safeSelect<RequestRow>(
      client
        .from("requests")
        .select("id,title,category,budget_min,budget_max,payment_method,delivery_time,created_at")
        .eq("status", "open")
        .or(`title.ilike.${ilike},category.ilike.${ilike}`)
        .order("created_at", { ascending: false })
        .limit(12)
    ),
    safeSelect<CategoryRow>(
      client.from("categories").select("id,name,icon").or(`name.ilike.${ilike},id.ilike.${ilike}`).limit(10)
    ),
  ]);

  const items: CmdkItem[] = [];

  for (const profile of profiles) {
    const handle = toHandle(profile, profile.id);
    const label = safeText(profile.full_name) || safeText(profile.username) || `User ${profile.id.slice(0, 6)}`;
    const isVerified = profile.seller_status === "verified";

    items.push({
      id: `user-${profile.id}`,
      title: label,
      description: `${isVerified ? "Venditore verificato" : "Utente"} · @${handle}`,
      href: `/profile/${profile.id}`,
      group: "Users",
      icon: isVerified ? "badge-check" : "users",
      entityType: "seller",
      keywords: [label, handle, safeText(profile.wallet_address), safeText(profile.username)],
      badge: isVerified ? "VERIFIED" : undefined,
      scoreHint: isVerified ? 48 : 42,
      avatarUrl: safeText(profile.avatar_url) || undefined,
      popularity: isVerified ? 74 : 56,
      conversionScore: isVerified ? 0.66 : 0.48,
      businessPriority: isVerified ? 7 : 4,
    });

    if (profile.wallet_address) {
      items.push({
        id: `wallet-${profile.id}`,
        title: profile.wallet_address,
        description: `${label} wallet`,
        href: `/smart-search?type=wallet&q=${encodeURIComponent(profile.wallet_address)}`,
        group: "Wallet Addresses",
        icon: "wallet",
        entityType: "wallet",
        keywords: [profile.wallet_address, label, handle, "wallet"],
        scoreHint: walletQuery ? 90 : 38,
        popularity: 52,
        conversionScore: 0.42,
        businessPriority: 3,
      });
    }
  }

  for (const request of requests) {
    items.push({
      id: `request-${request.id}`,
      title: request.title,
      description: `${request.category} · ${formatBudget(request.budget_min, request.budget_max)}`,
      href: `/requests/${request.id}`,
      group: "Live Requests",
      icon: "file-text",
      entityType: "request",
      keywords: [request.title, request.category, request.payment_method || "", request.delivery_time || ""],
      scoreHint: 44,
      popularity: 67,
      recencyTs: new Date(request.created_at).getTime(),
      conversionScore: 0.52,
      businessPriority: 5,
    });
  }

  for (const category of categories) {
    items.push({
      id: `live-category-${category.id}`,
      title: category.name,
      description: `Category · ${category.id}`,
      href: `/category/${category.id}`,
      group: "Categories",
      icon: "tag",
      entityType: "category",
      keywords: [category.id, category.name, "category"],
      scoreHint: 30,
      popularity: 60,
      conversionScore: 0.47,
      businessPriority: 4,
    });
  }

  if (walletQuery) {
    items.push({
      id: `wallet-lookup-${clean.toLowerCase()}`,
      title: `Wallet lookup: ${clean}`,
      description: "Search wallet activity and related users",
      href: `/smart-search?type=wallet&q=${encodeURIComponent(clean)}`,
      group: "Wallet Addresses",
      icon: "wallet",
      entityType: "wallet",
      keywords: [clean, "wallet", "address"],
      scoreHint: 120,
      popularity: 55,
      conversionScore: 0.45,
      businessPriority: 4,
    });
  }

  if (/^trk[_-]?[a-z0-9-]{4,}$/i.test(clean) || normalizedQuery.includes("proxy")) {
    items.push({
      id: `proxy-track-${clean.toLowerCase()}`,
      title: `Track proxy order: ${clean}`,
      description: "Open proxy order tracking",
      href: `/track/${encodeURIComponent(clean)}`,
      group: "Proxy Orders",
      icon: "package",
      entityType: "page",
      keywords: [clean, "proxy", "tracking", "order"],
      scoreHint: 82,
      popularity: 64,
      conversionScore: 0.5,
      businessPriority: 5,
    });
  }

  return dedupeItems(items);
}

export async function GET(request: NextRequest) {
  const startedAt = performance.now();
  const query = normalizeQuery(request.nextUrl.searchParams.get("q"));
  const normalized = query.toLowerCase();
  const scope = normalizeScope(request.nextUrl.searchParams.get("scope"));

  const cacheKey = `${scope ?? "all"}::${normalized}`;
  const cached = queryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload, {
      headers: {
        "Cache-Control": "private, max-age=0, s-maxage=12, stale-while-revalidate=60",
      },
    });
  }

  try {
    const { client } = getReadClient();
    const trending = await getTrendingSnapshot(client);
    const trendingSearches = await getTrendingSearches(client, scope);
    const liveItems = await getLiveQueryItems(client, query, normalized);

    const baseItems = normalized.length >= MIN_QUERY_LENGTH ? [...liveItems, ...trending.items] : trending.items;
    const scopedItems = scope ? baseItems.filter((item) => matchesScope(item, scope)) : baseItems;

    const ranked = scopedItems
      .map((item) => ({ item, score: computeQueryBoost(item, normalized) }))
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);

    const items = dedupeItems(ranked).slice(0, MAX_RESULTS);
    const predictions = scope ? [] : filterPredictions(trending.predictions, normalized);

    const payload: CmdkPayload = {
      query,
      items,
      predictions,
      trendingSearches: scope ? [] : trendingSearches,
      generatedAt: new Date().toISOString(),
      tookMs: Math.round(performance.now() - startedAt),
    };

    queryCache.set(cacheKey, {
      expiresAt: Date.now() + QUERY_CACHE_TTL_MS,
      payload,
    });

    if (queryCache.size > 160) {
      const firstKey = queryCache.keys().next().value as string | undefined;
      if (firstKey) queryCache.delete(firstKey);
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=0, s-maxage=12, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Search is temporarily unavailable",
        query,
        items: [],
        predictions: [],
        trendingSearches: [],
        generatedAt: new Date().toISOString(),
        tookMs: Math.round(performance.now() - startedAt),
      },
      { status: 200 }
    );
  }
}
