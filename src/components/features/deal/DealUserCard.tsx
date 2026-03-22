"use client";

import { Squircle } from "@/components/shared/ui/Squircle";
import { cn } from "@/lib/core/utils/utils";
import { MapPin,MessageCircle,ShieldCheck,Star } from "lucide-react";
import Image from "next/image";

interface DealUserCardProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    reviews: number;
    location?: string;
    role: "seller" | "buyer";
    joined?: string;
  };
  className?: string;
  onMessage?: () => void;
  onCancel?: () => void;
  onFundEscrow?: () => void;
  onAcceptOffer?: () => void;
  onCounterOffer?: () => void;
  onSendOffer?: () => void;
  onEditOffer?: () => void;
  cancelLabel?: string;
  actionMessage?: string;
}

export function DealUserCard({ user, className, onMessage, onCancel, onFundEscrow, onAcceptOffer, onCounterOffer, onSendOffer, onEditOffer, cancelLabel = "Cancel Deal", actionMessage }: DealUserCardProps) {
  return (
    <Squircle
      radius={24}
      smoothing={0.8}
      className={cn("w-full shadow-lg", className)}
      innerClassName="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-6 flex flex-col gap-6"
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px]">
            <div className="h-full w-full rounded-full bg-zinc-900 overflow-hidden relative">
                <Image 
                    src={user.avatar} 
                    alt={user.name}
                    fill
                    className="object-cover"
                />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full px-2 py-0.5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {user.role}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate flex items-center gap-2">
                {user.name}
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
            </h3>
            
            <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="font-semibold text-white">{user.rating.toFixed(1)}</span>
                    <span className="text-zinc-600">({user.reviews})</span>
                </div>
                {user.location && (
                    <div className="flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 text-zinc-600" />
                        <span>{user.location}</span>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="grid gap-3 w-full">
        {actionMessage && (
            <div className="text-center text-sm text-zinc-400 font-medium mb-1">
                {actionMessage}
            </div>
        )}
        
        {/* Buyer Actions */}
        {onSendOffer && (
            <button 
                onClick={onSendOffer}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
                Send Offer
            </button>
        )}

        {onFundEscrow && (
            <button 
                onClick={onFundEscrow}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
                Fund Escrow
            </button>
        )}
        
        {/* Seller Actions */}
        {onAcceptOffer && (
            <button 
                onClick={onAcceptOffer}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
                Accept Offer
            </button>
        )}
        
        {onCounterOffer && (
            <button 
                onClick={onCounterOffer}
                className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all border border-white/5 active:scale-[0.98] flex items-center justify-center gap-2"
            >
                Send Counter Offer
            </button>
        )}
        
        {/* Shared Actions */}
        {onMessage && (
            <button 
                onClick={onMessage}
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all border border-white/5 active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <MessageCircle className="h-4 w-4" />
                Message {user.role === 'seller' ? 'Seller' : 'Buyer'}
            </button>
        )}

        {onEditOffer && (
                    <button 
                        onClick={onEditOffer}
                        className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all border border-white/5 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        Edit Offer
                    </button>
                )}

                {onCancel && (
                    <button 
                        onClick={onCancel}
                        className="w-full py-3 px-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm mt-1"
                    >
                        {cancelLabel}
                    </button>
                )}
      </div>
    </Squircle>
  );
}


