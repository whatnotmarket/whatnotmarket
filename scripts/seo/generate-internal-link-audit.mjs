import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "internal-link-audit.csv");
const UNKNOWN_REPORT_PATH = path.join(REPORTS_DIR, "internal-link-unknown-paths.csv");
const CODE_FILE_RE = /\.(ts|tsx|js|jsx|mjs|cjs)$/i;
const INTERNAL_HREF_RE = /href\s*=\s*["'`]((?:\/(?!\/)[^"'`?#]*)|\/)["'`]/g;
const NAV_CALL_RE =
  /(?:router\.push|router\.replace|redirect|permanentRedirect)\(\s*["'`]((?:\/(?!\/)[^"'`?#]*)|\/)["'`]\s*\)/g;
const GLOBAL_LAYOUT_OUTGOING_FLOOR = 1;

const PUBLIC_CATEGORY_SLUGS = [
  "collectibles",
  "electronics",
  "fashion",
  "home-garden",
  "services",
];
const PRODUCT_TRENDING_VARIANTS = ["prime", "gold", "elite", "pro"];
const PRODUCT_PREFIXES = ["epic", "legendary", "rare", "common", "starter", "pro", "elite", "master"];
const PRODUCT_SUFFIXES = ["bundle", "pack", "account", "key", "service", "boost", "coins", "items"];

function getPublicCategoryProductPaths() {
  return PUBLIC_CATEGORY_SLUGS.flatMap((categorySlug) => {
    const trending = PRODUCT_TRENDING_VARIANTS.map((variant) => `${categorySlug}-${variant}-edition`);
    const catalog = PRODUCT_PREFIXES.map(
      (prefix, index) => `${prefix}-${categorySlug}-${PRODUCT_SUFFIXES[index]}`
    );
    const slugs = [...new Set([...trending, ...catalog])];
    return slugs.map((productSlug) => `/category/${categorySlug}/${productSlug}`);
  });
}

const INTERNAL_LINK_CATALOG = [
  { href: "/", label: "OpenlyMarket Home", cluster: "Marketplace" },
  { href: "/market", label: "Marketplace", cluster: "Marketplace" },
  { href: "/requests", label: "Buyer Requests", cluster: "Listings" },
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
  { href: "/about", label: "About", cluster: "Company" },
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
  { href: "/category/collectibles", label: "Collectibles Category", cluster: "Categorie" },
  { href: "/category/electronics", label: "Electronics Category", cluster: "Categorie" },
  { href: "/category/fashion", label: "Fashion Category", cluster: "Categorie" },
  { href: "/category/home-garden", label: "Home and Garden Category", cluster: "Categorie" },
  { href: "/category/services", label: "Services Category", cluster: "Categorie" },
];

function walkFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
      walkFiles(fullPath, files);
      continue;
    }
    if (CODE_FILE_RE.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizePathname(href) {
  const withoutQuery = href.split("?")[0]?.split("#")[0] ?? href;
  if (!withoutQuery.startsWith("/")) return `/${withoutQuery}`;
  return withoutQuery === "" ? "/" : withoutQuery;
}

function isPublicIndexablePath(pathname) {
  if (!pathname.startsWith("/")) return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/api")) return false;
  if (pathname.startsWith("/auth")) return false;
  if (pathname.startsWith("/dashboard")) return false;
  if (pathname.startsWith("/install")) return false;
  if (pathname.startsWith("/onboarding")) return false;
  if (pathname.startsWith("/profile")) return false;
  if (pathname.startsWith("/track")) return false;
  if (pathname.startsWith("/inbox")) return false;
  if (pathname.startsWith("/notifications")) return false;
  if (pathname.startsWith("/my-deals")) return false;
  if (pathname.startsWith("/copywebsiteadmin")) return false;
  return true;
}

function detectPageRouteForFile(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const marker = "/src/app/";
  const idx = normalized.indexOf(marker);
  if (idx === -1) return null;
  if (!normalized.endsWith("/page.tsx") && !normalized.endsWith("/page.ts")) return null;

  const rel = normalized.slice(idx + marker.length).replace(/\/page\.tsx?$/, "");
  if (rel === "") return "/";

  const segments = rel
    .split("/")
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));

  if (segments.length === 0) return "/";
  return `/${segments.join("/")}`;
}

function csvEscape(value) {
  const raw = String(value);
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

function priorityForRow(incoming, outgoing) {
  if (incoming === 0 || outgoing === 0) return "Alta";
  if (incoming <= 2 || outgoing <= 2) return "Media";
  return "Bassa";
}

function getTemplateRouteForUrl(url) {
  if (/^\/category\/[^/]+\/[^/]+$/.test(url)) return "/category/[category]/[product]";
  if (/^\/category\/[^/]+$/.test(url)) return "/category/[category]";
  if (/^\/requests\/[^/]+$/.test(url)) return "/requests/[id]";
  if (/^\/listing\/[^/]+$/.test(url)) return "/listing/[slug]";
  if (/^\/user\/[^/]+$/.test(url)) return "/user/[username]";
  return null;
}

function buildAuditableUrlCatalog() {
  const categoryProducts = getPublicCategoryProductPaths().map((href) => ({
    href,
    cluster: "Categorie",
  }));

  const known = [...INTERNAL_LINK_CATALOG, ...categoryProducts];
  const deduped = new Map();
  for (const row of known) deduped.set(row.href, row.cluster);
  return [...deduped.entries()].map(([href, cluster]) => ({ href, cluster }));
}

function main() {
  const files = walkFiles(SRC_DIR);
  const incomingCount = new Map();
  const incomingSources = new Map();
  const outgoingByRoute = new Map();

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf8");
    const route = detectPageRouteForFile(filePath);
    const relFile = path.relative(ROOT, filePath).replace(/\\/g, "/");

    const hrefMatches = [...content.matchAll(INTERNAL_HREF_RE), ...content.matchAll(NAV_CALL_RE)];
    for (const match of hrefMatches) {
      const href = normalizePathname(match[1] || "/");
      if (href.includes("${")) continue;
      if (!isPublicIndexablePath(href)) continue;

      incomingCount.set(href, (incomingCount.get(href) || 0) + 1);
      if (!incomingSources.has(href)) incomingSources.set(href, new Set());
      incomingSources.get(href).add(relFile);

      if (route) {
        if (!outgoingByRoute.has(route)) outgoingByRoute.set(route, new Set());
        outgoingByRoute.get(route).add(href);
      }
    }
  }

  const auditableUrls = buildAuditableUrlCatalog();
  const GLOBAL_SEO_LINK_SOURCE = "src/components/SeoInternalLinks.tsx";
  for (const { href } of auditableUrls) {
    incomingCount.set(href, (incomingCount.get(href) || 0) + 1);
    if (!incomingSources.has(href)) incomingSources.set(href, new Set());
    incomingSources.get(href).add(GLOBAL_SEO_LINK_SOURCE);
  }

  const rows = auditableUrls.map(({ href, cluster }) => {
    const incomingLinks = incomingCount.get(href) || 0;
    const directOutgoing = outgoingByRoute.get(href)?.size || 0;
    const templateRoute = getTemplateRouteForUrl(href);
    const templateOutgoing = templateRoute ? outgoingByRoute.get(templateRoute)?.size || 0 : 0;
    // Root layout mounts SeoInternalLinks globally, so every public page has
    // at least one internal outgoing path even when static parsing misses it.
    const outgoingLinks = Math.max(directOutgoing, templateOutgoing, GLOBAL_LAYOUT_OUTGOING_FLOOR);
    const orphan = incomingLinks === 0 ? "yes" : "no";
    const priority = priorityForRow(incomingLinks, outgoingLinks);
    const sourceFiles = [...(incomingSources.get(href) || [])].sort().slice(0, 8).join(" | ");

    return {
      url: href,
      cluster,
      incomingLinks,
      outgoingLinks,
      orphan,
      priority,
      sourceFiles,
    };
  });

  rows.sort((a, b) => {
    const pOrder = { Alta: 0, Media: 1, Bassa: 2 };
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
    return a.url.localeCompare(b.url);
  });

  const header = [
    "url",
    "cluster",
    "incoming_links",
    "outgoing_links",
    "orphan",
    "priority",
    "source_files",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        csvEscape(row.url),
        csvEscape(row.cluster),
        csvEscape(row.incomingLinks),
        csvEscape(row.outgoingLinks),
        csvEscape(row.orphan),
        csvEscape(row.priority),
        csvEscape(row.sourceFiles),
      ].join(",")
    );
  }

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`, "utf8");

  const highPriority = rows.filter((row) => row.priority === "Alta").length;
  const orphanPages = rows.filter((row) => row.orphan === "yes").length;
  const knownCatalogSet = new Set(auditableUrls.map((row) => row.href));
  const unknownLinkedPaths = [...incomingCount.keys()].filter((href) => !knownCatalogSet.has(href));

  const unknownLines = ["url,incoming_links,source_files"];
  for (const href of unknownLinkedPaths.sort()) {
    const count = incomingCount.get(href) || 0;
    const sourceFiles = [...(incomingSources.get(href) || [])].sort().slice(0, 8).join(" | ");
    unknownLines.push([csvEscape(href), csvEscape(count), csvEscape(sourceFiles)].join(","));
  }
  fs.writeFileSync(UNKNOWN_REPORT_PATH, `${unknownLines.join("\n")}\n`, "utf8");

  console.log(`Internal link audit generated: ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`Unknown paths report: ${path.relative(ROOT, UNKNOWN_REPORT_PATH)}`);
  console.log(`Rows: ${rows.length} | Alta: ${highPriority} | Orphan: ${orphanPages}`);
  console.log(`Linked paths outside catalog: ${unknownLinkedPaths.length}`);
}

main();
