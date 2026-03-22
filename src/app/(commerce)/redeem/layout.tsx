import { buildIndexableMetadata } from "@/lib/app/seo/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Redeem Codes and Marketplace Benefits on OpenlyMarket",
  description:
    "Redeem OpenlyMarket codes and promotional benefits with clear eligibility rules and secure account-level application of rewards.",
  path: "/redeem",
});

export default function RedeemLayout({ children }: { children: React.ReactNode }) {
  return children;
}


