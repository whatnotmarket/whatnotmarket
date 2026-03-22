import { buildIndexableMetadata } from "@/lib/app/seo/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildIndexableMetadata({
  title: "How Secure Transactions Work on OpenlyMarket",
  description:
    "Learn how OpenlyMarket secure transactions protect buyers and sellers through escrow-style flows, verification controls, and structured dispute handling.",
  path: "/secure-transaction",
});

export default function SecureTransactionLayout({ children }: { children: React.ReactNode }) {
  return children;
}


