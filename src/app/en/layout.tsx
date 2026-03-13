import { I18nProvider } from "@/i18n/provider";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function EnLocaleLayout({ children }: { children: React.ReactNode }) {
  const dictionary = await getDictionary("en");
  return <I18nProvider value={{ locale: "en", dictionary }}>{children}</I18nProvider>;
}
