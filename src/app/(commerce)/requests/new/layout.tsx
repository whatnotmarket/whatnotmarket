import { buildIndexableMetadata } from "@/lib/app/seo/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Create a Buyer Request",
  description:
    "Post a buyer request on OpenlyMarket, receive offers from qualified sellers, and complete transactions through secure escrow workflows.",
  path: "/requests/new",
});

export default function CreateRequestLayout({ children }: { children: React.ReactNode }) {
  return children;
}

