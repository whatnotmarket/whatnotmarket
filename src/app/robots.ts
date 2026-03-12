import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://openly.market";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/admintest/",
        "/api/",
        "/auth/",
        "/dashboard/",
        "/inbox/",
        "/install/",
        "/my-deals/",
        "/notifications/",
        "/notifichetest/",
        "/onboarding/",
        "/open-dispute/",
        "/profile/",
        "/requests/new/",
        "/testlogin/",
        "/track/",
        "/copy-demo/",
        "/copywebsiteadmin/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
