import { I18nProvider } from "@/i18n/provider";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function RuLocaleLayout({ children }: { children: React.ReactNode }) {
  const dictionary = await getDictionary("ru");
  return <I18nProvider value={{ locale: "ru", dictionary }}>{children}</I18nProvider>;
}
