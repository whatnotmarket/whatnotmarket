import { buildIndexableMetadata } from "@/lib/app/seo/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Buyer Requests Marketplace for Products and Services",
  description:
    "Browse and post buyer requests on OpenlyMarket to connect with qualified sellers, receive offers, and complete transactions through secure workflows.",
  path: "/requests",
});

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

