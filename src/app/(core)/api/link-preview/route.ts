import { ProductParserService } from "@/lib/domains/parsers/product-parser-service";
import { NextRequest,NextResponse } from "next/server";

// --- Security: basic SSRF protections
function isHttpUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isBlockedHostname(hostname: string) {
  // Block localhost + common private ranges (basic check).
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local")) return true;
  if (h === "127.0.0.1" || h === "::1") return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const url = body?.url;

    if (typeof url !== "string" || !isHttpUrl(url)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const u = new URL(url);
    if (isBlockedHostname(u.hostname)) {
      return NextResponse.json({ error: "Blocked host" }, { status: 400 });
    }

    const parserService = new ProductParserService();
    const data = await parserService.parseProduct(url);

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Link preview error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch preview" },
      { status: 500 }
    );
  }
}

