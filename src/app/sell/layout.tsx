import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Create Listings and Sell Digital Goods on OpenlyMarket",
  description:
    "Publish listings on OpenlyMarket to sell digital products and services with verified seller workflows, buyer trust signals, and secure deal handling.",
  path: "/sell",
});

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children;
}

