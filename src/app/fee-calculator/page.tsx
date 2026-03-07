import type { Metadata } from "next";
import { FeeCalculatorClient } from "./FeeCalculatorClient";

export const metadata: Metadata = {
  title: "Escrow Fee Calculator | Whatnot Market",
  description:
    "Calculate escrow fees instantly with transparent pricing for standard and concierge transactions, including payment method costs and competitor comparisons.",
  openGraph: {
    title: "Escrow Fee Calculator | Whatnot Market",
    description:
      "Estimate escrow pricing in seconds with transparent fee tiers, payment method breakdowns, and high-value transaction support.",
    type: "website",
    url: "/fee-calculator",
  },
};

export default function FeeCalculatorPage() {
  return <FeeCalculatorClient />;
}
