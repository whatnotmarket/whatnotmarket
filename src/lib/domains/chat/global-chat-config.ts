export const CORE_GLOBAL_CHAT_ROOMS = [
  { slug: "global", label: "Global" },
  { slug: "buy-services", label: "Buy Services" },
  { slug: "sell-services", label: "Sell Services" },
  { slug: "crypto-talk", label: "Crypto Talk" },
  { slug: "help", label: "Help" },
] as const;

export const LANGUAGE_GLOBAL_CHAT_ROOMS = [
  { slug: "english", label: "English" },
  { slug: "spanish", label: "Spanish" },
  { slug: "polish", label: "Polish" },
  { slug: "russian", label: "Russian" },
  { slug: "ukrainian", label: "Ukrainian" },
  { slug: "turkish", label: "Turkish" },
  { slug: "romanian", label: "Romanian" },
  { slug: "portuguese-br", label: "Portuguese (Brazil)" },
] as const;

export const GLOBAL_CHAT_ROOMS = [
  ...CORE_GLOBAL_CHAT_ROOMS.filter((room) => room.slug !== "help" && room.slug !== "crypto-talk"),
  CORE_GLOBAL_CHAT_ROOMS.find((room) => room.slug === "help")!,
  CORE_GLOBAL_CHAT_ROOMS.find((room) => room.slug === "crypto-talk")!,
  ...LANGUAGE_GLOBAL_CHAT_ROOMS,
] as const;

export type GlobalChatRoom = (typeof GLOBAL_CHAT_ROOMS)[number]["slug"];

export const DEFAULT_GLOBAL_CHAT_ROOM: GlobalChatRoom = "english";

export const LANGUAGE_GLOBAL_CHAT_ROOM_SLUGS = [
  "english",
  "spanish",
  "polish",
  "russian",
  "ukrainian",
  "turkish",
  "romanian",
  "portuguese-br",
] as const;

export const GLOBAL_CHAT_ROOM_SET = new Set<string>(GLOBAL_CHAT_ROOMS.map((room) => room.slug));

export const DEFAULT_BLOCKED_PHRASES = [
  "dm me",
  "quick profit",
  "guaranteed profit",
  "send first",
  "no escrow",
  "instant稳赚",
] as const;
