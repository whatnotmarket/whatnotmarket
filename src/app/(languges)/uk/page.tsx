import type { Metadata } from "next";
import NewHomePage from "@/app/dev/page";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildLocalizedMetadata } from "@/i18n/seo";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary("uk");
  return buildLocalizedMetadata({
    locale: "uk",
    pathname: "/",
    title: dictionary.metadata.homeTitle,
    description: dictionary.metadata.homeDescription,
  });
}

export default NewHomePage;
