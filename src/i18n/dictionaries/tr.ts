import { dictionary as enDictionary } from "./en";
import type { UiDictionary } from "./types";

export const dictionary: UiDictionary = {
  ...enDictionary,
  common: {
    language: "Dil",
    switchLanguage: "Dili değiştir",
  },
  metadata: {
    ...enDictionary.metadata,
    homeTitle: "OpenlyMarket | Güvenli Kripto Pazaryeri",
    marketTitle: "Pazaryeri | OpenlyMarket",
  },
};
