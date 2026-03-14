import { NextResponse } from "next/server";
import {
  SITEMAP_CACHE_CONTROL,
  getSitemapIndexEntries,
  renderSitemapIndex,
} from "@/lib/sitemaps";

export const runtime = "nodejs";
export const revalidate = 900;

export async function GET() {
  const entries = await getSitemapIndexEntries();
  const xml = renderSitemapIndex(entries);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": SITEMAP_CACHE_CONTROL,
    },
  });
}
