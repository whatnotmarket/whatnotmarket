import { I18nProvider } from "@/i18n/provider";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function RoLocaleLayout({ children }: { children: React.ReactNode }) {
  const dictionary = await getDictionary("ro");
  return <I18nProvider value={{ locale: "ro", dictionary }}>{children}</I18nProvider>;
}
