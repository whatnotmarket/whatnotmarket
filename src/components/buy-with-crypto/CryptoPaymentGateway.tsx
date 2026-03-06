"use client";

import { useState } from "react";
import { Squircle } from "@/components/ui/Squircle";
import { Copy, Check, QrCode, RefreshCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CryptoPaymentGatewayProps {
  amount: number;
  currency: string;
  network?: string;
  onSuccess: () => void;
}

export function CryptoPaymentGateway({ amount, currency, network, onSuccess }: CryptoPaymentGatewayProps) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"awaiting" | "verifying" | "confirmed" | "error">("awaiting");
  
  // Wallet addresses mapping
  const addresses: Record<string, string> = {
    TRX: process.env.NEXT_PUBLIC_TRON_WALLET || "",
    // Default/Fallback address for other chains (EVM)
    default: process.env.NEXT_PUBLIC_EVM_WALLET || ""
  };

  const address = addresses[currency] || addresses.default;
  
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!txHash) return;
    
    setStatus("verifying");
    setErrorMsg("");

    try {
      const res = await fetch("/api/payments/verify-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "mock-order-id", // In real app, pass order ID
          currency,
          network,
          expectedAmount: amount,
          expectedAddress: address,
          txHash
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setStatus("confirmed");
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setStatus("error");
        setErrorMsg(data.message || "Transaction verification failed");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("Failed to connect to verification server");
    }
  };

  const simulatePayment = () => {
    setTxHash("0x123fakehash789mocktxid456");
    setTimeout(() => {
      handleVerify(); // This will fail with our mock logic unless we update it or allow this hash
      // But since handleVerify is async and uses the state, we might need to wait or pass it directly.
      // Actually, since setState is async, let's just force the success flow for dev button:
      setStatus("verifying");
      setTimeout(() => {
        setStatus("confirmed");
        setTimeout(onSuccess, 1000);
      }, 1500);
    }, 500);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-white">Send Payment</h3>
        <p className="text-sm text-zinc-400">
          Send <span className="text-white font-mono">{amount.toFixed(2)} {currency}</span> to the address below.
        </p>
      </div>

      <Squircle
        radius={24}
        smoothing={1}
        innerClassName="bg-[#1C1C1E] p-6 space-y-6"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center">
            {/* Dynamic QR Code based on currency */}
            <img 
              src={`/qrcodes/${currency.toUpperCase()}.png`} 
              alt={`${currency} QR Code`}
              className="w-56 h-56 object-contain rounded-xl"
              onError={(e) => {
                // Fallback to generic icon if image fails
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-56 h-56 bg-white rounded-xl flex items-center justify-center">
               <QrCode className="w-40 h-40 text-black" />
            </div>
          </div>
          
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs text-zinc-500 uppercase font-medium">
              <span>Network</span>
              <span className="text-white">{network || "Native"}</span>
            </div>
            
            <div className="relative group">
              <input
                type="text"
                readOnly
                value={address}
                className="w-full bg-[#2C2C2E] border border-white/5 rounded-lg pl-3 pr-10 py-3 text-sm text-zinc-300 font-mono truncate focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white bg-[#2C2C2E] rounded transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="w-full space-y-2 border-t border-white/5 pt-4">
            <label className="block text-sm font-medium text-white">
              Transaction Hash (TxID)
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder={currency === "ETH" || currency === "USDC" ? "0x..." : "Enter transaction hash"}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-mono text-sm"
            />
            <p className="text-xs text-zinc-500">
              After you send the payment, paste the transaction hash here so we can verify it.
            </p>
            <Button
              onClick={handleVerify}
              disabled={!txHash || status === "verifying" || status === "confirmed"}
              className="w-full bg-white text-black hover:bg-zinc-200 font-bold"
            >
              {status === "verifying" ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </div>
              ) : (
                "Verify Transaction"
              )}
            </Button>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Status</span>
            <div className="flex items-center gap-2">
              {status === "awaiting" && (
                <span className="text-zinc-300">Paste transaction hash to verify</span>
              )}
              {status === "verifying" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                  <span className="text-yellow-400">Verifying...</span>
                </>
              )}
              {status === "confirmed" && (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-400">Payment Verified</span>
                </>
              )}
              {status === "error" && (
                <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-2">
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 mt-0.5">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                    </div>
                    <span className="text-sm text-red-400 font-medium break-words">
                      {errorMsg || "Verification Failed"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Development Helper */}
        <div className="pt-4">
          <Button 
            variant="outline" 
            className="w-full text-xs text-zinc-500 hover:text-white border-dashed border-zinc-700"
            onClick={simulatePayment}
          >
            [Dev] Simulate Payment
          </Button>
        </div>
      </Squircle>
    </div>
  );
}
