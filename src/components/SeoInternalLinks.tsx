import Link from "next/link";
import { PUBLIC_CATEGORY_PRODUCT_PATHS } from "@/lib/public-catalog";
import { INTERNAL_LINK_CATALOG } from "@/lib/internal-linking";

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
  ...INTERNAL_LINK_CATALOG.map((item) => ({ href: item.href, label: item.label })),
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
