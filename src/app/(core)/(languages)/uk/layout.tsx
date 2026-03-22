import { getDictionary } from "@/i18n/get-dictionary";
import { I18nProvider } from "@/i18n/provider";

export default async function UkLocaleLayout({ children }: { children: React.ReactNode }) {
  const dictionary = await getDictionary("uk");
  return <I18nProvider value={{ locale: "uk", dictionary }}>{children}</I18nProvider>;
}
