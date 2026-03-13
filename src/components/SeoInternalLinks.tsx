import Link from "next/link";
import { PUBLIC_CATEGORY_PRODUCT_PATHS } from "@/lib/public-catalog";

function humanizePathLabel(path: string): string {
  return path
    .replace(/^\/category\//, "")
    .replace(/\//g, " ")
    .replace(/-/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const CATEGORY_PRODUCT_LINKS = PUBLIC_CATEGORY_PRODUCT_PATHS.map((path) => ({
  href: path,
  label: `${humanizePathLabel(path)} Listing`,
}));

const INTERNAL_LINKS = [
  { href: "/", label: "OpenlyMarket Home" },
  { href: "/market", label: "Marketplace" },
  { href: "/requests", label: "Buyer Requests" },
  { href: "/requests/new", label: "Create Request" },
  { href: "/sell", label: "Sell on OpenlyMarket" },
  { href: "/buy-with-crypto", label: "Buy Anywhere with Crypto" },
  { href: "/broker", label: "Escrow for Brokers" },
  { href: "/business", label: "Business Escrow Solutions" },
  { href: "/smart-search", label: "Smart Search" },
  { href: "/promote-listings", label: "Promote Listings" },
  { href: "/fee-calculator", label: "Escrow Fee Calculator" },
  { href: "/secure-transaction", label: "Secure Transactions" },
  { href: "/become-seller", label: "Become a Seller" },
  { href: "/become-escrow", label: "Become an Escrow Partner" },
  { href: "/about", label: "About OpenlyMarket" },
  { href: "/contact", label: "Contact OpenlyMarket" },
  { href: "/faq", label: "FAQ" },
  { href: "/roadmap", label: "Product Roadmap" },
  { href: "/open-source", label: "Open Source" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/refund", label: "Refund Policy" },
  { href: "/redeem", label: "Redeem" },
  { href: "/link", label: "Official Links" },
  { href: "/category/electronics", label: "Electronics Category" },
  { href: "/category/fashion", label: "Fashion Category" },
  { href: "/category/home-garden", label: "Home and Garden Category" },
  { href: "/category/collectibles", label: "Collectibles Category" },
  { href: "/category/services", label: "Services Category" },
  ...CATEGORY_PRODUCT_LINKS,
] as const;

export function SeoInternalLinks() {
  return (
    <nav className="sr-only" aria-label="Internal navigation links">
      <ul>
        {INTERNAL_LINKS.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
