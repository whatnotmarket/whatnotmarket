import { dictionary as enDictionary } from "./en";
import type { UiDictionary } from "./types";

export const dictionary: UiDictionary = {
  ...enDictionary,
  common: {
    language: "Мова",
    switchLanguage: "Змінити мову",
  },
  metadata: {
    ...enDictionary.metadata,
    homeTitle: "OpenlyMarket | Безпечний Крипто Маркетплейс",
    marketTitle: "Маркетплейс | OpenlyMarket",
  },
};
