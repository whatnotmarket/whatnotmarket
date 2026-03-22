"use client";

import { Button } from "@/components/shared/ui/button";
import { Modal } from "@/components/shared/ui/Modal";
import { useUser } from "@/contexts/UserContext";
import { useWallet } from "@/contexts/WalletContext";
import { paymentsToast as toast } from "@/lib/domains/notifications";
import { CheckCircle2,Loader2,Wallet,XCircle } from "lucide-react";
import Link from "next/link";
import { useCallback,useEffect,useMemo,useState } from "react";
import { parseEther } from "viem";

type ListingPayment = {
  id: string;
  listing_id: string;
  amount: number;
  currency: string;
  chain: string;
  status: "pending" | "funded_to_escrow" | "awaiting_release" | "released" | "failed" | "cancelled";
  tx_hash_in: string | null;
  tx_hash_out: string | null;
  target_wallet_address: string;
  payer_wallet_address: string;
  created_at: string;
};

type Props = {
  listingId: string;
  amount: number;
  currency: string;
  chain: string;
  targetWalletAddress: string;
  payeeUserId?: string | null;
};

function statusMessage(status: ListingPayment["status"]) {
  if (status === "pending") return "Payment submitted. Awaiting on-chain funding.";
  if (status === "funded_to_escrow") return "Funds received in escrow.";
  if (status === "awaiting_release") return "Funds are in escrow and awaiting manual admin release.";
  if (status === "released") return "Funds released to recipient wallet.";
  if (status === "cancelled") return "Payment cancelled.";
  return "Payment failed.";
}

export function ListingWalletPayment({
  listingId,
  amount,
  currency,
  chain,
  targetWalletAddress,
  payeeUserId = null,
}: Props) {
  const { role } = useUser();
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletLinked, setWalletLinked] = useState(false);
  const [payment, setPayment] = useState<ListingPayment | null>(null);

  const isAuthenticated = role !== "guest";
  const escrowAddress = process.env.NEXT_PUBLIC_PLATFORM_ESCROW_WALLET || process.env.NEXT_PUBLIC_EVM_WALLET;

  const refreshPaymentState = useCallback(async () => {
    if (!isAuthenticated) return;

    const response = await fetch(
      `/api/listing-payments/by-listing?listingId=${encodeURIComponent(listingId)}`
    );
    const payload = (await response.json().catch(() => null)) as
      | { payments?: ListingPayment[] }
      | null;

    const latest = payload?.payments?.[0] ?? null;
    setPayment(latest);
  }, [isAuthenticated, listingId]);

  const refreshWalletLinkState = useCallback(async () => {
    if (!isAuthenticated || !wallet.address || !wallet.chainId) {
      setWalletLinked(false);
      return;
    }

    const response = await fetch("/api/wallets/me");
    const payload = (await response.json().catch(() => null)) as
      | { wallets?: Array<{ address: string; chain: string; verified_at: string | null }> }
      | null;

    const linked = (payload?.wallets ?? []).some(
      (entry) =>
        entry.address.toLowerCase() === wallet.address?.toLowerCase() &&
        entry.chain.toLowerCase() === wallet.chainId?.toLowerCase() &&
        !!entry.verified_at
    );
    setWalletLinked(linked);
  }, [isAuthenticated, wallet.address, wallet.chainId]);

  useEffect(() => {
    refreshPaymentState();
  }, [refreshPaymentState]);

  useEffect(() => {
    refreshWalletLinkState();
  }, [refreshWalletLinkState]);

  const canPay = useMemo(() => {
    if (!payment) return true;
    return payment.status === "pending" || payment.status === "cancelled" || payment.status === "failed";
  }, [payment]);

  const connectWallet = async () => {
    setLoading(true);
    try {
      const hasInjectedWallet =
        typeof window !== "undefined" &&
        Boolean((window as Window & { ethereum?: unknown }).ethereum);
      await wallet.connect(hasInjectedWallet ? "injected" : "walletconnect");
      await refreshWalletLinkState();
      toast.success("Wallet connected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const verifyWalletOwnership = async () => {
    if (!wallet.address || !wallet.chainId) {
      toast.error("Connect wallet first.");
      return;
    }

    setLoading(true);
    try {
      const challengeRes = await fetch("/api/wallets/link/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: wallet.address,
          chain: wallet.chainId,
        }),
      });
      const challengePayload = (await challengeRes.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      if (!challengeRes.ok || !challengePayload?.message) {
        throw new Error(challengePayload?.error || "Unable to create wallet challenge");
      }

      const signature = await wallet.signMessage(challengePayload.message);
      const verifyRes = await fetch("/api/wallets/link/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature,
          provider: wallet.providerKind || "walletconnect",
        }),
      });

      const verifyPayload = (await verifyRes.json().catch(() => null)) as
        | { wallet?: { id: string }; error?: string }
        | null;
      if (!verifyRes.ok || !verifyPayload?.wallet?.id) {
        throw new Error(verifyPayload?.error || "Wallet verification failed");
      }

      await refreshWalletLinkState();
      toast.success("Wallet verified and linked.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const createAndFundPayment = async () => {
    if (!wallet.address || !wallet.chainId) {
      toast.error("Connect wallet first.");
      return;
    }

    if (!walletLinked) {
      toast.error("Wallet must be verified before payment.");
      return;
    }

    if (wallet.chainId?.toLowerCase() !== chain.toLowerCase()) {
      toast.error(`Switch wallet network to ${chain} before paying this listing.`);
      return;
    }

    if (!escrowAddress) {
      toast.error("Escrow wallet is not configured.");
      return;
    }

    setLoading(true);
    try {
      const idempotencyKey = crypto.randomUUID();

      const createRes = await fetch("/api/listing-payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          listingId,
          payeeUserId,
          payerWalletAddress: wallet.address,
          targetWalletAddress,
          amount,
          currency,
          chain: chain.toLowerCase(),
        }),
      });

      const createPayload = (await createRes.json().catch(() => null)) as
        | { payment?: ListingPayment; error?: string }
        | null;

      if (!createRes.ok || !createPayload?.payment) {
        throw new Error(createPayload?.error || "Unable to create payment");
      }

      setPayment(createPayload.payment);

      const txHash = await wallet.sendTransaction({
        from: wallet.address,
        to: escrowAddress,
        valueHex: `0x${parseEther(String(amount)).toString(16)}`,
      });

      const fundRes = await fetch("/api/listing-payments/fund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: createPayload.payment.id,
          txHashIn: txHash,
        }),
      });

      const fundPayload = (await fundRes.json().catch(() => null)) as
        | { payment?: ListingPayment; error?: string }
        | null;

      if (!fundRes.ok || !fundPayload?.payment) {
        throw new Error(fundPayload?.error || "Unable to confirm escrow funding");
      }

      setPayment(fundPayload.payment);
      toast.success("Payment funded to escrow. Awaiting manual release.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  const cancelPayment = async () => {
    if (!payment) return;

    setLoading(true);
    try {
      const response = await fetch("/api/listing-payments/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: payment.id,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { payment?: ListingPayment; error?: string }
        | null;

      if (!response.ok || !payload?.payment) {
        throw new Error(payload?.error || "Unable to cancel payment");
      }

      setPayment(payload.payment);
      toast.success("Payment cancelled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel payment.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Button
        asChild
        className="w-full bg-zinc-200 text-black hover:bg-white"
      >
        <Link href={`/auth?next=${encodeURIComponent("/market")}`}>Sign in to pay with wallet</Link>
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full bg-zinc-100 text-black hover:bg-white">
        Pay with Wallet
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Wallet Escrow Payment">
        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <p className="text-zinc-300">
              Funds are sent to the platform escrow first. Admin releases funds manually to the recipient wallet.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Wallet status</span>
              <span className="font-medium text-white">
                {wallet.status === "connected" ? "Connected" : "Not connected"}
              </span>
            </div>
            {wallet.address && (
              <div className="font-mono text-xs text-zinc-500">{wallet.address}</div>
            )}
          </div>

          <div className="grid gap-2">
            <Button
              disabled={loading}
              onClick={connectWallet}
              variant="outline"
              className="border-zinc-700 text-zinc-200"
            >
              {loading && wallet.status === "connecting" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="mr-2 h-4 w-4" />
              )}
              Connect wallet
            </Button>

            <Button
              disabled={loading || !wallet.address || !wallet.chainId}
              onClick={verifyWalletOwnership}
              variant="outline"
              className="border-zinc-700 text-zinc-200"
            >
              Verify wallet ownership
            </Button>

            <Button
              disabled={loading || !walletLinked || !canPay}
              onClick={createAndFundPayment}
              className="bg-emerald-500 text-black hover:bg-emerald-400"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ${amount} ${currency}`}
            </Button>

            {payment?.status === "pending" && (
              <Button
                disabled={loading}
                onClick={cancelPayment}
                variant="outline"
                className="border-red-800 text-red-400"
              >
                Cancel payment
              </Button>
            )}
          </div>

          {payment && (
            <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="flex items-center gap-2">
                {payment.status === "released" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : payment.status === "failed" || payment.status === "cancelled" ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                )}
                <span className="font-medium text-white">{payment.status}</span>
              </div>
              <p className="text-xs text-zinc-400">{statusMessage(payment.status)}</p>
              <p className="text-xs font-mono text-zinc-500">Tx in: {payment.tx_hash_in || "-"}</p>
              <p className="text-xs font-mono text-zinc-500">Tx out: {payment.tx_hash_out || "-"}</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}


