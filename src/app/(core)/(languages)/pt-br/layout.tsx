import { I18nProvider } from "@/i18n/provider";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function PtBrLocaleLayout({ children }: { children: React.ReactNode }) {
  const dictionary = await getDictionary("pt-br");
  return <I18nProvider value={{ locale: "pt-br", dictionary }}>{children}</I18nProvider>;
}
