const ROOM_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[^\s]*)/i;

export function isCanonicalRoomId(roomId: string) {
  return ROOM_ID_REGEX.test(roomId.trim());
}

export function isParticipantInRoom(roomId: string, userId: string) {
  if (!isCanonicalRoomId(roomId)) {
    return false;
  }

  const [left, right] = roomId.split("_");
  return left === userId || right === userId;
}

export function containsDisallowedLink(content: string) {
  return URL_REGEX.test(content);
}

export function normalizeChatContent(content: string) {
  return content.replace(/\r\n/g, "\n").trim();
}

