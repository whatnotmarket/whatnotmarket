import { buildIndexableMetadata } from "@/lib/app/seo/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Refund Policy and Dispute Resolution on OpenlyMarket",
  description:
    "Understand OpenlyMarket refund policy, dispute timelines, and escalation steps to resolve transaction issues with transparent decision workflows.",
  path: "/refund",
});

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return children;
}


