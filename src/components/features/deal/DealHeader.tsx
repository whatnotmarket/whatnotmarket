"use client";

import { cn } from "@/lib/core/utils/utils";
import { ArrowLeft,ChevronRight,Home } from "lucide-react";
import Link from "next/link";
import { DealStatus,DealStatusBadge } from "./DealStatusBadge";

interface DealHeaderProps {
  status: DealStatus;
  dealId: string;
  className?: string;
  onBack?: () => void;
}

export function DealHeader({ status, dealId, className, onBack }: DealHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full", className)}>
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
        </Link>
        <ChevronRight className="h-4 w-4 text-zinc-700" />
        <Link href="/my-deals" className="hover:text-white transition-colors">
            Deals
        </Link>
        <ChevronRight className="h-4 w-4 text-zinc-700" />
        <span className="text-zinc-300 font-medium truncate max-w-[200px]">{dealId}</span>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
        {onBack && (
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors sm:hidden"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>
        )}
        <DealStatusBadge status={status} size="lg" />
      </div>
    </div>
  );
}

