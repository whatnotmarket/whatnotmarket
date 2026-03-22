import MarketPage from "@/app/(commerce)/market/page";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildLocalizedMetadata } from "@/i18n/seo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary("en");
  return buildLocalizedMetadata({
    locale: "en",
    pathname: "/market",
    title: dictionary.metadata.marketTitle,
    description: dictionary.metadata.marketDescription,
  });
}

export default MarketPage;

