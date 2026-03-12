import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase-admin";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://openly.market";

// Helper to clean handles
function cleanHandle(handle: string) {
  return handle.trim().toLowerCase().replace(/^@+/, "").replace(/[^a-z0-9._-]/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/market`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/buy-with-crypto`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/sell`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/global-chat`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/smart-search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/escrow`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/become-seller`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/become-escrow`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/fee-calculator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/proxy-orders`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/promote-listings`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/roadmap`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/open-source`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/refund`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/secure-transaction`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/redeem`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createAdminClient();

    // 1. Fetch Categories
    const { data: categories } = await supabase
      .from("categories")
      .select("id, created_at")
      .limit(100);

    if (categories) {
      const categoryRoutes = categories.map((cat) => ({
        url: `${BASE_URL}/category/${cat.id}`,
        lastModified: cat.created_at ? new Date(cat.created_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
      dynamicRoutes = [...dynamicRoutes, ...categoryRoutes];
    }

    // 2. Fetch Verified Sellers
    const { data: sellers } = await supabase
      .from("profiles")
      .select("username, updated_at")
      .eq("seller_status", "verified")
      .not("username", "is", null)
      .limit(1000);

    if (sellers) {
      const sellerRoutes = sellers
        .filter((s) => s.username)
        .map((s) => ({
          url: `${BASE_URL}/seller/@${cleanHandle(s.username!)}`,
          lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
      dynamicRoutes = [...dynamicRoutes, ...sellerRoutes];
    }

    // 3. Fetch Active Requests (Public Listings)
    // Using explicit safety checks if columns exist, otherwise fallback to basic status
    // We try to select columns that we know exist from migration analysis
    try {
      const { data: requests } = await supabase
        .from("requests")
        .select("id, created_at")
        .eq("status", "open")
        .eq("safety_status", "published") // Assuming migration 20260311170000_trust_safety_core.sql is applied
        .eq("visibility_state", "normal")
        .limit(500);

      if (requests) {
        const requestRoutes = requests.map((req) => ({
          url: `${BASE_URL}/requests/${req.id}`,
          lastModified: req.created_at ? new Date(req.created_at) : new Date(),
          changeFrequency: "daily" as const,
          priority: 0.6,
        }));
        dynamicRoutes = [...dynamicRoutes, ...requestRoutes];
      }
    } catch (e) {
      // Fallback if safety columns don't exist yet
      const { data: requests } = await supabase
        .from("requests")
        .select("id, created_at")
        .eq("status", "open")
        .limit(500);

       if (requests) {
        const requestRoutes = requests.map((req) => ({
          url: `${BASE_URL}/requests/${req.id}`,
          lastModified: req.created_at ? new Date(req.created_at) : new Date(),
          changeFrequency: "daily" as const,
          priority: 0.6,
        }));
        dynamicRoutes = [...dynamicRoutes, ...requestRoutes];
      }
    }

  } catch (error) {
    console.error("Sitemap generation error:", error);
    // Fallback to just static routes if DB fails
  }

  return [...staticRoutes, ...dynamicRoutes];
}
