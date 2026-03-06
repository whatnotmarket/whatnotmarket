import { getOrderByTrackingId } from "@/lib/orders-db";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { CheckCircle2, Clock, Package, MapPin, Truck, AlertCircle } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: {
    trackingId: string;
  };
}

export default async function TrackingPage({ params }: PageProps) {
  const order = await getOrderByTrackingId(params.trackingId);

  if (!order) {
    return notFound();
  }

  // Calculate timeline steps based on order updates
  // We want to show the history of updates
  const updates = [...order.updates].reverse(); // Newest first

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-12 space-y-12 relative">
        {/* Background Ambient Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs text-zinc-400 font-mono">
            <span>Tracking ID:</span>
            <span className="text-white font-bold">{order.trackingId}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Order Tracking</h1>
          <p className="text-zinc-400">Real-time updates for your proxy order</p>
        </div>

        <div className="grid gap-8 relative z-10">
          {/* Order Summary */}
          <Squircle
            radius={24}
            smoothing={1}
            innerClassName="bg-[#1C1C1E] p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
          >
            <div className="space-y-1">
              <h3 className="font-bold text-white text-lg">Product Details</h3>
              <div className="text-sm text-zinc-400 max-w-md truncate">
                <a href={order.productUrl} target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">
                  {order.productUrl}
                </a>
              </div>
              <div className="flex gap-4 text-xs text-zinc-500 pt-2">
                <span>Qty: {order.quantity}</span>
                <span>•</span>
                <span>Total: {order.totalPaid.toFixed(2)} {order.currency}</span>
              </div>
            </div>
            
            <div className="px-4 py-2 rounded-xl bg-black border border-white/10 text-center min-w-[120px]">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Status</div>
              <div className="font-bold text-emerald-400">{order.status.replace(/_/g, " ")}</div>
            </div>
          </Squircle>

          {/* Locker Info (if assigned) */}
          {order.lockerDetails && (
            <Squircle
              radius={24}
              smoothing={1}
              innerClassName="bg-[#1C1C1E] p-6 border border-emerald-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Locker Assigned</h3>
                  <p className="text-zinc-400 text-sm mt-1">
                    Your item will be delivered to <strong>{order.lockerDetails.city}</strong> ({order.lockerDetails.region}).
                  </p>
                  {order.lockerDetails.code && (
                    <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg inline-block">
                      <div className="text-xs text-emerald-400 uppercase tracking-wider mb-1">Pickup Code</div>
                      <div className="text-xl font-mono font-bold text-white tracking-widest">
                        {order.lockerDetails.code}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Squircle>
          )}

          {/* Timeline */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white px-2">Timeline</h3>
            <div className="space-y-0 relative pl-4 border-l-2 border-zinc-800 ml-4">
              {updates.map((update, index) => {
                const isLatest = index === 0;
                return (
                  <div key={index} className="relative pl-8 pb-10 last:pb-0 group">
                    {/* Dot */}
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 transition-colors ${
                      isLatest 
                        ? "bg-black border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.2)]" 
                        : "bg-zinc-900 border-zinc-700"
                    }`} />
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className={`font-bold text-lg ${isLatest ? "text-white" : "text-zinc-400"}`}>
                          {update.status.replace(/_/g, " ")}
                        </h4>
                        <span className="text-xs text-zinc-600 font-mono">
                          {new Date(update.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className={`text-sm ${isLatest ? "text-zinc-300" : "text-zinc-500"}`}>
                        {update.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
