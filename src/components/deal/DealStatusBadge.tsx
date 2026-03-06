"use client";

import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, Shield, Truck, Archive, XCircle, MessageCircle, AlertCircle, Package, Sparkles } from "lucide-react";

export type DealStatus = 
  | "deal_created"
  | "pending" 
  | "offer_sent"
  | "offer_received" 
  | "negotiation" 
  | "accepted" 
  | "awaiting_payment" 
  | "escrow" 
  | "shipped" 
  | "delivered" 
  | "completed" 
  | "cancelled";

interface DealStatusBadgeProps {
  status: DealStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<DealStatus, { label: string; icon: any; color: string; iconColor: string }> = {
  deal_created: {
    label: "New Deal",
    icon: Sparkles,
    color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    iconColor: "text-zinc-400"
  },
  pending: {
    label: "Pending Acceptance",
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    iconColor: "text-yellow-500"
  },
  offer_sent: {
    label: "Offer Sent",
    icon: MessageCircle,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    iconColor: "text-blue-400"
  },
  offer_received: {
    label: "Offer Received",
    icon: MessageCircle,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    iconColor: "text-blue-400"
  },
  negotiation: {
    label: "Negotiation",
    icon: MessageCircle,
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    iconColor: "text-orange-400"
  },
  accepted: {
    label: "Offer Accepted",
    icon: CheckCircle2,
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    iconColor: "text-green-400"
  },
  awaiting_payment: {
    label: "Awaiting Payment",
    icon: AlertCircle,
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    iconColor: "text-yellow-500"
  },
  escrow: {
    label: "Funds in Escrow",
    icon: Shield,
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    iconColor: "text-indigo-400"
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    iconColor: "text-purple-400"
  },
  delivered: {
    label: "Delivered",
    icon: Package,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    iconColor: "text-purple-400"
  },
  completed: {
    label: "Deal Completed",
    icon: Archive,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    iconColor: "text-emerald-400"
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    iconColor: "text-red-400"
  }
};

export function DealStatusBadge({ status, className, size = "md" }: DealStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending; // Fallback to pending if status not found
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-1.5 text-base gap-2"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <div className={cn(
      "inline-flex items-center rounded-full border font-medium transition-colors",
      config.color,
      sizeClasses[size],
      className
    )}>
      <Icon className={cn(iconSizes[size], config.iconColor)} />
      <span>{config.label}</span>
    </div>
  );
}
