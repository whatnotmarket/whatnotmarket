import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Marketplace for Trusted Digital Products and Services",
  description:
    "Browse the OpenlyMarket marketplace to discover trusted digital products, verified sellers, and escrow-protected deals with crypto-friendly payments.",
  path: "/market",
});

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">OpenlyMarket Marketplace</h1>
      {children}
    </>
  );
}
