import { getNonce } from "@/lib/nonce";

import { ProductListingPageClient } from "./product-listing-page-client";

export default async function ProductListingPage() {
  const nonce = await getNonce();
  return <ProductListingPageClient nonce={nonce} />;
}
