import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/dashboard/",
          "/install/",
          "/onboarding/",
          "/profile/",
          "/track/",
        ],
      },
      {
        userAgent: [
          "OAI-SearchBot",
          "GPTBot",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
          "PerplexityBot",
          "Googlebot",
          "Google-Extended",
          "Bingbot",
          "Applebot",
          "CCBot",
        ],
        allow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
