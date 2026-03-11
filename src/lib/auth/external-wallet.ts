import "server-only";

import { recoverMessageAddress } from "viem";

export function createWalletChallengeMessage(params: {
  address: string;
  chain: string;
  nonce: string;
}) {
  return [
    "SwaprMarket Wallet Authentication",
    "",
    `Address: ${params.address.toLowerCase()}`,
    `Chain: ${params.chain}`,
    `Nonce: ${params.nonce}`,
    "By signing this message you confirm wallet ownership.",
  ].join("\n");
}

export async function verifyWalletChallengeSignature(params: {
  address: string;
  chain: string;
  nonce: string;
  signature: string;
}) {
  const expected = params.address.toLowerCase();
  const message = createWalletChallengeMessage({
    address: expected,
    chain: params.chain,
    nonce: params.nonce,
  });

  const recovered = await recoverMessageAddress({
    message,
    signature: params.signature as `0x${string}`,
  });

  return recovered.toLowerCase() === expected;
}

