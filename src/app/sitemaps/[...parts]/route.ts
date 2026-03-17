import { NextResponse } from "next/server";
import {
  SITEMAP_CACHE_CONTROL,
  getCategoriesSitemapEntries,
  getCompanySitemapEntries,
  getListingSitemapChunks,
  getPagesSitemapEntries,
  getProductsSitemapEntries,
  getServicesSitemapEntries,
  getUsersSitemapEntries,
  renderUrlset,
} from "@/lib/sitemaps";

export const runtime = "nodejs";
export const revalidate = 900;
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ parts?: string[] }>;
};

function xmlResponse(xml: string): NextResponse {
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": SITEMAP_CACHE_CONTROL,
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { parts } = await context.params;
  const [rawKey] = parts || [];
  if (!rawKey || (parts && parts.length !== 1)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const key = rawKey.toLowerCase().replace(/\.xml$/, "").trim();

  if (key === "listings") {
    const chunks = await getListingSitemapChunks();
    return xmlResponse(renderUrlset(chunks[0] || []));
  }

  const listingChunkMatch = key.match(/^listings-(\d+)$/);
  if (listingChunkMatch) {
    const chunkIndex = Number(listingChunkMatch[1]) - 1;
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const chunks = await getListingSitemapChunks();
    const chunk = chunks[chunkIndex];
    if (!chunk) {
      return new NextResponse("Not found", { status: 404 });
    }

    return xmlResponse(renderUrlset(chunk));
  }

  if (key === "categories") {
    const entries = await getCategoriesSitemapEntries();
    return xmlResponse(renderUrlset(entries));
  }

  if (key === "users") {
    const entries = await getUsersSitemapEntries();
    return xmlResponse(renderUrlset(entries));
  }

  if (key === "pages") {
    const entries = getPagesSitemapEntries();
    return xmlResponse(renderUrlset(entries));
  }

  if (key === "company") {
    const entries = getCompanySitemapEntries();
    return xmlResponse(renderUrlset(entries));
  }

  if (key === "products") {
    const entries = getProductsSitemapEntries();
    return xmlResponse(renderUrlset(entries));
  }

  if (key === "services") {
    const entries = getServicesSitemapEntries();
    return xmlResponse(renderUrlset(entries));
  }

  return new NextResponse("Not found", { status: 404 });
}
