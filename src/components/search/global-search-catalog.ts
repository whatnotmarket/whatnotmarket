import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Compass,
  Flame,
  Gavel,
  Globe,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  MessageCircle,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { parseSearchQuery, scoreSearchItem } from "@/components/search/search-intelligence";
import type { SearchCatalogItem, SearchGroup } from "@/components/search/search-types";

const NOW = Date.now();

export const GROUP_ORDER: SearchGroup[] = [
  "Recent Searches",
  "Trending Searches",
  "Quick Actions",
  "Products",
  "Brands",
  "Categories",
  "Collections",
  "Sellers",
  "NEW FEATURE",
  "Marketplace",
  "Trending",
  "Trust & Safety",
  "Site Pages",
  "Predictions",
];

export const SEARCH_CATALOG: SearchCatalogItem[] = [
  {
    id: "quick-users",
    title: "Search users",
    description: "Find buyers and sellers fast",
    href: "/smart-search?type=users",
    group: "Quick Actions",
    icon: Users,
    entityType: "action",
    keywords: ["users", "seller", "buyer", "profiles"],
    scoreHint: 40,
    businessPriority: 7,
  },
  {
    id: "quick-services",
    title: "Search services",
    description: "Discover available services",
    href: "/smart-search?type=services",
    group: "Quick Actions",
    icon: BriefcaseBusiness,
    entityType: "action",
    keywords: ["services", "offers", "work"],
    scoreHint: 38,
    businessPriority: 6,
  },
  {
    id: "quick-verified-sellers",
    title: "Search verified sellers",
    description: "Find verified sellers only",
    href: "/smart-search?type=users&verified=1",
    group: "Quick Actions",
    icon: BadgeCheck,
    entityType: "action",
    keywords: ["verified sellers", "trusted sellers", "venditori verificati"],
    scoreHint: 44,
    businessPriority: 8,
  },
  {
    id: "quick-products",
    title: "Search products",
    description: "Find products in marketplace",
    href: "/market?tab=products",
    group: "Quick Actions",
    icon: ShoppingBag,
    entityType: "action",
    keywords: ["products", "catalog", "market"],
    scoreHint: 42,
    businessPriority: 8,
  },
  {
    id: "quick-wallet",
    title: "Wallet lookup",
    description: "Find wallet and related activity",
    href: "/smart-search?type=wallet",
    group: "Quick Actions",
    icon: Wallet,
    entityType: "action",
    keywords: ["wallet", "address", "crypto", "tx"],
    scoreHint: 30,
    businessPriority: 5,
  },
  {
    id: "quick-pages",
    title: "Search pages",
    description: "Jump to internal pages",
    href: "/smart-search?type=pages",
    group: "Quick Actions",
    icon: Compass,
    entityType: "action",
    keywords: ["pages", "navigation", "menu"],
    scoreHint: 30,
    businessPriority: 4,
  },
  {
    id: "feature-buy-anywhere",
    title: "Buy anywhere with crypto",
    description: "NEW FEATURE: proxy checkout flow",
    href: "/smart-search",
    group: "NEW FEATURE",
    icon: Sparkles,
    entityType: "action",
    keywords: ["buy anywhere", "proxy buy", "crypto", "new feature"],
    badge: "NEW",
    scoreHint: 58,
    businessPriority: 9,
    conversionScore: 0.8,
  },
  {
    id: "product-nike-air-max-90",
    title: "Nike Air Max 90",
    description: "Sneakers • black • used",
    href: "/market?q=nike%20air%20max%2090",
    group: "Products",
    icon: ShoppingBag,
    entityType: "product",
    keywords: ["nike", "air max", "running", "scarpe", "sneakers"],
    price: 89,
    currency: "EUR",
    availability: "in_stock",
    popularity: 91,
    conversionScore: 0.79,
    businessPriority: 8,
    recencyTs: NOW - 18 * 3_600_000,
    brand: "Nike",
    category: "Running",
    color: "black",
    condition: "used",
    thumbnailUrl: "/thinsmooth.svg",
  },
  {
    id: "product-adidas-ultraboost",
    title: "Adidas Ultraboost",
    description: "Running shoes • white • new",
    href: "/market?q=adidas%20ultraboost",
    group: "Products",
    icon: ShoppingBag,
    entityType: "product",
    keywords: ["adidas", "ultraboost", "running", "scarpe"],
    price: 129,
    currency: "EUR",
    availability: "low_stock",
    popularity: 74,
    conversionScore: 0.67,
    businessPriority: 6,
    recencyTs: NOW - 64 * 3_600_000,
    brand: "Adidas",
    category: "Running",
    color: "white",
    condition: "new",
    thumbnailUrl: "/thinsmooth.svg",
  },
  {
    id: "brand-nike",
    title: "Nike",
    description: "Top brand • 124 products",
    href: "/market?brand=nike",
    group: "Brands",
    icon: Globe,
    entityType: "brand",
    keywords: ["nike", "brand", "running", "sportswear"],
    popularity: 95,
    conversionScore: 0.73,
    businessPriority: 7,
    recencyTs: NOW - 12 * 3_600_000,
    thumbnailUrl: "/thinsmooth.svg",
  },
  {
    id: "brand-apple",
    title: "Apple",
    description: "Premium brand • 83 products",
    href: "/market?brand=apple",
    group: "Brands",
    icon: Globe,
    entityType: "brand",
    keywords: ["apple", "iphone", "mac", "brand"],
    popularity: 90,
    conversionScore: 0.7,
    businessPriority: 7,
    recencyTs: NOW - 40 * 3_600_000,
    thumbnailUrl: "/thinsmooth.svg",
  },
  {
    id: "category-running",
    title: "Running",
    description: "Category",
    href: "/category/running",
    group: "Categories",
    icon: Tag,
    entityType: "category",
    keywords: ["running", "scarpe running", "sports"],
    popularity: 84,
    conversionScore: 0.65,
    businessPriority: 6,
  },
  {
    id: "category-software",
    title: "Software",
    description: "Category",
    href: "/category/software",
    group: "Categories",
    icon: Tag,
    entityType: "category",
    keywords: ["software", "license", "tools"],
    popularity: 73,
    conversionScore: 0.58,
    businessPriority: 5,
  },
  {
    id: "collection-running-essentials",
    title: "Running essentials",
    description: "Collection • curated picks",
    href: "/market?collection=running-essentials",
    group: "Collections",
    icon: Store,
    entityType: "collection",
    keywords: ["collection", "running", "essentials"],
    popularity: 68,
    conversionScore: 0.6,
    businessPriority: 5,
  },
  {
    id: "collection-budget-under-100",
    title: "Under 100",
    description: "Collection • budget deals",
    href: "/market?collection=under-100",
    group: "Collections",
    icon: Store,
    entityType: "collection",
    keywords: ["under 100", "budget", "deals", "sotto 100"],
    popularity: 71,
    conversionScore: 0.64,
    businessPriority: 7,
  },
  {
    id: "market-proxy-order",
    title: "Proxy order",
    description: "Order from external stores",
    href: "/proxy-orders",
    group: "Marketplace",
    icon: PackageSearch,
    entityType: "service",
    keywords: ["proxy", "order", "external store"],
    scoreHint: 34,
    businessPriority: 6,
  },
  {
    id: "market-best-sellers",
    title: "Best sellers of the week",
    description: "Top sellers and products",
    href: "/market?section=best-sellers",
    group: "Marketplace",
    icon: Flame,
    entityType: "seller",
    keywords: ["best sellers", "top", "week"],
    scoreHint: 36,
    popularity: 78,
    recencyTs: NOW - 6 * 3_600_000,
  },
  {
    id: "market-verified-sellers",
    title: "Verified sellers",
    description: "Trusted marketplace sellers",
    href: "/market?filter=verified",
    group: "Marketplace",
    icon: BadgeCheck,
    entityType: "seller",
    keywords: ["verified sellers", "trusted", "seller"],
    scoreHint: 33,
  },
  {
    id: "market-become-affiliate",
    title: "Become affiliate",
    description: "Join affiliate program",
    href: "/broker",
    group: "Marketplace",
    icon: Globe,
    entityType: "action",
    keywords: ["affiliate", "referral", "earn"],
    businessPriority: 6,
  },
  {
    id: "trending-requests",
    title: "Trending requests",
    description: "Most requested right now",
    href: "/requests?sort=trending",
    group: "Trending",
    icon: Flame,
    entityType: "request",
    keywords: ["trending requests", "popular", "richieste"],
    popularity: 82,
    recencyTs: NOW - 4 * 3_600_000,
  },
  {
    id: "trending-global-chat",
    title: "Global chat",
    description: "Public community room",
    href: "/",
    group: "Trending",
    icon: MessageCircle,
    entityType: "page",
    keywords: ["chat", "community", "public room"],
  },
  {
    id: "trust-escrow",
    title: "Escrow protection",
    description: "Secure transactions",
    href: "/secure-transaction",
    group: "Trust & Safety",
    icon: ShieldCheck,
    entityType: "page",
    keywords: ["escrow", "secure payment", "trust"],
    businessPriority: 6,
  },
  {
    id: "trust-open-dispute",
    title: "Open dispute",
    description: "Resolve transaction issues",
    href: "/open-dispute",
    group: "Trust & Safety",
    icon: Gavel,
    entityType: "page",
    keywords: ["dispute", "problem", "claim"],
  },
  {
    id: "trust-refund",
    title: "Refund center",
    description: "Manage refunds",
    href: "/refund",
    group: "Trust & Safety",
    icon: LockKeyhole,
    entityType: "page",
    keywords: ["refund", "chargeback", "support"],
  },
  {
    id: "page-orders",
    title: "Orders",
    description: "Track all your orders",
    href: "/my-deals",
    group: "Site Pages",
    icon: LayoutDashboard,
    entityType: "page",
    keywords: ["orders", "deals", "tracking"],
    shortcut: "O",
  },
  {
    id: "page-wishlist",
    title: "Wishlist",
    description: "Saved products",
    href: "/market?tab=wishlist",
    group: "Site Pages",
    icon: Bell,
    entityType: "page",
    keywords: ["wishlist", "saved", "favorites"],
    shortcut: "W",
  },
  {
    id: "page-profile",
    title: "Profile",
    description: "Account profile and settings",
    href: "/profile",
    group: "Site Pages",
    icon: UserRound,
    entityType: "page",
    keywords: ["profile", "account", "settings"],
    shortcut: "P",
  },
  {
    id: "page-help",
    title: "Help center",
    description: "FAQ and support",
    href: "/faq",
    group: "Site Pages",
    icon: LifeBuoy,
    entityType: "page",
    keywords: ["help", "support", "faq"],
  },
];

export const PINNED_ITEM_IDS: string[] = [
  "quick-users",
  "quick-verified-sellers",
  "quick-services",
  "quick-products",
  "quick-wallet",
  "quick-pages",
  "feature-buy-anywhere",
  "market-best-sellers",
  "trust-escrow",
];

export type TrendingSearchEntry = {
  query: string;
  count: number;
};

const ETH_WALLET_REGEX = /^0x[a-fA-F0-9]{16,}$/;
const TRON_WALLET_REGEX = /^T[1-9A-HJ-NP-Za-km-z]{20,}$/;
const SOL_WALLET_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function getKnownBrands(): string[] {
  return SEARCH_CATALOG.filter((item) => item.entityType === "brand").map((item) => item.title);
}

export function getKnownCategories(): string[] {
  return SEARCH_CATALOG.filter((item) => item.entityType === "category").map((item) => item.title);
}

export function createRecentSearchItems(queries: string[]): SearchCatalogItem[] {
  return queries.map((query, index) => ({
    id: `recent-${query.toLowerCase()}-${index}`,
    title: query,
    description: "Recent search",
    href: `/smart-search?q=${encodeURIComponent(query)}`,
    group: "Recent Searches",
    icon: Search,
    entityType: "recent",
    keywords: [query, "recent", "search history"],
    source: "recent",
    scoreHint: 48 - index,
  }));
}

export function createTrendingSearchItems(entries: TrendingSearchEntry[]): SearchCatalogItem[] {
  return entries.map((entry, index) => ({
    id: `trending-search-${entry.query.replace(/\s+/g, "-")}-${index}`,
    title: entry.query,
    description: "Trending search",
    href: `/smart-search?q=${encodeURIComponent(entry.query)}`,
    group: "Trending Searches",
    icon: Flame,
    entityType: "trending",
    keywords: [entry.query, "trending", "popular"],
    popularity: Math.min(100, 70 + entry.count * 4),
    source: "trending",
    scoreHint: 48 - index,
    businessPriority: 6,
    conversionScore: 0.5,
  }));
}

export function createQuerySuggestions(rawQuery: string): SearchCatalogItem[] {
  const query = rawQuery.trim();
  if (!query) return [];

  const encoded = encodeURIComponent(query);
  const parsed = parseSearchQuery(query, {
    knownBrands: getKnownBrands(),
    knownCategories: getKnownCategories(),
  });

  if (parsed.isHandle) {
    const clean = query.replace(/^@/, "");
    return [
      {
        id: `suggest-profile-${clean.toLowerCase()}`,
        title: clean,
        description: "Profile",
        href: `/smart-search?type=users&q=${encodeURIComponent(clean)}`,
        group: "Quick Actions",
        icon: UserRound,
        entityType: "action",
        keywords: [clean, "profile", "user", "seller", "buyer"],
        scoreHint: 120,
      },
    ];
  }

  const suggestions: SearchCatalogItem[] = [];

  if (parsed.intent === "navigation") {
    suggestions.push({
      id: `suggest-nav-${query.toLowerCase()}`,
      title: `Go to ${query}`,
      description: "Quick internal navigation",
      href: `/smart-search?type=pages&q=${encoded}`,
      group: "Quick Actions",
      icon: Compass,
      entityType: "action",
      keywords: [query, "navigation", "pages"],
      scoreHint: 96,
    });
  }

  if (parsed.intent === "buy" || parsed.entities.brand || parsed.entities.category || parsed.entities.maxPrice !== undefined) {
    const priceHint =
      parsed.entities.maxPrice !== undefined ? `under €${Math.round(parsed.entities.maxPrice)}` : "with smart filters";
    suggestions.push({
      id: `suggest-products-${query.toLowerCase()}`,
      title: `Search products: "${query}"`,
      description: `Marketplace search ${priceHint}`,
      href: `/market?q=${encoded}`,
      group: "Quick Actions",
      icon: ShoppingBag,
      entityType: "action",
      keywords: [query, "products", "market", "catalog"],
      scoreHint: 104,
    });
  }

  suggestions.push(
    {
      id: `suggest-users-${query.toLowerCase()}`,
      title: `Search users: "${query}"`,
      description: "Find seller and buyer profiles",
      href: `/smart-search?type=users&q=${encoded}`,
      group: "Quick Actions",
      icon: UserRound,
      entityType: "action",
      keywords: [query, "users", "profiles", "seller", "buyer"],
      scoreHint: 84,
    },
    {
      id: `suggest-services-${query.toLowerCase()}`,
      title: `Search services: "${query}"`,
      description: "Find services by keyword",
      href: `/smart-search?type=services&q=${encoded}`,
      group: "Quick Actions",
      icon: BriefcaseBusiness,
      entityType: "action",
      keywords: [query, "services", "offers"],
      scoreHint: 78,
    }
  );

  const normalized = query.toLowerCase();
  const walletLike = ETH_WALLET_REGEX.test(query) || TRON_WALLET_REGEX.test(query) || SOL_WALLET_REGEX.test(query);
  if (walletLike || normalized.includes("wallet") || normalized.startsWith("0x")) {
    suggestions.unshift({
      id: `suggest-wallet-${query.toLowerCase()}`,
      title: `Wallet lookup: "${query}"`,
      description: "Search wallet and activity",
      href: `/smart-search?type=wallet&q=${encoded}`,
      group: "Quick Actions",
      icon: Wallet,
      entityType: "action",
      keywords: [query, "wallet", "address", "crypto"],
      scoreHint: 130,
    });
  }

  return suggestions;
}

export function scoreCatalogItem(item: SearchCatalogItem, normalizedQuery: string): number {
  if (!normalizedQuery) return item.scoreHint ?? 0;

  const parsed = parseSearchQuery(normalizedQuery, {
    knownBrands: getKnownBrands(),
    knownCategories: getKnownCategories(),
  });

  return scoreSearchItem(item, {
    parsed,
    nowTs: Date.now(),
    recentMap: new Map(),
    activeScope: null,
  }).final;
}
