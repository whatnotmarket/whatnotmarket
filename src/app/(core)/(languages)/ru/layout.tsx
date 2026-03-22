import { getDictionary } from "@/i18n/get-dictionary";
import { I18nProvider } from "@/i18n/provider";

export default async function RuLocaleLayout({ children }: { children: React.ReactNode }) {
  const dictionary = await getDictionary("ru");
  return <I18nProvider value={{ locale: "ru", dictionary }}>{children}</I18nProvider>;
}
