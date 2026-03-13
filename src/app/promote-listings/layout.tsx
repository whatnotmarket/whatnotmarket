import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Promote Listings to Reach More Qualified Buyers",
  description:
    "Boost listing visibility on OpenlyMarket with promotion tools designed to improve discovery, attract high-intent buyers, and increase conversion quality.",
  path: "/promote-listings",
});

export default function PromoteListingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

