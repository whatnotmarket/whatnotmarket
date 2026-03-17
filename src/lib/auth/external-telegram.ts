import "server-only";

import { createHash, createHmac } from "crypto";

export type TelegramAuthPayload = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export function verifyTelegramAuthPayload(payload: TelegramAuthPayload, botToken: string) {
  const secretKey = createHash("sha256").update(botToken).digest();
  const checkString = Object.entries(payload)
    .filter(([key, value]) => key !== "hash" && value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const digest = createHmac("sha256", secretKey).update(checkString).digest("hex");
  return digest === payload.hash;
}

