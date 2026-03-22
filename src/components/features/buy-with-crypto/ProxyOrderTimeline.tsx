"use client";

import { Squircle } from "@/components/shared/ui/Squircle";
import { Check, Clock, Package, Truck, Box, ShieldCheck, MapPin, Lock } from "lucide-react";
import { LockerAssignmentCard } from "./LockerAssignmentCard";

export type OrderStatus = "PENDING_PURCHASE" | "ORDER_PLACED" | "PROCESSING" | "LOCKER_ASSIGNED" | "READY_FOR_PICKUP" | "COMPLETED" | "CANCELLED";

interface ProxyOrderTimelineProps {
  status: OrderStatus;
  orderId: string;
  lockerDetails?: {
    id: string;
    city: string;
    region?: string;
  };
}

const STATUS_ORDER: OrderStatus[] = [
  "PENDING_PURCHASE",
  "ORDER_PLACED",
  "PROCESSING",
  "LOCKER_ASSIGNED",
  "READY_FOR_PICKUP",
  "COMPLETED"
];

const STATUS_CONFIG: Record<OrderStatus, { icon: any, label: string, desc: string }> = {
  PENDING_PURCHASE: { icon: Clock, label: "Pending Purchase", desc: "We are processing your request." },
  ORDER_PLACED: { icon: Box, label: "Order Placed", desc: "Purchase made on your behalf." },
  PROCESSING: { icon: Package, label: "Processing", desc: "Seller is preparing your item." },
  LOCKER_ASSIGNED: { icon: MapPin, label: "Locker Assigned", desc: "Your secure pickup point has been assigned." },
  READY_FOR_PICKUP: { icon: Lock, label: "Ready for Pickup", desc: "Item is ready at your locker." },
  COMPLETED: { icon: Check, label: "Picked Up", desc: "Order completed successfully." },
  CANCELLED: { icon: ShieldCheck, label: "Cancelled", desc: "Order was cancelled and refunded." }
};

export function ProxyOrderTimeline({ status, orderId, lockerDetails }: ProxyOrderTimelineProps) {
  const currentStepIndex = STATUS_ORDER.indexOf(status);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Order Status</h3>
        <span className="text-sm font-mono text-zinc-500">#{orderId.slice(0, 8)}</span>
      </div>

      {(status === "LOCKER_ASSIGNED" || status === "READY_FOR_PICKUP" || status === "COMPLETED") && lockerDetails && (
        <LockerAssignmentCard
          lockerId={lockerDetails.id}
          city={lockerDetails.city}
          region={lockerDetails.region}
          status={status === "COMPLETED" ? "completed" : status === "READY_FOR_PICKUP" ? "ready" : "assigned"}
        />
      )}

      <Squircle
        radius={24}
        smoothing={1}
        innerClassName="bg-[#1C1C1E] p-8 space-y-8 relative overflow-hidden"
      >
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-zinc-800" />
        
        {STATUS_ORDER.map((stepStatus, index) => {
          const Config = STATUS_CONFIG[stepStatus];
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div key={stepStatus} className="relative flex items-start gap-6 group">
              <div 
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
                  isCompleted 
                    ? "bg-emerald-500 border-emerald-500 text-black" 
                    : "bg-[#1C1C1E] border-zinc-700 text-zinc-700"
                } ${isCurrent ? "ring-4 ring-emerald-500/20" : ""}`}
              >
                <Config.icon className="w-4 h-4" />
              </div>
              
              <div className={`flex-1 transition-opacity duration-500 ${isCompleted ? "opacity-100" : "opacity-40"}`}>
                <h4 className={`font-bold text-lg ${isCurrent ? "text-emerald-400" : "text-white"}`}>
                  {Config.label}
                </h4>
                <p className="text-zinc-400 text-sm">{Config.desc}</p>
              </div>
            </div>
          );
        })}
      </Squircle>
    </div>
  );
}

