import { getDictionary } from "@/i18n/get-dictionary";
import { I18nProvider } from "@/i18n/provider";

export default async function PlLocaleLayout({ children }: { children: React.ReactNode }) {
  const dictionary = await getDictionary("pl");
  return <I18nProvider value={{ locale: "pl", dictionary }}>{children}</I18nProvider>;
}
