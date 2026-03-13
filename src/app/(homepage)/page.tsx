import { HomepageClient } from "./HomepageClient";
import type { Metadata } from "next";
import { buildIndexableMetadata } from "@/lib/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Secure Crypto Marketplace and Real-Time Community Chat",
  description:
    "OpenlyMarket is a secure crypto marketplace where buyers and sellers trade digital goods, services, and requests with real-time community chat and escrow-style protection.",
  path: "/",
});

export default function HomepagePage() {
  return (
    <>
      <h1 className="sr-only">OpenlyMarket Global Marketplace and Community Chat</h1>
      <HomepageClient />
    </>
  );
}
