import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/app/seo/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "OpenlyMarket FAQ for Buyers, Sellers, and Escrow Flows",
  description:
    "Read the OpenlyMarket FAQ to understand escrow protection, seller verification, payments, disputes, and best practices for secure marketplace use.",
  path: "/faq",
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}


