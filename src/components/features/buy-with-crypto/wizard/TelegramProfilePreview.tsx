"use client";

import { Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Squircle } from "@/components/shared/ui/Squircle";

interface TelegramProfilePreviewProps {
  username: string;
  photoUrl?: string;
  isLoading?: boolean;
  error?: string | null;
}

export function TelegramProfilePreview({
  username,
  photoUrl,
  isLoading,
  error
}: TelegramProfilePreviewProps) {
  if (!username) return null;

  if (error) {
    return (
      <Squircle
        radius={16}
        smoothing={1}
        innerClassName="bg-[#1C1C1E] p-3 flex items-center gap-3 border border-red-500/20"
      >
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
          <X className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-red-400">Profile Not Found</span>
          <span className="text-xs text-zinc-400 truncate">
            Unable to find this Telegram profile. Please check the username.
          </span>
        </div>
      </Squircle>
    );
  }

  if (isLoading) {
    return (
      <Squircle
        radius={16}
        smoothing={1}
        innerClassName="bg-[#1C1C1E] p-3 flex items-center gap-3 border border-white/5"
      >
        <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse shrink-0" />
        <div className="flex flex-col min-w-0 space-y-2 w-full">
          <div className="h-4 bg-white/5 rounded w-24 animate-pulse" />
          <div className="h-3 bg-white/5 rounded w-32 animate-pulse" />
        </div>
      </Squircle>
    );
  }

  return (
    <Squircle
      radius={16}
      smoothing={1}
      innerClassName="bg-[#1C1C1E] p-3 flex items-center gap-3 border border-white/5"
    >
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-white/10">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={username} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#229ED9] flex items-center justify-center text-white font-bold text-lg">
              {username.charAt(1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-[#1C1C1E] rounded-full p-0.5">
          <div className="bg-emerald-500 rounded-full p-0.5">
            <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-bold text-white truncate">{username}</span>
        <span className="text-xs text-emerald-400 font-medium truncate">
          Telegram profile detected
        </span>
      </div>
    </Squircle>
  );
}

