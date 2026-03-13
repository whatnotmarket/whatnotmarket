import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase-admin";
import { SITE_URL } from "@/lib/site-config";
import { PUBLIC_CATEGORY_PRODUCT_PATHS, PUBLIC_CATEGORY_SLUGS } from "@/lib/public-catalog";
import { SUPPORTED_LOCALES } from "@/i18n/config";
import { localizedPath } from "@/i18n/seo";

export const revalidate = 3600; // Revalidate sitemap every hour

const BASE_URL = SITE_URL;
const SITEMAP_QUERY_TIMEOUT_MS = 1500;
const DEFAULT_LAST_MODIFIED = new Date();

function withTimeout<T>(task: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Sitemap query timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    task()
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// Helper to clean handles
function cleanHandle(handle: string) {
  return handle.trim().toLowerCase().replace(/^@+/, "").replace(/[^a-z0-9._-]/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = DEFAULT_LAST_MODIFIED;
  const localizedCoreRoutes = ["/", "/market"] as const;
  const localizedRoutes: MetadataRoute.Sitemap = localizedCoreRoutes.flatMap((route) =>
    SUPPORTED_LOCALES.map((locale) => ({
      url: `${BASE_URL}${localizedPath(locale, route)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: route === "/" ? 0.95 : 0.85,
    }))
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    ...localizedRoutes,
    {
      url: `${BASE_URL}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/link`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/market`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/buy-with-crypto`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/sell`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/smart-search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/become-seller`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/become-escrow`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/broker`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/business`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/fee-calculator`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/promote-listings`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/requests`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/requests/new`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.45,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/disclaimer`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/roadmap`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/open-source`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/refund`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/secure-transaction`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/redeem`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...PUBLIC_CATEGORY_SLUGS.map((slug) => ({
      url: `${BASE_URL}/category/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...PUBLIC_CATEGORY_PRODUCT_PATHS.map((path) => ({
      url: `${BASE_URL}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.55,
    })),
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createAdminClient();
    const sellersPromise = withTimeout(
      async () =>
        supabase
          .from("profiles")
          .select("username, updated_at")
          .eq("seller_status", "verified")
          .not("username", "is", null)
          .not("username", "in", '("lucatest","whatnotmarket")')
          .limit(1000),
      SITEMAP_QUERY_TIMEOUT_MS
    );

    const requestsPromise = withTimeout(
      async () =>
        supabase
          .from("requests")
          .select("id, created_at")
          .eq("status", "open")
          .eq("safety_status", "published")
          .eq("visibility_state", "normal")
          .limit(500),
      SITEMAP_QUERY_TIMEOUT_MS
    );

    const [sellersResult, requestsResult] = await Promise.allSettled([sellersPromise, requestsPromise]);

    if (sellersResult.status === "fulfilled" && sellersResult.value.data) {
      const sellerRoutes = sellersResult.value.data
        .filter((s) => s.username)
        .map((s) => ({
          url: `${BASE_URL}/seller/${cleanHandle(s.username!)}`,
          lastModified: s.updated_at ? new Date(s.updated_at) : now,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
      dynamicRoutes = [...dynamicRoutes, ...sellerRoutes];
    }

    if (requestsResult.status === "fulfilled" && requestsResult.value.data) {
      const requestRoutes = requestsResult.value.data.map((req) => ({
        url: `${BASE_URL}/requests/${req.id}`,
        lastModified: req.created_at ? new Date(req.created_at) : now,
        changeFrequency: "daily" as const,
        priority: 0.6,
      }));
      dynamicRoutes = [...dynamicRoutes, ...requestRoutes];
    }

  } catch (error) {
    console.error("Sitemap generation error:", error);
    // Fallback to just static routes if DB fails
  }

  const seen = new Set<string>();
  return [...staticRoutes, ...dynamicRoutes]
    .filter((entry) => {
      if (seen.has(entry.url)) return false;
      seen.add(entry.url);
      return true;
    })
    .map((entry) => ({
      ...entry,
      changeFrequency: "hourly" as const,
    }));
}
