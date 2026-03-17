import type { LucideIcon } from "lucide-react";

export type SearchGroup = string;

export type SearchEntityType =
  | "product"
  | "brand"
  | "category"
  | "seller"
  | "collection"
  | "service"
  | "page"
  | "action"
  | "wallet"
  | "request"
  | "prediction"
  | "recent"
  | "trending";

export type ItemAvailability = "in_stock" | "low_stock" | "out_of_stock";

export type SearchCatalogItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  group: SearchGroup;
  icon: LucideIcon;
  entityType: SearchEntityType;
  keywords: string[];
  badge?: string;
  scoreHint?: number;
  avatarUrl?: string;
  thumbnailUrl?: string;
  shortcut?: string;
  popularity?: number; // 0..100
  recencyTs?: number; // epoch ms
  conversionScore?: number; // 0..1
  businessPriority?: number; // 0..10
  price?: number;
  currency?: string;
  availability?: ItemAvailability;
  brand?: string;
  category?: string;
  color?: string;
  condition?: "new" | "used" | "refurbished";
  location?: string;
  source?: "catalog" | "live" | "recent" | "trending" | "prediction";
};

export type SearchScopeId = "users" | "services" | "products" | "wallet" | "pages" | "verified-sellers";

export type ParsedQuery = {
  raw: string;
  normalized: string;
  tokens: string[];
  isShort: boolean;
  isHandle: boolean;
  intent: "navigation" | "buy" | "sell" | "support" | "profile" | "discovery";
  confidence: number; // 0..1
  entities: {
    brand?: string;
    category?: string;
    color?: string;
    condition?: "new" | "used" | "refurbished";
    location?: string;
    minPrice?: number;
    maxPrice?: number;
  };
};

export type ScoreBreakdown = {
  exactMatch: number;
  prefixMatch: number;
  fuzzyMatch: number;
  popularity: number;
  recency: number;
  userHistory: number;
  conversionLikelihood: number;
  availability: number;
  businessPriority: number;
  intentAlignment: number;
  scopeAlignment: number;
  final: number;
};
