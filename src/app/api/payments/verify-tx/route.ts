import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { checkRateLimit, RateLimitResponse } from "@/lib/rate-limit";

// Wallet Addresses from Env
const OFFICIAL_WALLETS = {
  TRX: process.env.NEXT_PUBLIC_TRON_WALLET || "", 
  ETH: process.env.NEXT_PUBLIC_EVM_WALLET || "", 
  USDC: process.env.NEXT_PUBLIC_EVM_WALLET || "" 
};

// Tron Contracts from Env
const TRON_TOKENS = {
  USDT: process.env.TRON_USDT_CONTRACT || "", 
  USDC: process.env.TRON_USDC_CONTRACT || ""
};

const DB_PATH = path.join(process.cwd(), "data", "transactions.json");

async function getUsedTransactions(): Promise<string[]> {
  try {
    const dir = path.dirname(DB_PATH);
    await fs.mkdir(dir, { recursive: true });
    
    try {
      const data = await fs.readFile(DB_PATH, "utf-8");
      return JSON.parse(data);
    } catch {
      await fs.writeFile(DB_PATH, JSON.stringify([]));
      return [];
    }
  } catch (e) {
    return [];
  }
}

async function markTransactionUsed(txHash: string) {
  const used = await getUsedTransactions();
  used.push(txHash);
  await fs.writeFile(DB_PATH, JSON.stringify(used, null, 2));
}

export async function POST(req: Request) {
  if (!checkRateLimit(req, 10)) { 
    return RateLimitResponse();
  }

  try {
    const body = await req.json();
    const { orderId, currency, network, expectedAmount, txHash } = body;

    if (!txHash) {
      return NextResponse.json(
        { ok: false, reason: "TX_NOT_FOUND", message: "Transaction hash is required" },
        { status: 400 }
      );
    }

    // 1. Check if transaction already used
    const usedTxs = await getUsedTransactions();
    if (usedTxs.includes(txHash)) {
      return NextResponse.json({
        ok: false,
        reason: "TX_ALREADY_USED",
        message: "This transaction hash has already been used."
      });
    }

    // 2. Identify Network & Verification Strategy
    const isTron = (network === "TRC20" || currency === "TRX" || currency === "USDT" || currency === "USDC") && !txHash.startsWith("0x");
    
    if (isTron) {
      return await verifyTronTransaction(txHash, currency, expectedAmount);
    } else {
      return await verifyMockEvm(txHash, currency, expectedAmount);
    }

  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { ok: false, reason: "INTERNAL_ERROR", message: "Verification server error" },
      { status: 500 }
    );
  }
}

async function verifyTronTransaction(txHash: string, currency: string, expectedAmount: number) {
  try {
    // Fetch from TronScan API
    const response = await fetch(`https://apilist.tronscan.org/api/transaction-info?hash=${txHash}`);
    const data = await response.json();

    // 1. Check if tx exists
    if (!data || Object.keys(data).length === 0 || data.message) {
      return NextResponse.json({
        ok: false,
        reason: "TX_NOT_FOUND",
        message: "Transaction not found on Tron network."
      });
    }

    // 2. Check status
    if (data.contractRet !== "SUCCESS") {
      return NextResponse.json({
        ok: false,
        reason: "NOT_CONFIRMED",
        message: "Transaction failed or is not confirmed."
      });
    }

    // 3. Verify Recipient & Amount & Token
    const officialAddress = OFFICIAL_WALLETS.TRX;
    let recipient = "";
    let amount = 0;
    let tokenMatches = false;

    if (currency === "TRX") {
      // Native Transfer
      if (data.contractData && data.contractData.amount) {
        recipient = data.contractData.to_address;
        amount = data.contractData.amount / 1_000_000; // TRX has 6 decimals
        tokenMatches = true; // Native
      }
    } else {
      // TRC20 Token Transfer (USDT, USDC)
      // @ts-ignore
      const tokenContract = TRON_TOKENS[currency];
      if (!tokenContract) {
        return NextResponse.json({ ok: false, reason: "WRONG_TOKEN", message: "Unsupported token currency." });
      }

      if (data.trc20TransferInfo && data.trc20TransferInfo.length > 0) {
        // Find the transfer to our wallet
        const transfer = data.trc20TransferInfo.find((t: any) => t.to_address === officialAddress);
        
        if (transfer) {
          recipient = transfer.to_address;
          // Check contract address
          if (transfer.contract_address === tokenContract) {
            tokenMatches = true;
            amount = parseFloat(transfer.amount_str) / Math.pow(10, transfer.decimals);
          } else {
             return NextResponse.json({
              ok: false,
              reason: "WRONG_TOKEN",
              message: `Wrong token contract. Expected ${currency}.`
            });
          }
        } else {
           const first = data.trc20TransferInfo[0];
           if (first) recipient = first.to_address;
        }
      }
    }

    // Validation
    if (recipient !== officialAddress) {
      return NextResponse.json({
        ok: false,
        reason: "WRONG_RECIPIENT",
        message: `Payment sent to wrong address: ${recipient}. Expected: ${officialAddress}`
      });
    }

    if (!tokenMatches) {
       return NextResponse.json({
        ok: false,
        reason: "WRONG_TOKEN",
        message: "Transaction does not match the selected currency/token."
      });
    }

    // Check Amount
    const tolerance = expectedAmount * 0.01; 
    if (Math.abs(amount - expectedAmount) > tolerance) {
      return NextResponse.json({
        ok: false,
        reason: "WRONG_AMOUNT",
        message: `Incorrect amount. Received: ${amount} ${currency}. Expected: ${expectedAmount}`
      });
    }

    // Mark used
    await markTransactionUsed(txHash);

    return NextResponse.json({
      ok: true,
      confirmed: true,
      explorerUrl: `https://tronscan.org/#/transaction/${txHash}`,
      details: { amount, to: recipient, from: data.ownerAddress, confirmations: data.confirmations }
    });

  } catch (error) {
    console.error("Tron verification error:", error);
    return NextResponse.json({ ok: false, reason: "INTERNAL_ERROR", message: "Failed to verify Tron transaction." }, { status: 500 });
  }
}

async function verifyMockEvm(txHash: string, currency: string, expectedAmount: number) {
  // Only allow mock verification in development
  if (process.env.NODE_ENV === "development" && txHash === "0x123fakehash789mocktxid456") {
     await markTransactionUsed(txHash);
     return NextResponse.json({
      ok: true,
      confirmed: true,
      explorerUrl: `https://etherscan.io/tx/${txHash}`,
      details: { amount: expectedAmount, to: OFFICIAL_WALLETS.ETH, from: "0xUser...", confirmations: 10 }
    });
  }

  return NextResponse.json({
    ok: false,
    reason: "TX_NOT_FOUND",
    message: "Transaction not found (Mock EVM Verification)."
  });
}
