import { PUBLIC_CATEGORY_PRODUCT_PATHS } from "@/lib/app/catalog/public-catalog";
import { INTERNAL_LINK_CATALOG } from "@/lib/app/seo/internal-linking";

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

const INTERNAL_LINKS_RAW = [
  ...INTERNAL_LINK_CATALOG.map((item) => ({ href: item.href, label: item.label })),
  ...CATEGORY_PRODUCT_LINKS,
] as const;

const INTERNAL_LINKS = Array.from(
  new Map(INTERNAL_LINKS_RAW.map((item) => [item.href, item.label])).entries()
).map(([href, label]) => ({ href, label }));

export function SeoInternalLinks() {
  return (
    <nav className="sr-only" aria-label="Internal navigation links">
      <ul>
        {INTERNAL_LINKS.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

