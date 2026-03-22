import { buildIndexableMetadata } from "@/lib/app/seo/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Smart Search for Listings, Sellers, and Buyer Requests",
  description:
    "Use OpenlyMarket smart search to quickly find listings, verified sellers, and buyer requests with intent-aware discovery and fast filtering.",
  path: "/smart-search",
});

export default function SmartSearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}


