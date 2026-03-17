import { dictionary as enDictionary } from "./en";
import type { UiDictionary } from "./types";

export const dictionary: UiDictionary = {
  ...enDictionary,
  common: {
    language: "Idioma",
    switchLanguage: "Cambiar idioma",
  },
  metadata: {
    ...enDictionary.metadata,
    homeTitle: "OpenlyMarket | Mercado Cripto Seguro",
    marketTitle: "Mercado | OpenlyMarket",
  },
};
