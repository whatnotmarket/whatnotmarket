import { pbkdf2Sync, createCipheriv, createDecipheriv, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const DEFAULT_BCRYPT_ROUNDS = 12;
const RECOVERY_PBKDF2_ITERATIONS = 210_000;
const RECOVERY_KEY_BYTES = 32;

export async function hashPasswordWithBcrypt(password: string, rounds = DEFAULT_BCRYPT_ROUNDS) {
  return bcrypt.hash(password, rounds);
}

export async function verifyPasswordWithBcrypt(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function encryptRecoveryPhraseWithSecret(phrase: string, secret: string) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);

  const key = pbkdf2Sync(secret, salt, RECOVERY_PBKDF2_ITERATIONS, RECOVERY_KEY_BYTES, "sha512");

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(phrase, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedRecovery: `${encrypted.toString("base64url")}.${authTag.toString("base64url")}`,
    recoveryIv: iv.toString("base64url"),
    recoverySalt: salt.toString("base64url"),
  };
}

export function decryptRecoveryPhraseWithSecret(
  params: {
    encryptedRecovery: string;
    recoveryIv: string;
    recoverySalt: string;
  },
  secret: string
) {
  const [ciphertext, authTag] = params.encryptedRecovery.split(".");
  if (!ciphertext || !authTag) {
    throw new Error("Malformed encrypted recovery phrase payload.");
  }

  const key = pbkdf2Sync(
    secret,
    Buffer.from(params.recoverySalt, "base64url"),
    RECOVERY_PBKDF2_ITERATIONS,
    RECOVERY_KEY_BYTES,
    "sha512"
  );

  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(params.recoveryIv, "base64url"));
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
