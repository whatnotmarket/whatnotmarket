import MarketPage from "@/app/(commerce)/market/page";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildLocalizedMetadata } from "@/i18n/seo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary("pt-br");
  return buildLocalizedMetadata({
    locale: "pt-br",
    pathname: "/market",
    title: dictionary.metadata.marketTitle,
    description: dictionary.metadata.marketDescription,
  });
}

export default MarketPage;

