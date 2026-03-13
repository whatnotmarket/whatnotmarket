import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Buy Anywhere with Crypto Using OpenlyMarket Proxy Orders",
  description:
    "Use OpenlyMarket proxy orders to purchase products from external websites with crypto payments, protected workflows, and transparent order tracking.",
  path: "/buy-with-crypto",
});

export default function BuyWithCryptoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

