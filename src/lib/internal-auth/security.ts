import "server-only";

import {
  decryptRecoveryPhraseWithSecret,
  encryptRecoveryPhraseWithSecret,
  hashPasswordWithBcrypt,
  verifyPasswordWithBcrypt,
} from "@/lib/internal-auth/security-core";

function getRecoveryEncryptionSecret() {
  const value = process.env.INTERNAL_RECOVERY_ENCRYPTION_SECRET;
  if (value) return value;

  if (process.env.NODE_ENV === "production") {
    throw new Error("INTERNAL_RECOVERY_ENCRYPTION_SECRET is required in production.");
  }

  return "dev-internal-recovery-secret-change-me";
}

export async function hashInternalPassword(password: string) {
  return hashPasswordWithBcrypt(password, 12);
}

export async function verifyInternalPassword(password: string, passwordHash: string) {
  return verifyPasswordWithBcrypt(password, passwordHash);
}

export function encryptRecoveryPhrase(phrase: string) {
  return encryptRecoveryPhraseWithSecret(phrase, getRecoveryEncryptionSecret());
}

export function decryptRecoveryPhrase(params: {
  encryptedRecovery: string;
  recoveryIv: string;
  recoverySalt: string;
}) {
  return decryptRecoveryPhraseWithSecret(params, getRecoveryEncryptionSecret());
}
