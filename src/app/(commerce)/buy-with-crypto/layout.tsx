import { buildIndexableMetadata } from "@/lib/app/seo/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Buy Anywhere With Crypto Proxy Orders",
  description:
    "Use OpenlyMarket proxy orders to purchase products from external websites with crypto payments, protected workflows, and transparent order tracking.",
  path: "/buy-with-crypto",
});

export default function BuyWithCryptoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

