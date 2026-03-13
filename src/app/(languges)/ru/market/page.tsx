import type { Metadata } from "next";
import MarketPage from "@/app/market/page";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildLocalizedMetadata } from "@/i18n/seo";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary("ru");
  return buildLocalizedMetadata({
    locale: "ru",
    pathname: "/market",
    title: dictionary.metadata.marketTitle,
    description: dictionary.metadata.marketDescription,
  });
}

export default MarketPage;
