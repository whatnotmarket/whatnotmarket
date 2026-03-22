"use client";

import {
createQuerySuggestions,
createRecentSearchItems,
createTrendingSearchItems,
getKnownBrands,
getKnownCategories,
GROUP_ORDER,
PINNED_ITEM_IDS,
SEARCH_CATALOG,
type TrendingSearchEntry,
} from "@/components/features/search/global-search-catalog";
import { getQueryDebounceMs,matchesScope,parseSearchQuery,scoreSearchItem } from "@/components/features/search/search-intelligence";
import type { ParsedQuery,SearchCatalogItem,SearchEntityType,SearchGroup,SearchScopeId } from "@/components/features/search/search-types";
import type { LucideIcon } from "lucide-react";
import {
BadgeCheck,
BriefcaseBusiness,
Compass,
FileText,
Flame,
Globe,
LayoutDashboard,
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
import { useCallback,useEffect,useMemo,useRef,useState } from "react";

type ApiSearchItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  group: string;
  icon: string;
  keywords: string[];
  badge?: string;
  scoreHint?: number;
  avatarUrl?: string;
  popularity?: number;
  recencyTs?: number;
  conversionScore?: number;
  businessPriority?: number;
  availability?: "in_stock" | "low_stock" | "out_of_stock";
  entityType?: SearchEntityType;
};

type ApiSearchResponse = {
  items: ApiSearchItem[];
  predictions: string[];
  trendingSearches: TrendingSearchEntry[];
};

type CachedClientResponse = {
  items: SearchCatalogItem[];
  predictions: string[];
  trendingSearches: TrendingSearchEntry[];
  fetchedAt: number;
};

type UseSmartSearchParams = {
  open: boolean;
  query: string;
  activeScope: SearchScopeId | null;
};

type UseSmartSearchResult = {
  parsed: ParsedQuery;
  items: SearchCatalogItem[];
  groupedItems: Map<SearchGroup, SearchCatalogItem[]>;
  visibleGroups: SearchGroup[];
  isLoading: boolean;
  saveRecent: (value: string, clickedItem?: SearchCatalogItem) => void;
};

const MAX_RESULTS = 44;
const CLIENT_CACHE_TTL_MS = 14_000;
const MAX_RECENT_QUERIES = 7;
const ALLOWED_PREDICTIONS = new Set(["services", "sellers", "category"]);

const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  wallet: Wallet,
  "file-text": FileText,
  tag: Tag,
  flame: Flame,
  "badge-check": BadgeCheck,
  package: PackageSearch,
  proxy: PackageSearch,
  shield: ShieldCheck,
  globe: Globe,
  store: Store,
  sparkles: Sparkles,
  search: Search,
  "user-round": UserRound,
  briefcase: BriefcaseBusiness,
  shopping: ShoppingBag,
  compass: Compass,
  message: MessageCircle,
  lock: LockKeyhole,
  dashboard: LayoutDashboard,
};

function dedupeById(items: SearchCatalogItem[]): SearchCatalogItem[] {
  const map = new Map<string, SearchCatalogItem>();
  for (const item of items) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
    if (map.size >= MAX_RESULTS) break;
  }
  return Array.from(map.values());
}

function resolveIcon(iconKey: string): LucideIcon {
  return ICON_MAP[iconKey] || Search;
}

function toCatalogItem(item: ApiSearchItem): SearchCatalogItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    href: item.href,
    group: item.group,
    icon: resolveIcon(item.icon),
    entityType: item.entityType ?? "action",
    keywords: Array.isArray(item.keywords) ? item.keywords : [],
    badge: item.badge,
    scoreHint: typeof item.scoreHint === "number" ? item.scoreHint : 0,
    avatarUrl: typeof item.avatarUrl === "string" ? item.avatarUrl : undefined,
    popularity: typeof item.popularity === "number" ? item.popularity : undefined,
    recencyTs: typeof item.recencyTs === "number" ? item.recencyTs : undefined,
    conversionScore: typeof item.conversionScore === "number" ? item.conversionScore : undefined,
    businessPriority: typeof item.businessPriority === "number" ? item.businessPriority : undefined,
    availability: item.availability,
    source: "live",
  };
}

function normalizeRecentSeed(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function hasDirectMatch(score: { exactMatch: number; prefixMatch: number; fuzzyMatch: number }, fuzzyThreshold: number): boolean {
  return score.exactMatch > 0 || score.prefixMatch > 0 || score.fuzzyMatch >= fuzzyThreshold;
}

function isProfileItem(item: SearchCatalogItem): boolean {
  const href = item.href.toLowerCase();
  const group = item.group.toLowerCase();
  const words = `${item.title} ${item.description} ${item.keywords.join(" ")}`.toLowerCase();

  return (
    href.includes("/profile/") ||
    href.includes("/seller/") ||
    group.includes("users") ||
    group.includes("verified sellers") ||
    words.includes("user") ||
    words.includes("seller")
  );
}

export function useSmartSearch({ open, query, activeScope }: UseSmartSearchParams): UseSmartSearchResult {
  const [liveItems, setLiveItems] = useState<SearchCatalogItem[]>([]);
  const [predictionTerms, setPredictionTerms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearchEntry[]>([]);

  const cacheRef = useRef<Map<string, CachedClientResponse>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const trackedInputRef = useRef<Map<string, number>>(new Map());

  const parsed = useMemo(
    () =>
      parseSearchQuery(query, {
        knownBrands: getKnownBrands(),
        knownCategories: getKnownCategories(),
      }),
    [query]
  );

  const fetchRecentQueries = useCallback(async () => {
    try {
      const response = await fetch("/api/search/recent", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as { recentSearches?: string[] };
      const incoming = Array.isArray(payload.recentSearches)
        ? payload.recentSearches
            .map((entry) => String(entry || "").trim())
            .filter(Boolean)
            .slice(0, MAX_RECENT_QUERIES)
        : [];
      setRecentQueries(incoming);
    } catch {
      setRecentQueries([]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetchRecentQueries();
  }, [open, fetchRecentQueries]);

  const saveRecent = useCallback((value: string, clickedItem?: SearchCatalogItem) => {
    const seed = normalizeRecentSeed(value || clickedItem?.title || "");
    if (!seed) return;

    setRecentQueries((prev) => {
      const next = [seed, ...prev.filter((entry) => entry.toLowerCase() !== seed.toLowerCase())].slice(
        0,
        MAX_RECENT_QUERIES
      );
      return next;
    });

    void fetch("/api/search/recent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: seed,
        selectedItemId: clickedItem?.id || null,
      }),
    })
      .then((response) => response.json())
      .then((payload: { recentSearches?: string[] }) => {
        const incoming = Array.isArray(payload.recentSearches)
          ? payload.recentSearches
              .map((entry) => String(entry || "").trim())
              .filter(Boolean)
              .slice(0, MAX_RECENT_QUERIES)
          : null;
        if (incoming) {
          setRecentQueries(incoming);
        }
      })
      .catch(() => {
        // keep optimistic state
      });
  }, []);

  const trackQuery = useCallback(
    async (rawQuery: string, source: "input" | "select", selectedItemId?: string) => {
      const normalized = rawQuery.trim().toLowerCase();
      if (normalized.length < 2) return;

      const dedupeKey = `${activeScope ?? "all"}::${normalized}::${source}`;
      const now = Date.now();
      const lastTracked = trackedInputRef.current.get(dedupeKey);
      if (lastTracked && now - lastTracked < 10 * 60 * 1000) return;
      trackedInputRef.current.set(dedupeKey, now);

      try {
        await fetch("/api/search/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: rawQuery,
            scope: activeScope,
            source: source === "input" ? "cmdk-input" : "cmdk-select",
            selectedItemId,
            intent: parsed.intent,
            entities: parsed.entities,
          }),
        });
      } catch {
        // Fire-and-forget analytics: intentionally silent.
      }
    },
    [activeScope, parsed.entities, parsed.intent]
  );

  const fetchLiveResults = useCallback(async (rawQuery: string, scope: SearchScopeId | null) => {
    const normalized = rawQuery.trim().toLowerCase();
    const scopeKey = scope ?? "all";
    const cacheKey = `${scopeKey}::${normalized}`;
    const now = Date.now();

    const cached = cacheRef.current.get(cacheKey);
    if (cached && cached.fetchedAt + CLIENT_CACHE_TTL_MS > now) {
      setLiveItems(cached.items);
      setPredictionTerms(cached.predictions);
      setTrendingSearches(cached.trendingSearches);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);

    try {
      const params = new URLSearchParams({ q: rawQuery });
      if (scope) params.set("scope", scope);

      const response = await fetch(`/api/search/cmdk?${params.toString()}`, {
        method: "GET",
        signal: controller.signal,
      });
      const payload = (await response.json()) as Partial<ApiSearchResponse>;
      const incomingItems = Array.isArray(payload.items) ? payload.items : [];
      const incomingPredictions = Array.isArray(payload.predictions)
        ? payload.predictions.filter((entry): entry is string => typeof entry === "string")
        : [];
      const incomingTrending = Array.isArray(payload.trendingSearches)
        ? payload.trendingSearches
            .filter(
              (entry): entry is TrendingSearchEntry =>
                Boolean(entry) &&
                typeof entry.query === "string" &&
                entry.query.trim().length > 1 &&
                typeof entry.count === "number"
            )
            .slice(0, 10)
        : [];

      const mappedItems = incomingItems.map(toCatalogItem);
      setLiveItems(mappedItems);
      setPredictionTerms(incomingPredictions);
      setTrendingSearches(incomingTrending);

      cacheRef.current.set(cacheKey, {
        items: mappedItems,
        predictions: incomingPredictions,
        trendingSearches: incomingTrending,
        fetchedAt: now,
      });
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        setLiveItems([]);
        setPredictionTerms([]);
        setTrendingSearches([]);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const debounceMs = getQueryDebounceMs(parsed);
    const timer = window.setTimeout(() => {
      void fetchLiveResults(query, activeScope);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [open, query, activeScope, parsed, fetchLiveResults]);

  useEffect(() => {
    if (!open) return;
    if (parsed.normalized.length < 2) return;

    const timer = window.setTimeout(() => {
      void trackQuery(query, "input");
    }, 950);

    return () => window.clearTimeout(timer);
  }, [open, parsed.normalized, query, trackQuery]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const items = useMemo(() => {
    const normalized = parsed.normalized;
    const predictionItems: SearchCatalogItem[] = predictionTerms
      .filter((term) => ALLOWED_PREDICTIONS.has(term.trim().toLowerCase()))
      .map((term) => ({
        id: `prediction-${term}`,
        title: term,
        description: "Predict with AI",
        href: `/smart-search?q=${encodeURIComponent(`${query.trim()} ${term}`.trim())}`,
        group: "Predictions",
        icon: Sparkles,
        entityType: "prediction",
        keywords: [term, "prediction", "ai"],
        source: "prediction",
        scoreHint: 34,
      }));

    const recentItems = createRecentSearchItems(recentQueries);
    const trendingSearchItems = createTrendingSearchItems(trendingSearches);
    const catalogPinned = SEARCH_CATALOG.filter((item) => PINNED_ITEM_IDS.includes(item.id));

    const pool = !normalized
      ? [...recentItems, ...trendingSearchItems, ...liveItems, ...catalogPinned]
      : [
          ...createQuerySuggestions(query),
          ...liveItems,
          ...predictionItems,
          ...SEARCH_CATALOG,
          ...trendingSearchItems,
          ...recentItems,
        ];

    const scopeFiltered = activeScope ? pool.filter((item) => matchesScope(item, activeScope)) : pool;

    const recentMap = new Map<string, number>();
    recentQueries.forEach((entry, index) => {
      recentMap.set(`recent-${entry.toLowerCase()}-${index}`, Math.max(0, 1 - index * 0.12));
    });

    const rankedEntries = scopeFiltered.map((item) => {
      const breakdown = scoreSearchItem(item, {
        parsed,
        nowTs: Date.now(),
        recentMap,
        activeScope,
      });
      return {
        item,
        breakdown,
        score: breakdown.final,
      };
    });

    const looksLikeSingleHandleToken =
      parsed.tokens.length === 1 &&
      parsed.normalized.length >= 3 &&
      !parsed.normalized.includes(" ");

    const hasStrongProfileCandidate = rankedEntries.some(
      (entry) =>
        entry.item.source === "live" &&
        isProfileItem(entry.item) &&
        hasDirectMatch(entry.breakdown, 74)
    );

    const ranked = rankedEntries
      .filter((entry) => {
        if (!parsed.normalized) return true;
        if (entry.score <= 0) return false;

        if (parsed.isHandle) {
          return isProfileItem(entry.item) && hasDirectMatch(entry.breakdown, 44);
        }

        if (looksLikeSingleHandleToken && hasStrongProfileCandidate) {
          if (!isProfileItem(entry.item)) return false;
          return hasDirectMatch(entry.breakdown, 58);
        }

        if (entry.item.id.startsWith("suggest-")) return true;
        if (entry.item.source === "live") return hasDirectMatch(entry.breakdown, 40);

        if (
          entry.item.entityType === "prediction" ||
          entry.item.entityType === "recent" ||
          entry.item.entityType === "trending"
        ) {
          return hasDirectMatch(entry.breakdown, 48);
        }

        return hasDirectMatch(entry.breakdown, 56);
      })
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);

    return dedupeById(ranked).slice(0, MAX_RESULTS);
  }, [parsed, predictionTerms, query, recentQueries, liveItems, activeScope, trendingSearches]);

  const groupedItems = useMemo(() => {
    const map = new Map<SearchGroup, SearchCatalogItem[]>();
    for (const group of GROUP_ORDER) map.set(group, []);

    for (const item of items) {
      const existing = map.get(item.group);
      if (existing) existing.push(item);
      else map.set(item.group, [item]);
    }

    return map;
  }, [items]);

  const visibleGroups = useMemo(() => {
    const order = [...GROUP_ORDER];
    const seen = new Set(order);
    for (const key of groupedItems.keys()) {
      if (!seen.has(key)) {
        seen.add(key);
        order.push(key);
      }
    }

    return order.filter((group) => (groupedItems.get(group) ?? []).length > 0);
  }, [groupedItems]);

  return {
    parsed,
    items,
    groupedItems,
    visibleGroups,
    isLoading,
    saveRecent: (value: string, clickedItem?: SearchCatalogItem) => {
      saveRecent(value, clickedItem);
      void trackQuery(value || clickedItem?.title || "", "select", clickedItem?.id);
    },
  };
}

