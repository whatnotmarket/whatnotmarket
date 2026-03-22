import { generateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import assert from "node:assert/strict";
import test from "node:test";
import {
isValidRecoveryPhrase,
normalizeInternalUsername,
normalizeRecoveryPhrase,
onboardingRegistrationSchema,
} from "../../src/lib/domains/internal-auth/schemas";
import {
decryptRecoveryPhraseWithSecret,
encryptRecoveryPhraseWithSecret,
hashPasswordWithBcrypt,
verifyPasswordWithBcrypt,
} from "../../src/lib/domains/internal-auth/security-core";

test("normalizeInternalUsername strips unsupported characters", () => {
  assert.equal(normalizeInternalUsername("@@John.Doe!"), "john_doe");
});

test("recovery phrase validator accepts only valid 12-word mnemonic", () => {
  const mnemonic = generateMnemonic(wordlist, 128);
  assert.equal(isValidRecoveryPhrase(mnemonic), true);

  const invalidWordCount = normalizeRecoveryPhrase(`${mnemonic} extra`);
  assert.equal(isValidRecoveryPhrase(invalidWordCount), false);
});

test("recovery phrase encryption roundtrip works", () => {
  const phrase = generateMnemonic(wordlist, 128);
  const encrypted = encryptRecoveryPhraseWithSecret(phrase, "unit-test-secret");

  assert.notEqual(encrypted.encryptedRecovery.includes(phrase), true);

  const decrypted = decryptRecoveryPhraseWithSecret({
    encryptedRecovery: encrypted.encryptedRecovery,
    recoveryIv: encrypted.recoveryIv,
    recoverySalt: encrypted.recoverySalt,
  }, "unit-test-secret");

  assert.equal(decrypted, phrase);
});

test("internal password hashing uses one-way verification", async () => {
  const password = "CorrectHorseBatteryStaple!";
  const hash = await hashPasswordWithBcrypt(password);

  assert.notEqual(hash, password);
  assert.equal(await verifyPasswordWithBcrypt(password, hash), true);
  assert.equal(await verifyPasswordWithBcrypt("wrong-password", hash), false);
});

test("onboarding registration schema requires personalization fields by intent", () => {
  const mnemonic = generateMnemonic(wordlist, 128);

  const base = {
    username: "test_user",
    password: "CorrectHorseBatteryStaple!",
    recoveryPhrase: mnemonic,
    discoverySource: "Search / Google",
    avatarUrl: "https://example.com/avatar.png",
  };

  const sellerMissingCategory = onboardingRegistrationSchema.safeParse({
    ...base,
    userIntent: "sell",
  });
  assert.equal(sellerMissingCategory.success, false);

  const buyerMissingInterest = onboardingRegistrationSchema.safeParse({
    ...base,
    userIntent: "buy",
  });
  assert.equal(buyerMissingInterest.success, false);

  const bothValid = onboardingRegistrationSchema.safeParse({
    ...base,
    userIntent: "both",
    sellerCategory: "Digital goods",
    buyerInterest: "Services",
  });
  assert.equal(bothValid.success, true);
});


