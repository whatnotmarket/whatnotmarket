export const PUBLIC_CATEGORY_SLUGS = [
  "collectibles",
  "electronics",
  "fashion",
  "home-garden",
  "services",
] as const;

const PRODUCT_TRENDING_VARIANTS = ["prime", "gold", "elite", "pro"] as const;
const PRODUCT_PREFIXES = [
  "epic",
  "legendary",
  "rare",
  "common",
  "starter",
  "pro",
  "elite",
  "master",
] as const;
const PRODUCT_SUFFIXES = [
  "bundle",
  "pack",
  "account",
  "key",
  "service",
  "boost",
  "coins",
  "items",
] as const;

export function getPublicCategoryProductSlugs(categorySlug: string): string[] {
  const trending = PRODUCT_TRENDING_VARIANTS.map((variant) => `${categorySlug}-${variant}-edition`);
  const catalog = PRODUCT_PREFIXES.map(
    (prefix, index) => `${prefix}-${categorySlug}-${PRODUCT_SUFFIXES[index]}`
  );

  return [...new Set([...trending, ...catalog])];
}

export const PUBLIC_CATEGORY_PRODUCT_PATHS = PUBLIC_CATEGORY_SLUGS.flatMap((categorySlug) =>
  getPublicCategoryProductSlugs(categorySlug).map((productSlug) => `/category/${categorySlug}/${productSlug}`)
);
