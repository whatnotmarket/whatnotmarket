import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Contact OpenlyMarket Support, Sales, and Partnerships",
  description:
    "Reach OpenlyMarket support for transaction help, account assistance, escrow questions, and partnership opportunities for marketplace growth.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

