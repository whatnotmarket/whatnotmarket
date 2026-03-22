import {
SITEMAP_CACHE_CONTROL,
getSitemapIndexEntries,
renderSitemapIndex,
} from "@/lib/app/seo/sitemaps";
import { SITE_URL } from "@/lib/core/config/site-config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 900;

export async function GET() {
  const fallbackEntries = [
    { loc: `${SITE_URL}/sitemaps/listings.xml` },
    { loc: `${SITE_URL}/sitemaps/categories.xml` },
    { loc: `${SITE_URL}/sitemaps/users.xml` },
    { loc: `${SITE_URL}/sitemaps/pages.xml` },
    { loc: `${SITE_URL}/sitemaps/company.xml` },
    { loc: `${SITE_URL}/sitemaps/products.xml` },
    { loc: `${SITE_URL}/sitemaps/services.xml` },
  ];
  let xml = renderSitemapIndex(fallbackEntries);

  try {
    const entries = await getSitemapIndexEntries();
    xml = renderSitemapIndex(entries);
  } catch {
    // Never fail sitemap index: keep a valid XML fallback for crawlers.
  }

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": SITEMAP_CACHE_CONTROL,
    },
  });
}

