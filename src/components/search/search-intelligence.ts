import type { ParsedQuery, ScoreBreakdown, SearchCatalogItem, SearchScopeId } from "@/components/search/search-types";

type ParseOptions = {
  knownBrands?: string[];
  knownCategories?: string[];
};

type ScoringContext = {
  parsed: ParsedQuery;
  nowTs: number;
  recentMap: Map<string, number>;
  activeScope: SearchScopeId | null;
};

const COLORS = [
  "black",
  "white",
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "pink",
  "orange",
  "gray",
  "grey",
  "brown",
  "gold",
  "silver",
  "nero",
  "bianco",
  "rosso",
  "blu",
  "verde",
  "giallo",
  "grigio",
];

const CATEGORY_HINTS = [
  "scarpe",
  "running",
  "sneakers",
  "streetwear",
  "gaming",
  "software",
  "accounts",
  "crypto",
];

const NAVIGATION_HINTS = ["ordini", "wishlist", "profilo", "dashboard", "impostazioni", "settings", "orders", "wishlist"];
const BUY_HINTS = ["buy", "acquista", "prezzo", "sotto", "under", "deal", "offerta", "running", "nike", "product"];
const SELL_HINTS = ["vendere", "sell", "seller", "list", "listing"];
const SUPPORT_HINTS = ["help", "support", "assistenza", "faq", "refund", "dispute"];
const PROFILE_HINTS = ["@", "user", "utente", "seller", "buyer", "profile", "profilo"];

const PRICE_RANGE_REGEXES = [
  /(?:sotto|under)\s*([0-9]+(?:[.,][0-9]+)?)/i,
  /(?:tra|between)\s*([0-9]+(?:[.,][0-9]+)?)\s*(?:e|and|-)\s*([0-9]+(?:[.,][0-9]+)?)/i,
  /([0-9]+(?:[.,][0-9]+)?)\s*-\s*([0-9]+(?:[.,][0-9]+)?)/i,
];

function normalizeText(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function tokenize(normalized: string): string[] {
  return normalized
    .split(/[^a-z0-9@._-]+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parsePriceValue(value: string): number {
  return Number(value.replace(",", "."));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

function fuzzySimilarity(a: string, b: string): number {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;

  if (left === right) return 1;
  if (left.startsWith(right) || right.startsWith(left)) return 0.9;
  if (left.includes(right) || right.includes(left)) return 0.78;

  const distance = levenshtein(left, right);
  const maxLen = Math.max(left.length, right.length);
  const score = 1 - distance / Math.max(1, maxLen);
  return Math.max(0, Math.min(1, score));
}

function detectIntent(normalized: string, tokens: string[]): { intent: ParsedQuery["intent"]; confidence: number } {
  const blob = `${normalized} ${tokens.join(" ")}`;

  if (PROFILE_HINTS.some((hint) => blob.includes(hint))) return { intent: "profile", confidence: 0.86 };
  if (NAVIGATION_HINTS.some((hint) => blob.includes(hint))) return { intent: "navigation", confidence: 0.82 };
  if (SELL_HINTS.some((hint) => blob.includes(hint))) return { intent: "sell", confidence: 0.76 };
  if (BUY_HINTS.some((hint) => blob.includes(hint))) return { intent: "buy", confidence: 0.8 };
  if (SUPPORT_HINTS.some((hint) => blob.includes(hint))) return { intent: "support", confidence: 0.74 };

  return { intent: "discovery", confidence: 0.52 };
}

export function parseSearchQuery(rawQuery: string, options: ParseOptions = {}): ParsedQuery {
  const normalized = normalizeText(rawQuery);
  const tokens = tokenize(normalized);
  const isHandle = /^@[a-z0-9_.-]{2,30}$/i.test(normalized);
  const isShort = normalized.length > 0 && normalized.length <= 2;
  const { intent, confidence } = detectIntent(normalized, tokens);

  const knownBrands = (options.knownBrands || []).map((entry) => normalizeText(entry));
  const knownCategories = [...CATEGORY_HINTS, ...(options.knownCategories || []).map((entry) => normalizeText(entry))];

  const entities: ParsedQuery["entities"] = {};

  for (const pattern of PRICE_RANGE_REGEXES) {
    const match = normalized.match(pattern);
    if (!match) continue;

    if (match[2]) {
      entities.minPrice = parsePriceValue(match[1]);
      entities.maxPrice = parsePriceValue(match[2]);
    } else {
      entities.maxPrice = parsePriceValue(match[1]);
    }
    break;
  }

  entities.color = COLORS.find((color) => tokens.includes(color));
  entities.condition = tokens.includes("usato") || tokens.includes("used")
    ? "used"
    : tokens.includes("nuovo") || tokens.includes("new")
    ? "new"
    : tokens.includes("refurbished")
    ? "refurbished"
    : undefined;

  if (normalized.includes("vicino a me") || normalized.includes("near me")) {
    entities.location = "near-me";
  } else {
    const inMatch = normalized.match(/\b(?:a|in)\s+([a-zà-ÿ' -]{2,})$/i);
    if (inMatch?.[1]) {
      entities.location = inMatch[1].trim();
    }
  }

  const brand = knownBrands.find((entry) => tokens.includes(entry) || normalized.includes(entry));
  if (brand) entities.brand = brand;

  const category = knownCategories.find((entry) => tokens.includes(entry) || normalized.includes(entry));
  if (category) entities.category = category;

  return {
    raw: rawQuery,
    normalized,
    tokens,
    isHandle,
    isShort,
    intent,
    confidence,
    entities,
  };
}

export function matchesScope(item: SearchCatalogItem, scope: SearchScopeId): boolean {
  const words = `${item.title} ${item.description} ${item.keywords.join(" ")}`.toLowerCase();
  const href = item.href.toLowerCase();
  const group = item.group.toLowerCase();

  if (scope === "verified-sellers") {
    return (
      item.badge === "VERIFIED" ||
      group.includes("verified sellers") ||
      words.includes("verified seller") ||
      words.includes("venditore verificato")
    );
  }

  if (scope === "users") {
    return (
      item.entityType === "seller" ||
      href.includes("/profile/") ||
      href.includes("/seller/") ||
      words.includes("user") ||
      words.includes("seller") ||
      words.includes("buyer")
    );
  }

  if (scope === "services") {
    return item.entityType === "service" || words.includes("service") || words.includes("offer");
  }

  if (scope === "products") {
    return item.entityType === "product" || item.entityType === "brand" || item.entityType === "category" || item.entityType === "collection";
  }

  if (scope === "wallet") {
    return item.entityType === "wallet" || words.includes("wallet") || words.includes("address");
  }

  return item.entityType === "page" || item.entityType === "action";
}

function computeTextScore(item: SearchCatalogItem, parsed: ParsedQuery): Pick<ScoreBreakdown, "exactMatch" | "prefixMatch" | "fuzzyMatch"> {
  const query = parsed.normalized;
  if (!query) return { exactMatch: 0, prefixMatch: 0, fuzzyMatch: 0 };

  const title = normalizeText(item.title);
  const keywordBlob = normalizeText(item.keywords.join(" "));

  let exactMatch = 0;
  let prefixMatch = 0;
  let fuzzyMatch = 0;

  if (title === query) exactMatch = 210;
  else if (title.startsWith(query)) prefixMatch = 124;
  else if (title.includes(query)) prefixMatch = 72;

  const fuzzyTitle = fuzzySimilarity(title, query);
  const fuzzyKeyword = fuzzySimilarity(keywordBlob, query);
  fuzzyMatch = Math.round(Math.max(fuzzyTitle, fuzzyKeyword) * 92);

  return { exactMatch, prefixMatch, fuzzyMatch };
}

function computeIntentAlignment(item: SearchCatalogItem, parsed: ParsedQuery): number {
  if (!parsed.normalized) return 0;

  if (parsed.intent === "profile" && item.entityType === "seller") return 72;
  if (parsed.intent === "navigation" && item.entityType === "page") return 66;
  if (parsed.intent === "buy" && (item.entityType === "product" || item.entityType === "brand" || item.entityType === "category")) return 80;
  if (parsed.intent === "sell" && item.entityType === "action") return 62;
  if (parsed.intent === "support" && (item.group.toLowerCase().includes("trust") || item.entityType === "page")) return 58;

  return 18;
}

function computeEntityFilterBoost(item: SearchCatalogItem, parsed: ParsedQuery): number {
  let score = 0;

  if (parsed.entities.brand && item.brand && normalizeText(item.brand).includes(parsed.entities.brand)) score += 26;
  if (parsed.entities.category && item.category && normalizeText(item.category).includes(parsed.entities.category)) score += 22;
  if (parsed.entities.color && item.color && normalizeText(item.color).includes(parsed.entities.color)) score += 14;
  if (parsed.entities.condition && item.condition === parsed.entities.condition) score += 14;
  if (parsed.entities.location && item.location && normalizeText(item.location).includes(normalizeText(parsed.entities.location))) score += 12;

  if (parsed.entities.minPrice !== undefined || parsed.entities.maxPrice !== undefined) {
    if (typeof item.price === "number") {
      const minOk = parsed.entities.minPrice === undefined || item.price >= parsed.entities.minPrice;
      const maxOk = parsed.entities.maxPrice === undefined || item.price <= parsed.entities.maxPrice;
      score += minOk && maxOk ? 24 : -28;
    } else {
      score -= 6;
    }
  }

  return score;
}

export function scoreSearchItem(item: SearchCatalogItem, context: ScoringContext): ScoreBreakdown {
  const { parsed, recentMap, nowTs, activeScope } = context;
  const text = computeTextScore(item, parsed);
  const intentAlignment = computeIntentAlignment(item, parsed) + computeEntityFilterBoost(item, parsed);

  const popularity = Math.round((item.popularity ?? 45) * 0.28);
  const conversionLikelihood = Math.round((item.conversionScore ?? 0.45) * 44);
  const businessPriority = Math.round((item.businessPriority ?? 3) * 7);

  let recency = 0;
  if (item.recencyTs) {
    const ageHours = Math.max(0, (nowTs - item.recencyTs) / 3_600_000);
    recency = Math.round(28 * Math.exp(-ageHours / 72));
  }

  let availability = 0;
  if (item.availability === "in_stock") availability = 24;
  else if (item.availability === "low_stock") availability = 9;
  else if (item.availability === "out_of_stock") availability = -34;

  const userHistory = Math.round((recentMap.get(item.id) ?? 0) * 22);
  const scopeAlignment = activeScope ? (matchesScope(item, activeScope) ? 34 : -44) : 0;

  const final =
    (item.scoreHint ?? 0) +
    text.exactMatch +
    text.prefixMatch +
    text.fuzzyMatch +
    popularity +
    recency +
    userHistory +
    conversionLikelihood +
    availability +
    businessPriority +
    intentAlignment +
    scopeAlignment;

  return {
    exactMatch: text.exactMatch,
    prefixMatch: text.prefixMatch,
    fuzzyMatch: text.fuzzyMatch,
    popularity,
    recency,
    userHistory,
    conversionLikelihood,
    availability,
    businessPriority,
    intentAlignment,
    scopeAlignment,
    final,
  };
}

export function getQueryDebounceMs(parsed: ParsedQuery): number {
  if (!parsed.normalized) return 80;
  if (parsed.isShort) return 60;
  if (parsed.isHandle) return 70;
  if (parsed.intent === "navigation") return 85;
  if (parsed.intent === "buy") return 120;
  return 105;
}

export function getMatchRanges(text: string, query: string): Array<{ start: number; end: number }> {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const idx = normalizedText.indexOf(normalizedQuery);
  if (idx < 0) return [];
  return [{ start: idx, end: idx + normalizedQuery.length }];
}
