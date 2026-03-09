import {
  DEFAULT_BLOCKED_PHRASES,
  GLOBAL_CHAT_ROOM_SET,
  type GlobalChatRoom,
} from "@/lib/chat/global-chat-config";

export type ModerationErrorCode =
  | "INVALID_ROOM"
  | "EMPTY_MESSAGE"
  | "MESSAGE_TOO_LONG"
  | "LINKS_NOT_ALLOWED"
  | "EXCESSIVE_CAPS"
  | "REPEATED_CHARACTERS"
  | "BLOCKED_PHRASE"
  | "FLOOD_LIMIT"
  | "DUPLICATE_SPAM"
  | "MUTE_ACTIVE"
  | "BAN_ACTIVE"
  | "AUTH_REQUIRED";

export type ModerationError = {
  ok: false;
  code: ModerationErrorCode;
  message: string;
};

export type ModerationSuccess = {
  ok: true;
  normalizedMessage: string;
  room: GlobalChatRoom;
};

export type ModerationResult = ModerationError | ModerationSuccess;

type BaseContext = {
  room: string;
  message: string;
  blockedPhrases?: string[];
};

const LINK_PATTERNS: RegExp[] = [
  /https?:\/\//i,
  /\bwww\./i,
  /\bt\.me\b/i,
  /\bdiscord\.gg\b/i,
  /\bdiscord(?:app)?\.com\/invite\b/i,
  /\btelegram\.(?:me|dog|org)\b/i,
  /\binvite\s+link\b/i,
  /\b[a-z0-9-]+\.(?:com|net|io|ru|xyz|org)\b/i,
];

function trimAndNormalize(raw: string) {
  return raw.trim().replace(/\s+/g, " ");
}

function hasTooManyCaps(message: string) {
  if (message.length <= 12) return false;
  const letters = message.match(/[A-Za-z]/g) || [];
  if (letters.length === 0) return false;
  const uppercaseCount = letters.filter((letter) => letter === letter.toUpperCase()).length;
  return uppercaseCount / letters.length > 0.7;
}

function hasRepeatedCharacterBurst(message: string) {
  return /(.)\1{6,}/u.test(message);
}

function containsBlockedLink(message: string) {
  return LINK_PATTERNS.some((pattern) => pattern.test(message));
}

function containsBlockedPhrase(messageLower: string, phrases: string[]) {
  return phrases.some((phrase) => messageLower.includes(phrase.toLowerCase()));
}

export function validateMessageShape({ room, message, blockedPhrases }: BaseContext): ModerationResult {
  const normalizedRoom = room.trim().toLowerCase();
  if (!GLOBAL_CHAT_ROOM_SET.has(normalizedRoom)) {
    return { ok: false, code: "INVALID_ROOM", message: "Invalid chat room." };
  }

  const normalizedMessage = trimAndNormalize(message);
  if (!normalizedMessage) {
    return {
      ok: false,
      code: "EMPTY_MESSAGE",
      message: "Message cannot be empty.",
    };
  }

  if (normalizedMessage.length > 300) {
    return {
      ok: false,
      code: "MESSAGE_TOO_LONG",
      message: "Message cannot exceed 300 characters.",
    };
  }

  if (containsBlockedLink(normalizedMessage)) {
    return {
      ok: false,
      code: "LINKS_NOT_ALLOWED",
      message: "Links are not allowed in chat.",
    };
  }

  if (hasTooManyCaps(normalizedMessage)) {
    return {
      ok: false,
      code: "EXCESSIVE_CAPS",
      message: "Please avoid excessive uppercase text.",
    };
  }

  if (hasRepeatedCharacterBurst(normalizedMessage)) {
    return {
      ok: false,
      code: "REPEATED_CHARACTERS",
      message: "Please avoid repeated character spam.",
    };
  }

  const phrases = [...DEFAULT_BLOCKED_PHRASES, ...(blockedPhrases || [])];
  const lower = normalizedMessage.toLowerCase();

  if (containsBlockedPhrase(lower, phrases)) {
    return {
      ok: false,
      code: "BLOCKED_PHRASE",
      message: "This message contains blocked marketplace spam patterns.",
    };
  }

  const roomSlug = normalizedRoom as GlobalChatRoom;
  return {
    ok: true,
    normalizedMessage: lower,
    room: roomSlug,
  };
}

export function buildFloodError(): ModerationError {
  return {
    ok: false,
    code: "FLOOD_LIMIT",
    message: "You can send at most 1 message every 5 seconds.",
  };
}

export function buildDuplicateError(): ModerationError {
  return {
    ok: false,
    code: "DUPLICATE_SPAM",
    message: "Please do not repeat the same message within 60 seconds.",
  };
}

export function buildMuteError(): ModerationError {
  return {
    ok: false,
    code: "MUTE_ACTIVE",
    message: "You are temporarily muted and cannot send messages.",
  };
}

export function buildBanError(): ModerationError {
  return {
    ok: false,
    code: "BAN_ACTIVE",
    message: "You are banned from global chat.",
  };
}

export function buildAuthError(): ModerationError {
  return {
    ok: false,
    code: "AUTH_REQUIRED",
    message: "You must be logged in to send messages.",
  };
}
