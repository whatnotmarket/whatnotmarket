import { buildIndexableMetadata } from "@/lib/app/seo/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Become a Verified Seller on OpenlyMarket",
  description:
    "Start selling digital products and services on OpenlyMarket by completing seller onboarding, verification checks, and secure marketplace setup.",
  path: "/become-seller",
});

export default function BecomeSellerLayout({ children }: { children: React.ReactNode }) {
  return children;
}

