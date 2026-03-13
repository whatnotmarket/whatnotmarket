import { dictionary as enDictionary } from "./en";
import type { UiDictionary } from "./types";

export const dictionary: UiDictionary = {
  ...enDictionary,
  common: {
    language: "Idioma",
    switchLanguage: "Mudar idioma",
  },
  metadata: {
    ...enDictionary.metadata,
    homeTitle: "OpenlyMarket | Marketplace Cripto Seguro",
    marketTitle: "Marketplace | OpenlyMarket",
  },
};
