import type { Metadata } from "next";
import HomepagePage from "@/app/(homepage)/page";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildLocalizedMetadata } from "@/i18n/seo";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary("pt-br");
  return buildLocalizedMetadata({
    locale: "pt-br",
    pathname: "/",
    title: dictionary.metadata.homeTitle,
    description: dictionary.metadata.homeDescription,
  });
}

export default HomepagePage;
