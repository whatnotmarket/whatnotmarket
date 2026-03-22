import type { Metadata } from "next";
import { FeeCalculatorPageShell } from "./FeeCalculatorPageShell";
import { buildIndexableMetadata } from "@/lib/app/seo/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Escrow Fee Calculator for Crypto and Marketplace Deals",
  description:
    "Calculate escrow costs instantly with transparent pricing for standard and concierge transactions, payment method adjustments, and high-value deal scenarios.",
  path: "/fee-calculator",
});

export default function FeeCalculatorPage() {
  return <FeeCalculatorPageShell />;
}


