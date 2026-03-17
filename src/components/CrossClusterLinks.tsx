"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type CrossClusterVariant =
  | "about"
  | "broker"
  | "roadmap"
  | "open-source"
  | "faq"
  | "contact"
  | "disclaimer"
  | "refund"
  | "terms"
  | "privacy";

type LinkItem = {
  href: string;
  label: string;
};

const VARIANT_LINKS: Record<CrossClusterVariant, LinkItem[]> = {
  about: [
    { href: "/market", label: "Marketplace" },
    { href: "/requests", label: "Buyer Requests" },
    { href: "/secure-transaction", label: "Secure Transactions" },
    { href: "/become-seller", label: "Become Seller" },
    { href: "/broker", label: "Broker Escrow" },
    { href: "/faq", label: "FAQ" },
  ],
  broker: [
    { href: "/market", label: "Marketplace" },
    { href: "/requests", label: "Buyer Requests" },
    { href: "/secure-transaction", label: "Escrow Guide" },
    { href: "/proxy-orders", label: "Proxy Orders" },
    { href: "/business", label: "Business" },
    { href: "/contact", label: "Contact Sales" },
  ],
  roadmap: [
    { href: "/market", label: "Marketplace" },
    { href: "/requests", label: "Buyer Requests" },
    { href: "/promote-listings", label: "Promote Listings" },
    { href: "/open-source", label: "Open Source" },
    { href: "/business", label: "Business" },
    { href: "/contact", label: "Contact" },
  ],
  "open-source": [
    { href: "/market", label: "Marketplace" },
    { href: "/requests", label: "Buyer Requests" },
    { href: "/roadmap", label: "Roadmap" },
    { href: "/secure-transaction", label: "Security Model" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ],
  faq: [
    { href: "/market", label: "Marketplace" },
    { href: "/requests", label: "Buyer Requests" },
    { href: "/secure-transaction", label: "Escrow Guide" },
    { href: "/buy-with-crypto", label: "Buy with Crypto" },
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
  ],
  contact: [
    { href: "/market", label: "Marketplace" },
    { href: "/faq", label: "FAQ" },
    { href: "/requests", label: "Buyer Requests" },
    { href: "/secure-transaction", label: "Escrow Guide" },
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
  ],
  disclaimer: [
    { href: "/market", label: "Marketplace" },
    { href: "/secure-transaction", label: "Escrow Guide" },
    { href: "/refund", label: "Refund Policy" },
    { href: "/faq", label: "FAQ" },
    { href: "/terms", label: "Terms" },
    { href: "/contact", label: "Contact" },
  ],
  refund: [
    { href: "/market", label: "Marketplace" },
    { href: "/secure-transaction", label: "Escrow Guide" },
    { href: "/requests", label: "Buyer Requests" },
    { href: "/faq", label: "FAQ" },
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
  ],
  terms: [
    { href: "/market", label: "Marketplace" },
    { href: "/requests", label: "Buyer Requests" },
    { href: "/secure-transaction", label: "Escrow Guide" },
    { href: "/refund", label: "Refund Policy" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/contact", label: "Contact" },
  ],
  privacy: [
    { href: "/market", label: "Marketplace" },
    { href: "/requests", label: "Buyer Requests" },
    { href: "/secure-transaction", label: "Escrow Guide" },
    { href: "/faq", label: "FAQ" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/contact", label: "Contact" },
  ],
};

export function CrossClusterLinks({
  variant,
  title = "Explore More",
  className,
}: {
  variant: CrossClusterVariant;
  title?: string;
  className?: string;
}) {
  const links = VARIANT_LINKS[variant];

  return (
    <aside className={cn("rounded-2xl border border-white/10 bg-[#1C1C1E] p-5", className)}>
      <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">{title}</h2>
      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-white/25 hover:text-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
