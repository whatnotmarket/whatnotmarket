import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/app/seo/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Become an Escrow Partner on OpenlyMarket",
  description:
    "Apply to become an OpenlyMarket escrow partner and help secure transactions with trusted verification standards and transparent release workflows.",
  path: "/become-escrow",
});

export default function BecomeEscrowLayout({ children }: { children: React.ReactNode }) {
  return children;
}

