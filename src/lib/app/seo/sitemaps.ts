import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { SITE_URL } from "@/lib/core/config/site-config";
import { isReservedProfileHandle } from "@/lib/domains/security/identity-guards";

export const SITEMAP_URL_LIMIT = 50_000;
export const SITEMAP_CACHE_SECONDS = 900;
export const SITEMAP_CACHE_CONTROL =
  "public, s-maxage=900, stale-while-revalidate=3600";

const SITEMAP_XMLNS = "http://www.sitemaps.org/schemas/sitemap/0.9";
const DB_PAGE_SIZE = 1_000;
const DB_HARD_LIMIT = 300_000;
const IMPORTANT_LISTINGS_HOURLY_LIMIT = 500;

type SitemapUrlEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
};

type ListingRecord = {
  id: string;
  title: string | null;
  category: string | null;
  created_at: string | null;
  updated_at?: string | null;
};

type CategoryRecord = {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type UserRecord = {
  username: string | null;
  is_admin?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type BatchResult<T> = {
  data: T[] | null;
  error: { message?: string } | null;
};

const CORE_PAGE_PATHS = ["/", "/market", "/requests", "/requests/new", "/link"] as const;

const COMPANY_PAGE_PATHS = [
  "/about",
  "/business",
  "/roadmap",
  "/open-source",
  "/contact",
  "/faq",
  "/terms",
  "/privacy",
  "/disclaimer",
  "/broker",
] as const;

const PRODUCT_PAGE_PATHS = ["/buy-with-crypto", "/fee-calculator", "/redeem", "/refund"] as const;

const SERVICE_PAGE_PATHS = [
  "/secure-transaction",
  "/proxy-orders",
  "/promote-listings",
  "/become-seller",
  "/become-escrow",
  "/escrow",
  "/sell",
  "/open-dispute",
] as const;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function absoluteUrl(pathname: string): string {
  if (/^https?:\/\//i.test(pathname)) return pathname;
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_URL}${normalizedPath}`;
}

function toDateOnly(value?: string | null): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

function toTimestamp(value?: string | null): number {
  if (!value) return 0;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 0;
  return parsed.getTime();
}

function maxLastmod(entries: SitemapUrlEntry[]): string | undefined {
  const normalized = entries.map((entry) => entry.lastmod).filter(Boolean) as string[];
  if (!normalized.length) return undefined;
  return normalized.sort().at(-1);
}

function slugifySegment(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function normalizeHandle(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._-]/g, "");
}

function listingSlug(listingId: string, title: string | null): string {
  const titlePart = slugifySegment(title || "listing") || "listing";
  return `${titlePart}-${listingId}`;
}

function splitChunks<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function selectAllRows<T>(
  runBatch: (from: number, to: number) => PromiseLike<BatchResult<T>>
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  while (offset < DB_HARD_LIMIT) {
    const nextOffset = offset + DB_PAGE_SIZE - 1;
    const { data, error } = await runBatch(offset, nextOffset);

    if (error) {
      throw new Error(error.message || "Failed to load sitemap records.");
    }

    if (!data || data.length === 0) break;
    rows.push(...data);

    if (data.length < DB_PAGE_SIZE) break;
    offset += DB_PAGE_SIZE;
  }

  return rows;
}

async function fetchListingRecords(): Promise<ListingRecord[]> {
  const admin = createAdminClient();
  const primarySelect =
    "id,title,category,created_at,updated_at,status,safety_status,visibility_state";

  try {
    return await selectAllRows<ListingRecord>((from, to) =>
      admin
        .from("requests")
        .select(primarySelect)
        .eq("status", "open")
        .eq("safety_status", "published")
        .eq("visibility_state", "normal")
        .order("created_at", { ascending: false })
        .range(from, to)
    );
  } catch {
    return selectAllRows<ListingRecord>((from, to) =>
      admin
        .from("requests")
        .select("id,title,category,created_at,status")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .range(from, to)
    );
  }
}

async function fetchCategoryRecords(): Promise<CategoryRecord[]> {
  const admin = createAdminClient();
  const primarySelect = "id,created_at,updated_at,is_verified";

  try {
    return await selectAllRows<CategoryRecord>((from, to) =>
      admin
        .from("categories")
        .select(primarySelect)
        .eq("is_verified", true)
        .order("id", { ascending: true })
        .range(from, to)
    );
  } catch {
    return selectAllRows<CategoryRecord>((from, to) =>
      admin
        .from("categories")
        .select("id,created_at")
        .order("id", { ascending: true })
        .range(from, to)
    );
  }
}

async function fetchUserRecords(): Promise<UserRecord[]> {
  const admin = createAdminClient();
  const primarySelect = "username,is_admin,created_at,updated_at";

  try {
    return await selectAllRows<UserRecord>((from, to) =>
      admin
        .from("profiles")
        .select(primarySelect)
        .eq("is_admin", false)
        .not("username", "is", null)
        .order("updated_at", { ascending: false })
        .range(from, to)
    );
  } catch {
    return selectAllRows<UserRecord>((from, to) =>
      admin
        .from("profiles")
        .select("username,created_at")
        .not("username", "is", null)
        .order("created_at", { ascending: false })
        .range(from, to)
    );
  }
}

const getCachedListingRecords = unstable_cache(fetchListingRecords, ["sitemap:listings:v3"], {
  revalidate: SITEMAP_CACHE_SECONDS,
  tags: ["sitemap:index", "sitemap:listings", "sitemap:categories"],
});

const getCachedCategoryRecords = unstable_cache(fetchCategoryRecords, ["sitemap:categories:v3"], {
  revalidate: SITEMAP_CACHE_SECONDS,
  tags: ["sitemap:index", "sitemap:categories"],
});

const getCachedUserRecords = unstable_cache(fetchUserRecords, ["sitemap:users:v3"], {
  revalidate: SITEMAP_CACHE_SECONDS,
  tags: ["sitemap:index", "sitemap:users"],
});

export async function getListingSitemapChunks(): Promise<SitemapUrlEntry[][]> {
  const rows = await getCachedListingRecords();
  const sortedRows = [...rows].sort((left, right) => {
    const leftTs = toTimestamp(left.updated_at || left.created_at);
    const rightTs = toTimestamp(right.updated_at || right.created_at);
    return rightTs - leftTs;
  });

  const urls: SitemapUrlEntry[] = sortedRows.map((row, index) => ({
    loc: absoluteUrl(`/listing/${listingSlug(row.id, row.title)}`),
    lastmod: toDateOnly(row.updated_at || row.created_at),
    changefreq: index < IMPORTANT_LISTINGS_HOURLY_LIMIT ? "hourly" : "daily",
  }));
  return splitChunks(urls, SITEMAP_URL_LIMIT);
}

export async function getCategoriesSitemapEntries(): Promise<SitemapUrlEntry[]> {
  const [categories, listings] = await Promise.all([
    getCachedCategoryRecords(),
    getCachedListingRecords(),
  ]);

  const categoryEntries = categories.map((category) => ({
    loc: absoluteUrl(`/category/${category.id}`),
    lastmod: toDateOnly(category.updated_at || category.created_at),
    changefreq: "daily" as const,
  }));

  const categorySet = new Set(categories.map((category) => String(category.id).toLowerCase()));
  const seenSubcategoryPaths = new Set<string>();
  const subcategoryEntries: SitemapUrlEntry[] = [];

  for (const listing of listings) {
    const categorySlug = slugifySegment(String(listing.category || ""));
    if (!categorySlug || !categorySet.has(categorySlug)) continue;

    const productSlug = slugifySegment(listing.title || "");
    if (!productSlug) continue;

    const path = `/category/${categorySlug}/${productSlug}`;
    if (seenSubcategoryPaths.has(path)) continue;
    seenSubcategoryPaths.add(path);

    subcategoryEntries.push({
      loc: absoluteUrl(path),
      lastmod: toDateOnly(listing.updated_at || listing.created_at),
      changefreq: "daily",
    });
  }

  return [...categoryEntries, ...subcategoryEntries].slice(0, SITEMAP_URL_LIMIT);
}

export async function getUsersSitemapEntries(): Promise<SitemapUrlEntry[]> {
  const rows = await getCachedUserRecords();
  const seen = new Set<string>();
  const users: SitemapUrlEntry[] = [];

  for (const row of rows) {
    const normalized = normalizeHandle(String(row.username || ""));
    if (!normalized || isReservedProfileHandle(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    users.push({
      loc: absoluteUrl(`/user/${encodeURIComponent(normalized)}`),
      lastmod: toDateOnly(row.updated_at || row.created_at),
      changefreq: "daily",
    });
  }

  return users.slice(0, SITEMAP_URL_LIMIT);
}

function staticEntriesFromPaths(
  paths: readonly string[],
  changefreq: SitemapUrlEntry["changefreq"]
): SitemapUrlEntry[] {
  const today = new Date().toISOString().slice(0, 10);
  return paths.map((path) => ({
    loc: absoluteUrl(path),
    lastmod: today,
    changefreq,
  }));
}

export function getPagesSitemapEntries(): SitemapUrlEntry[] {
  return staticEntriesFromPaths(CORE_PAGE_PATHS, "daily");
}

export function getCompanySitemapEntries(): SitemapUrlEntry[] {
  return staticEntriesFromPaths(COMPANY_PAGE_PATHS, "weekly");
}

export function getProductsSitemapEntries(): SitemapUrlEntry[] {
  return staticEntriesFromPaths(PRODUCT_PAGE_PATHS, "daily");
}

export function getServicesSitemapEntries(): SitemapUrlEntry[] {
  return staticEntriesFromPaths(SERVICE_PAGE_PATHS, "daily");
}

export async function getSitemapIndexEntries(): Promise<SitemapUrlEntry[]> {
  const [listingChunksResult, categoriesResult, usersResult] = await Promise.allSettled([
    getListingSitemapChunks(),
    getCategoriesSitemapEntries(),
    getUsersSitemapEntries(),
  ]);

  const pages = getPagesSitemapEntries();
  const company = getCompanySitemapEntries();
  const products = getProductsSitemapEntries();
  const services = getServicesSitemapEntries();

  const listingChunks =
    listingChunksResult.status === "fulfilled" ? listingChunksResult.value : [];
  const categories =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const users = usersResult.status === "fulfilled" ? usersResult.value : [];

  const entries: SitemapUrlEntry[] = [];

  if (listingChunksResult.status === "fulfilled" && listingChunks.length <= 1) {
    entries.push({
      loc: absoluteUrl("/sitemaps/listings.xml"),
      lastmod: maxLastmod(listingChunks[0] || []),
    });
  } else if (listingChunksResult.status === "fulfilled") {
    listingChunks.forEach((chunk, index) => {
      entries.push({
        loc: absoluteUrl(`/sitemaps/listings-${index + 1}.xml`),
        lastmod: maxLastmod(chunk),
      });
    });
  } else {
    // Keep sitemap index readable even if listings query fails temporarily.
    entries.push({
      loc: absoluteUrl("/sitemaps/listings.xml"),
    });
  }

  entries.push({
    loc: absoluteUrl("/sitemaps/categories.xml"),
    lastmod: categories.length ? maxLastmod(categories) : undefined,
  });
  entries.push({
    loc: absoluteUrl("/sitemaps/users.xml"),
    lastmod: users.length ? maxLastmod(users) : undefined,
  });
  entries.push({
    loc: absoluteUrl("/sitemaps/pages.xml"),
    lastmod: maxLastmod(pages),
  });
  entries.push({
    loc: absoluteUrl("/sitemaps/company.xml"),
    lastmod: maxLastmod(company),
  });
  entries.push({
    loc: absoluteUrl("/sitemaps/products.xml"),
    lastmod: maxLastmod(products),
  });
  entries.push({
    loc: absoluteUrl("/sitemaps/services.xml"),
    lastmod: maxLastmod(services),
  });

  return entries;
}

export function renderUrlset(entries: SitemapUrlEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmodXml = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : "";
      const changefreqXml = entry.changefreq
        ? `\n    <changefreq>${entry.changefreq}</changefreq>`
        : "";
      return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmodXml}${changefreqXml}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${SITEMAP_XMLNS}">\n${body}\n</urlset>`;
}

export function renderSitemapIndex(entries: SitemapUrlEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmodXml = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : "";
      return `  <sitemap>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmodXml}\n  </sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="${SITEMAP_XMLNS}">\n${body}\n</sitemapindex>`;
}

export function revalidateMarketplaceSitemaps() {
  revalidateTag("sitemap:index", "max");
  revalidateTag("sitemap:listings", "max");
  revalidateTag("sitemap:categories", "max");
  revalidateTag("sitemap:users", "max");
  revalidateTag("sitemap:pages", "max");
  revalidateTag("sitemap:company", "max");
  revalidateTag("sitemap:products", "max");
  revalidateTag("sitemap:services", "max");
}

