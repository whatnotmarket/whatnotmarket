import { buildIndexableMetadata } from "@/lib/app/seo/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildIndexableMetadata({
  title: "OpenlyMarket Terms of Service and Platform Rules",
  description:
    "Read the OpenlyMarket terms of service to understand platform usage rules, account responsibilities, transaction obligations, and policy enforcement.",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}


