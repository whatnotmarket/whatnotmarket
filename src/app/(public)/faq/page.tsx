import { getNonce } from "@/lib/nonce";

import { FaqPageClient } from "./faq-page-client";

export default async function FAQPage() {
  const nonce = await getNonce();
  return <FaqPageClient nonce={nonce} />;
}
