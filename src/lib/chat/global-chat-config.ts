export const GLOBAL_CHAT_ROOMS = [
  { slug: "global", label: "Global" },
  { slug: "buy-services", label: "Buy Services" },
  { slug: "sell-services", label: "Sell Services" },
  { slug: "crypto-talk", label: "Crypto Talk" },
  { slug: "help", label: "Help" },
  { slug: "english", label: "English" },
] as const;

export type GlobalChatRoom = (typeof GLOBAL_CHAT_ROOMS)[number]["slug"];

export const GLOBAL_CHAT_ROOM_SET = new Set<string>(GLOBAL_CHAT_ROOMS.map((room) => room.slug));

export const DEFAULT_BLOCKED_PHRASES = [
  "dm me",
  "quick profit",
  "guaranteed profit",
  "send first",
  "no escrow",
  "instant稳赚",
] as const;
