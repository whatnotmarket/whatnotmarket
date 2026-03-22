import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/app/seo/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Business Escrow Solutions for High-Value Transactions",
  description:
    "Use OpenlyMarket Business escrow solutions to secure high-value deals, reduce fraud risk, and manage buyer-seller transactions with transparent workflows.",
  path: "/business",
});

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">OpenlyMarket Business Escrow Solutions</h1>
      {children}
    </>
  );
}

