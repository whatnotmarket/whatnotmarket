import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "OpenlyMarket Disclaimer and Risk Disclosure",
  description:
    "Review OpenlyMarket disclaimer details covering platform limitations, user responsibility, and risk disclosures related to digital marketplace activity.",
  path: "/disclaimer",
});

export default function DisclaimerLayout({ children }: { children: React.ReactNode }) {
  return children;
}

