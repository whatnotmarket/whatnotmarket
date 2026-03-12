import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://openlymarket.xyz";

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
