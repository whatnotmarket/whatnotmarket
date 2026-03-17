import { dictionary as enDictionary } from "./en";
import type { UiDictionary } from "./types";

export const dictionary: UiDictionary = {
  ...enDictionary,
  common: {
    language: "Язык",
    switchLanguage: "Сменить язык",
  },
  metadata: {
    ...enDictionary.metadata,
    homeTitle: "OpenlyMarket | Безопасный Крипто Маркетплейс",
    marketTitle: "Маркетплейс | OpenlyMarket",
  },
};
