import { I18nProvider } from "@/i18n/provider";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function TrLocaleLayout({ children }: { children: React.ReactNode }) {
  const dictionary = await getDictionary("tr");
  return <I18nProvider value={{ locale: "tr", dictionary }}>{children}</I18nProvider>;
}
