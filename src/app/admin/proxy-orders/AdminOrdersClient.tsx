"use client";

import { useState } from "react";
import { ProxyOrder, OrderStatus } from "@/lib/orders-db";
import { Button } from "@/components/ui/button";
import { Squircle } from "@/components/ui/Squircle";
import { toast } from "sonner";

interface AdminOrdersClientProps {
  initialOrders: ProxyOrder[];
}

export function AdminOrdersClient({ initialOrders }: AdminOrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<ProxyOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("CREATED");
  const [message, setMessage] = useState("");
  const [metadata, setMetadata] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [followerHandle, setFollowerHandle] = useState("");
  const [targetHandle, setTargetHandle] = useState("whatnotmarket");
  const [isTestingFollow, setIsTestingFollow] = useState(false);

  const handleFollowTest = async () => {
    if (!followerHandle.trim() || !targetHandle.trim()) {
      toast.error("Inserisci follower e target handle.");
      return;
    }

    setIsTestingFollow(true);
    try {
      const res = await fetch("/api/admin/notifications/test-follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerHandle,
          targetHandle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error || "Test follow non riuscito.");
        return;
      }

      toast.success("Follow test inviato. Controlla le notifiche del target.");
    } catch (error) {
      console.error(error);
      toast.error("Errore durante il test follow.");
    } finally {
      setIsTestingFollow(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    
    try {
      const res = await fetch("/api/admin/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          status: newStatus,
          message,
          metadata
        }),
      });
      
      if (res.ok) {
        alert("Order updated!");
        window.location.reload(); // Simple refresh to fetch new data
      } else {
        alert("Failed to update");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating order");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <Squircle
        radius={20}
        smoothing={1}
        innerClassName="bg-[#1C1C1E] p-5 border border-emerald-500/20 space-y-4"
      >
        <h2 className="text-lg font-bold text-white">Test Follow Notification</h2>
        <p className="text-sm text-zinc-400">
          Simula un follow da un profilo verso un altro. Questo crea anche la notifica `profile_followed`.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={followerHandle}
            onChange={(e) => setFollowerHandle(e.target.value)}
            placeholder="Follower handle (es. test)"
            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white"
          />
          <input
            value={targetHandle}
            onChange={(e) => setTargetHandle(e.target.value)}
            placeholder="Target handle (es. whatnotmarket)"
            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white"
          />
          <Button
            onClick={handleFollowTest}
            disabled={isTestingFollow}
            className="bg-white text-black hover:bg-zinc-200 font-bold"
          >
            {isTestingFollow ? "Testing..." : "Run Follow Test"}
          </Button>
        </div>
      </Squircle>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Order List */}
      <div className="col-span-1 space-y-4">
        <h2 className="text-xl font-bold mb-4">Orders ({orders.length})</h2>
        <div className="space-y-2 max-h-[80vh] overflow-y-auto pr-2">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                selectedOrder?.id === order.id
                  ? "bg-emerald-500/10 border-emerald-500"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs text-zinc-500">#{order.id.slice(0,6)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  order.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400" :
                  // @ts-ignore
                  order.status === "CANCELLED" ? "bg-red-500/20 text-red-400" :
                  "bg-zinc-800 text-zinc-400"
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="text-sm font-medium truncate">{order.productUrl}</div>
              <div className="text-xs text-zinc-500 mt-1">
                {new Date(order.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details & Actions */}
      <div className="col-span-2">
        {selectedOrder ? (
          <div className="space-y-8 sticky top-8">
            <Squircle radius={24} smoothing={1} innerClassName="bg-[#1C1C1E] p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">Order #{selectedOrder.id}</h2>
                  <div className="text-sm text-zinc-400 font-mono mt-1">Tracking ID: {selectedOrder.trackingId}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {selectedOrder.totalPaid?.toFixed(2)} {selectedOrder.currency}
                  </div>
                  <div className="text-sm text-zinc-500">Total Paid</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-zinc-500 block">Product URL</label>
                  <a href={selectedOrder.productUrl} target="_blank" className="text-emerald-400 truncate block">
                    {selectedOrder.productUrl}
                  </a>
                </div>
                <div>
                  <label className="text-zinc-500 block">Telegram</label>
                  <span className="text-white">{selectedOrder.telegramUsername || "N/A"}</span>
                </div>
                <div>
                  <label className="text-zinc-500 block">Location</label>
                  <span className="text-white">{selectedOrder.city}, {selectedOrder.country}</span>
                </div>
                <div>
                  <label className="text-zinc-500 block">Current Status</label>
                  <span className="text-white font-bold">{selectedOrder.status}</span>
                </div>
              </div>
            </Squircle>

            <Squircle radius={24} smoothing={1} innerClassName="bg-[#1C1C1E] p-6 space-y-6 border border-emerald-500/20">
              <h3 className="text-xl font-bold text-white">Update Status</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">New Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="CREATED">Created</option>
                    <option value="PLACED">Placed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="LOCKER_ASSIGNED">Locker Assigned</option>
                    <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                    <option value="PICKED_UP">Picked Up</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Update Message</label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Purchase confirmed..."
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {newStatus === "LOCKER_ASSIGNED" && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-black/50 rounded-lg border border-white/5">
                  <input
                    placeholder="Locker ID"
                    className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm text-white"
                    onChange={(e) => setMetadata({...metadata, lockerId: e.target.value})}
                  />
                  <input
                    placeholder="City"
                    className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm text-white"
                    onChange={(e) => setMetadata({...metadata, city: e.target.value})}
                  />
                  <input
                    placeholder="Region"
                    className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm text-white"
                    onChange={(e) => setMetadata({...metadata, region: e.target.value})}
                  />
                </div>
              )}

              {newStatus === "READY_FOR_PICKUP" && (
                <div className="p-4 bg-black/50 rounded-lg border border-white/5">
                   <input
                    placeholder="Pickup Code"
                    className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm text-white"
                    onChange={(e) => setMetadata({...metadata, pickupCode: e.target.value})}
                  />
                </div>
              )}

              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
              >
                {isUpdating ? "Updating..." : "Update Order Status"}
              </Button>
            </Squircle>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500">
            Select an order to manage
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
