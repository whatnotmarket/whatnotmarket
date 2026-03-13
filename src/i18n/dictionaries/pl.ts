import { dictionary as enDictionary } from "./en";
import type { UiDictionary } from "./types";

export const dictionary: UiDictionary = {
  ...enDictionary,
  common: {
    language: "Język",
    switchLanguage: "Zmień język",
  },
  metadata: {
    ...enDictionary.metadata,
    homeTitle: "OpenlyMarket | Bezpieczny Rynek Krypto",
    marketTitle: "Rynek | OpenlyMarket",
  },
};
