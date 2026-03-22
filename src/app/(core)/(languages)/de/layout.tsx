import { getDictionary } from "@/i18n/get-dictionary";
import { I18nProvider } from "@/i18n/provider";

export default async function DeLocaleLayout({ children }: { children: React.ReactNode }) {
  const dictionary = await getDictionary("de");
  return <I18nProvider value={{ locale: "de", dictionary }}>{children}</I18nProvider>;
}
