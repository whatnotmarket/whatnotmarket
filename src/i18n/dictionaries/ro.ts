import { dictionary as enDictionary } from "./en";
import type { UiDictionary } from "./types";

export const dictionary: UiDictionary = {
  ...enDictionary,
  common: {
    language: "Limbă",
    switchLanguage: "Schimbă limba",
  },
  metadata: {
    ...enDictionary.metadata,
    homeTitle: "OpenlyMarket | Marketplace Crypto Sigur",
    marketTitle: "Marketplace | OpenlyMarket",
  },
};
