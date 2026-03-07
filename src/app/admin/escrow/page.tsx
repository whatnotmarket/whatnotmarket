"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/primitives/card";

type EscrowAction = {
  id: string;
  action_type: string;
  notes: string | null;
  tx_hash: string | null;
  created_at: string;
};

type ListingPayment = {
  id: string;
  listing_id: string;
  amount: number;
  currency: string;
  chain: string;
  status: string;
  payer_wallet_address: string;
  target_wallet_address: string;
  tx_hash_in: string | null;
  tx_hash_out: string | null;
  created_at: string;
  actions: EscrowAction[];
};

export default function AdminEscrowPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ListingPayment[]>([]);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [releaseHash, setReleaseHash] = useState<Record<string, string>>({});

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/listing-payments");
      const payload = (await response.json().catch(() => null)) as
        | { payments?: ListingPayment[]; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load listing payments");
      }

      setRows(payload?.payments ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load listing payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [rows]
  );

  const runAdminAction = async (
    paymentId: string,
    action: "mark_awaiting_release" | "release" | "fail"
  ) => {
    setBusyPaymentId(paymentId);

    try {
      const payload: Record<string, string> = {
        paymentId,
        action,
      };

      if (action === "release") {
        const txHash = (releaseHash[paymentId] || "").trim();
        if (!txHash) {
          throw new Error("Release tx hash is required");
        }
        payload.txHashOut = txHash;
      }

      const response = await fetch("/api/admin/listing-payments/release", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `${action}:${paymentId}:${releaseHash[paymentId] || ""}`,
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(result?.error || "Action failed");
      }

      toast.success(`Payment updated: ${action}`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusyPaymentId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Escrow Control</h1>
            <p className="text-sm text-zinc-400">
              Manual release queue for listing wallet payments.
            </p>
          </div>
          <Button
            onClick={refresh}
            className="rounded-xl border-0 bg-white font-bold text-black hover:bg-zinc-200"
          >
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sorted.map((payment) => (
              <Card
                key={payment.id}
                radius={18}
                smoothing={1}
                border="default"
                innerClassName="bg-[#121214] border border-zinc-800 p-5 space-y-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wider text-zinc-500">
                      {payment.listing_id}
                    </div>
                    <div className="text-xl font-semibold">
                      {payment.amount} {payment.currency}
                    </div>
                    <div className="text-xs text-zinc-400">Chain: {payment.chain}</div>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1 text-xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{payment.status}</span>
                  </div>
                </div>

                <div className="grid gap-2 text-xs text-zinc-400">
                  <div className="font-mono">Payer wallet: {payment.payer_wallet_address}</div>
                  <div className="font-mono">Target wallet: {payment.target_wallet_address}</div>
                  <div className="font-mono">Tx in: {payment.tx_hash_in || "-"}</div>
                  <div className="font-mono">Tx out: {payment.tx_hash_out || "-"}</div>
                </div>

                <div className="flex flex-col gap-2 md:flex-row">
                  <input
                    value={releaseHash[payment.id] || ""}
                    onChange={(e) =>
                      setReleaseHash((prev) => ({
                        ...prev,
                        [payment.id]: e.target.value,
                      }))
                    }
                    placeholder="Release tx hash (required for release)"
                    className="h-10 flex-1 rounded-lg border border-zinc-700 bg-black px-3 text-sm text-zinc-200 outline-none"
                  />
                  <Button
                    disabled={busyPaymentId === payment.id}
                    onClick={() => runAdminAction(payment.id, "mark_awaiting_release")}
                    variant="outline"
                    className="border-zinc-700"
                  >
                    Queue
                  </Button>
                  <Button
                    disabled={busyPaymentId === payment.id}
                    onClick={() => runAdminAction(payment.id, "release")}
                    className="bg-emerald-500 text-black hover:bg-emerald-400"
                  >
                    Release
                  </Button>
                  <Button
                    disabled={busyPaymentId === payment.id}
                    onClick={() => runAdminAction(payment.id, "fail")}
                    variant="outline"
                    className="border-red-800 text-red-400 hover:bg-red-900/20"
                  >
                    Fail
                  </Button>
                </div>
              </Card>
            ))}

            {sorted.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-500">
                No listing payments in escrow queue.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
