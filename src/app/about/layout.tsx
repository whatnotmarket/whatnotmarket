import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "About OpenlyMarket and Our Secure Marketplace Mission",
  description:
    "Learn how OpenlyMarket combines privacy-first design, verified sellers, and escrow-style transaction safety to build a trusted digital marketplace.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
