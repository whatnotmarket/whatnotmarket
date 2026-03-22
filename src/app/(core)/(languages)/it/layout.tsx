import { getDictionary } from "@/i18n/get-dictionary";
import { I18nProvider } from "@/i18n/provider";

export default async function ItLocaleLayout({ children }: { children: React.ReactNode }) {
  const dictionary = await getDictionary("it");
  return <I18nProvider value={{ locale: "it", dictionary }}>{children}</I18nProvider>;
}
