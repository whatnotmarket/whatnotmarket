export type LinkCluster =
  | "Marketplace"
  | "Listings"
  | "Categorie"
  | "Utenti"
  | "Company"
  | "ProdottiServizi";

export type InternalLinkItem = {
  href: string;
  label: string;
  cluster: LinkCluster;
  isHub?: boolean;
};

export const INTERNAL_LINK_CATALOG: readonly InternalLinkItem[] = [
  { href: "/", label: "OpenlyMarket Home", cluster: "Marketplace", isHub: true },
  { href: "/market", label: "Marketplace", cluster: "Marketplace", isHub: true },
  { href: "/requests", label: "Buyer Requests", cluster: "Listings", isHub: true },
  { href: "/requests/new", label: "Create Request", cluster: "Listings" },
  { href: "/smart-search", label: "Smart Search", cluster: "Listings" },
  { href: "/sell", label: "Sell on OpenlyMarket", cluster: "Listings" },
  { href: "/promote-listings", label: "Promote Listings", cluster: "Listings" },
  { href: "/fee-calculator", label: "Escrow Fee Calculator", cluster: "ProdottiServizi" },
  { href: "/secure-transaction", label: "Secure Transaction", cluster: "ProdottiServizi" },
  { href: "/buy-with-crypto", label: "Buy with Crypto", cluster: "ProdottiServizi" },
  { href: "/broker", label: "Broker Escrow", cluster: "ProdottiServizi" },
  { href: "/proxy-orders", label: "Proxy Orders", cluster: "ProdottiServizi" },
  { href: "/escrow", label: "Escrow Service", cluster: "ProdottiServizi" },
  { href: "/become-seller", label: "Become Seller", cluster: "Utenti" },
  { href: "/become-escrow", label: "Become Escrow", cluster: "Utenti" },
  { href: "/about", label: "About", cluster: "Company", isHub: true },
  { href: "/business", label: "Business", cluster: "Company" },
  { href: "/roadmap", label: "Roadmap", cluster: "Company" },
  { href: "/open-source", label: "Open Source", cluster: "Company" },
  { href: "/contact", label: "Contact", cluster: "Company" },
  { href: "/faq", label: "FAQ", cluster: "Company" },
  { href: "/terms", label: "Terms", cluster: "Company" },
  { href: "/privacy", label: "Privacy", cluster: "Company" },
  { href: "/disclaimer", label: "Disclaimer", cluster: "Company" },
  { href: "/refund", label: "Refund", cluster: "Company" },
  { href: "/redeem", label: "Redeem", cluster: "Company" },
  { href: "/link", label: "Official Links", cluster: "Company" },
  { href: "/category/collectibles", label: "Collectibles Category", cluster: "Categorie", isHub: true },
  { href: "/category/electronics", label: "Electronics Category", cluster: "Categorie", isHub: true },
  { href: "/category/fashion", label: "Fashion Category", cluster: "Categorie", isHub: true },
  { href: "/category/home-garden", label: "Home and Garden Category", cluster: "Categorie", isHub: true },
  { href: "/category/services", label: "Services Category", cluster: "Categorie", isHub: true },
] as const;

export const INTERNAL_LINK_HUBS: readonly string[] = INTERNAL_LINK_CATALOG.filter((item) => item.isHub).map(
  (item) => item.href
);

export const INTERNAL_LINK_BY_PATH = new Map(INTERNAL_LINK_CATALOG.map((item) => [item.href, item]));
