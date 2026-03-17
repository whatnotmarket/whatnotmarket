import { NextResponse } from "next/server";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase-admin";
import { evaluateOrderTxBinding } from "@/lib/security/payment-guards";
import { isTrackingAccessAllowed } from "@/lib/security/order-tracking-guards";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";

const OFFICIAL_WALLETS = {
  TRX: process.env.NEXT_PUBLIC_TRON_WALLET || "",
  ETH: process.env.NEXT_PUBLIC_EVM_WALLET || "",
};

const TRON_TOKENS = {
  USDT: process.env.TRON_USDT_CONTRACT || "",
  USDC: process.env.TRON_USDC_CONTRACT || "",
};

type Payload = {
  orderId?: string;
  currency?: string;
  network?: string;
  txHash?: string;
  accessToken?: string;
};

type OrderRow = {
  id: string;
  total_paid: number | string;
  currency: string;
  network: string | null;
  tracking_access_token: string | null;
  payment_tx_hash: string | null;
  payment_verified_at: string | null;
  status: string;
  updates: unknown;
};

function parseAmount(value: number | string) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : NaN;
}

function isLikelyEvmHash(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

function isLikelyTronHash(value: string) {
  return /^[a-fA-F0-9]{64}$/.test(value);
}

function normalizeOrderId(raw: string | undefined) {
  return String(raw ?? "").trim();
}

function normalizeText(raw: string | undefined) {
  return String(raw ?? "").trim().toUpperCase();
}

function amountsMatch(received: number, expected: number) {
  const tolerance = Math.max(expected * 0.01, 0.000001);
  return Math.abs(received - expected) <= tolerance;
}

function toLowerSafe(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

async function getOrderById(orderId: string): Promise<OrderRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("proxy_orders")
    .select(
      "id,total_paid,currency,network,tracking_access_token,payment_tx_hash,payment_verified_at,status,updates"
    )
    .eq("id", orderId)
    .maybeSingle<OrderRow>();

  if (error) {
    throw new Error(`Unable to load order: ${error.message}`);
  }

  return data ?? null;
}

async function isTxHashAlreadyUsedByDifferentOrder(orderId: string, txHash: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("proxy_orders")
    .select("id")
    .eq("payment_tx_hash", txHash)
    .neq("id", orderId)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Unable to check tx hash reuse: ${error.message}`);
  }

  return Boolean(data?.id);
}

async function bindVerifiedTxToOrder(order: OrderRow, txHash: string, detailMessage: string) {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const nextStatus = order.status === "CREATED" ? "PLACED" : order.status;
  const currentUpdates = Array.isArray(order.updates) ? order.updates : [];
  const nextUpdates = [
    ...currentUpdates,
    {
      status: nextStatus,
      message: detailMessage,
      timestamp: nowIso,
      metadata: { txHash },
    },
  ];

  const { error } = await admin
    .from("proxy_orders")
    .update({
      payment_tx_hash: txHash,
      payment_verified_at: nowIso,
      status: nextStatus,
      updates: nextUpdates,
    })
    .eq("id", order.id);

  if (error) {
    throw new Error(`Unable to bind tx hash to order: ${error.message}`);
  }
}

function toEthAmount(valueHex: string) {
  const wei = BigInt(valueHex);
  return Number(wei) / 1_000_000_000_000_000_000;
}

async function callJsonRpc<T>(method: string, params: unknown[]): Promise<T | null> {
  const rpcUrl = process.env.EVM_RPC_URL;
  if (!rpcUrl) {
    throw new Error("EVM RPC is not configured");
  }

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC call failed with ${response.status}`);
  }

  const payload = (await response.json()) as { result?: T; error?: { message?: string } };
  if (payload.error) {
    throw new Error(payload.error.message || "RPC error");
  }

  return payload.result ?? null;
}

async function verifyEvmTransaction(params: {
  txHash: string;
  currency: string;
  expectedAmount: number;
}) {
  if (params.currency !== "ETH") {
    return {
      ok: false as const,
      reason: "WRONG_TOKEN",
      message: "Only ETH native transfer verification is supported on EVM.",
    };
  }

  const expectedRecipient = OFFICIAL_WALLETS.ETH;
  if (!expectedRecipient) {
    return {
      ok: false as const,
      reason: "VERIFICATION_UNAVAILABLE",
      message: "EVM recipient wallet is not configured.",
    };
  }

  let tx: {
    to: string | null;
    from: string | null;
    value: string;
    blockNumber: string | null;
  } | null = null;
  let receipt: {
    status: string | null;
    blockNumber: string | null;
  } | null = null;
  let blockHex: string | null = null;

  try {
    tx = await callJsonRpc<{
      to: string | null;
      from: string | null;
      value: string;
      blockNumber: string | null;
    }>("eth_getTransactionByHash", [params.txHash]);
    receipt = await callJsonRpc<{
      status: string | null;
      blockNumber: string | null;
    }>("eth_getTransactionReceipt", [params.txHash]);
    blockHex = await callJsonRpc<string>("eth_blockNumber", []);
  } catch {
    return {
      ok: false as const,
      reason: "VERIFICATION_UNAVAILABLE",
      message: "EVM verification backend is unavailable.",
    };
  }

  if (!tx) {
    return {
      ok: false as const,
      reason: "TX_NOT_FOUND",
      message: "Transaction not found on EVM network.",
    };
  }

  if (!receipt || receipt.status !== "0x1") {
    return {
      ok: false as const,
      reason: "NOT_CONFIRMED",
      message: "Transaction is not confirmed successfully.",
    };
  }

  if (toLowerSafe(tx.to) !== toLowerSafe(expectedRecipient)) {
    return {
      ok: false as const,
      reason: "WRONG_RECIPIENT",
      message: "Transaction recipient does not match official wallet.",
    };
  }

  const amount = toEthAmount(tx.value || "0x0");
  if (!amountsMatch(amount, params.expectedAmount)) {
    return {
      ok: false as const,
      reason: "WRONG_AMOUNT",
      message: `Incorrect amount. Received ${amount} ETH, expected ${params.expectedAmount} ETH.`,
    };
  }

  const currentBlock = blockHex ? Number.parseInt(blockHex, 16) : NaN;
  const txBlock = receipt.blockNumber ? Number.parseInt(receipt.blockNumber, 16) : NaN;
  const confirmations =
    Number.isFinite(currentBlock) && Number.isFinite(txBlock) ? Math.max(currentBlock - txBlock, 0) : 0;

  return {
    ok: true as const,
    explorerUrl: `https://etherscan.io/tx/${params.txHash}`,
    details: {
      amount,
      to: tx.to,
      from: tx.from,
      confirmations,
    },
  };
}

async function verifyTronTransaction(params: {
  txHash: string;
  currency: string;
  expectedAmount: number;
}) {
  const response = await fetch(`https://apilist.tronscan.org/api/transaction-info?hash=${params.txHash}`);
  const data = (await response.json()) as Record<string, unknown>;

  if (!data || Object.keys(data).length === 0 || data.message) {
    return {
      ok: false as const,
      reason: "TX_NOT_FOUND",
      message: "Transaction not found on Tron network.",
    };
  }

  if (String(data.contractRet || "") !== "SUCCESS") {
    return {
      ok: false as const,
      reason: "NOT_CONFIRMED",
      message: "Transaction failed or is not confirmed.",
    };
  }

  const expectedRecipient = OFFICIAL_WALLETS.TRX;
  if (!expectedRecipient) {
    return {
      ok: false as const,
      reason: "VERIFICATION_UNAVAILABLE",
      message: "Tron recipient wallet is not configured.",
    };
  }

  let recipient = "";
  let amount = 0;
  let tokenMatches = false;

  if (params.currency === "TRX") {
    const contractData = data.contractData as { to_address?: string; amount?: number } | undefined;
    if (contractData?.to_address && typeof contractData.amount === "number") {
      recipient = contractData.to_address;
      amount = contractData.amount / 1_000_000;
      tokenMatches = true;
    }
  } else {
    const tokenContract = TRON_TOKENS[params.currency as keyof typeof TRON_TOKENS];
    if (!tokenContract) {
      return {
        ok: false as const,
        reason: "WRONG_TOKEN",
        message: "Unsupported Tron token currency.",
      };
    }

    const transfers = Array.isArray(data.trc20TransferInfo)
      ? (data.trc20TransferInfo as Array<{
          to_address?: string;
          contract_address?: string;
          amount_str?: string;
          decimals?: number;
        }>)
      : [];

    const transfer = transfers.find((entry) => entry.to_address === expectedRecipient);
    if (!transfer?.to_address) {
      return {
        ok: false as const,
        reason: "WRONG_RECIPIENT",
        message: "No transfer to official Tron wallet found.",
      };
    }

    recipient = transfer.to_address;
    if (transfer.contract_address !== tokenContract) {
      return {
        ok: false as const,
        reason: "WRONG_TOKEN",
        message: "Token contract does not match expected currency.",
      };
    }

    const rawAmount = Number(transfer.amount_str || "0");
    const decimals = Number(transfer.decimals || 0);
    amount = rawAmount / Math.pow(10, decimals);
    tokenMatches = true;
  }

  if (recipient !== expectedRecipient) {
    return {
      ok: false as const,
      reason: "WRONG_RECIPIENT",
      message: "Transaction recipient does not match official wallet.",
    };
  }

  if (!tokenMatches) {
    return {
      ok: false as const,
      reason: "WRONG_TOKEN",
      message: "Transaction token does not match selected currency.",
    };
  }

  if (!amountsMatch(amount, params.expectedAmount)) {
    return {
      ok: false as const,
      reason: "WRONG_AMOUNT",
      message: `Incorrect amount. Received ${amount} ${params.currency}, expected ${params.expectedAmount}.`,
    };
  }

  return {
    ok: true as const,
    explorerUrl: `https://tronscan.org/#/transaction/${params.txHash}`,
    details: {
      amount,
      to: recipient,
      from: String(data.ownerAddress || ""),
      confirmations: Number(data.confirmations || 0),
    },
  };
}

export async function POST(req: Request) {
  const rateLimit = checkRateLimitDetailed(req, { action: "payment_verify_tx" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const abuseGuard = await enforceAbuseGuard({
    request: req,
    action: "payment_verify_tx",
    endpointGroup: "payment",
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Payload;
    const orderId = normalizeOrderId(body.orderId);
    const txHash = String(body.txHash ?? "").trim();
    const accessToken = String(body.accessToken ?? "").trim();
    const requestedCurrency = normalizeText(body.currency);
    const requestedNetwork = normalizeText(body.network);

    if (!orderId) {
      return NextResponse.json(
        { ok: false, reason: "ORDER_REQUIRED", message: "Order ID is required." },
        { status: 400 }
      );
    }

    if (!txHash) {
      return NextResponse.json(
        { ok: false, reason: "TX_REQUIRED", message: "Transaction hash is required." },
        { status: 400 }
      );
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { ok: false, reason: "ORDER_NOT_FOUND", message: "Order not found." },
        { status: 404 }
      );
    }

    if (!isTrackingAccessAllowed(order.tracking_access_token, accessToken)) {
      return NextResponse.json(
        {
          ok: false,
          reason: "ORDER_ACCESS_DENIED",
          message: "Order verification access denied.",
        },
        { status: 403 }
      );
    }

    const orderCurrency = normalizeText(order.currency);
    const orderNetwork = normalizeText(order.network ?? "");
    const expectedAmount = parseAmount(order.total_paid);

    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return NextResponse.json(
        { ok: false, reason: "INVALID_ORDER_AMOUNT", message: "Order amount is invalid." },
        { status: 400 }
      );
    }

    if (requestedCurrency && requestedCurrency !== orderCurrency) {
      return NextResponse.json(
        { ok: false, reason: "ORDER_CURRENCY_MISMATCH", message: "Currency does not match order." },
        { status: 400 }
      );
    }

    if (requestedNetwork && orderNetwork && requestedNetwork !== orderNetwork) {
      return NextResponse.json(
        { ok: false, reason: "ORDER_NETWORK_MISMATCH", message: "Network does not match order." },
        { status: 400 }
      );
    }

    const bindingGuard = evaluateOrderTxBinding(order.payment_tx_hash, txHash);
    if (bindingGuard.bindable && bindingGuard.idempotent) {
      return NextResponse.json({
        ok: true,
        confirmed: true,
        idempotent: true,
        details: { orderId: order.id, txHash: order.payment_tx_hash },
      });
    }
    if (!bindingGuard.bindable) {
      return NextResponse.json({
        ok: false,
        reason: "ORDER_ALREADY_HAS_PAYMENT_TX",
        message: bindingGuard.reason,
      });
    }

    const txAlreadyUsed = await isTxHashAlreadyUsedByDifferentOrder(order.id, txHash);
    if (txAlreadyUsed) {
      return NextResponse.json({
        ok: false,
        reason: "TX_ALREADY_USED",
        message: "This transaction hash is already bound to another order.",
      });
    }

    const isEvm = isLikelyEvmHash(txHash);
    const isTron = isLikelyTronHash(txHash);
    if (!isEvm && !isTron) {
      return NextResponse.json(
        { ok: false, reason: "TX_FORMAT_INVALID", message: "Invalid transaction hash format." },
        { status: 400 }
      );
    }

    const verification = isTron
      ? await verifyTronTransaction({
          txHash,
          currency: orderCurrency,
          expectedAmount,
        })
      : await verifyEvmTransaction({
          txHash,
          currency: orderCurrency,
          expectedAmount,
        });

    if (!verification.ok) {
      return NextResponse.json({
        ok: false,
        reason: verification.reason,
        message: verification.message,
      });
    }

    await bindVerifiedTxToOrder(
      order,
      txHash,
      "Payment transaction verified and bound to this order."
    );

    return NextResponse.json({
      ok: true,
      confirmed: true,
      explorerUrl: verification.explorerUrl,
      details: verification.details,
    });
  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { ok: false, reason: "INTERNAL_ERROR", message: "Verification server error" },
      { status: 500 }
    );
  }
}
