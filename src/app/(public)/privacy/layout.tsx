import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/app/seo/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "OpenlyMarket Privacy Policy and Data Handling Practices",
  description:
    "Review the OpenlyMarket privacy policy to understand how data is processed, protected, and used to support secure marketplace operations.",
  path: "/privacy",
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}


