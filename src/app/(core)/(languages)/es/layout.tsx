import { I18nProvider } from "@/i18n/provider";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function EsLocaleLayout({ children }: { children: React.ReactNode }) {
  const dictionary = await getDictionary("es");
  return <I18nProvider value={{ locale: "es", dictionary }}>{children}</I18nProvider>;
}
