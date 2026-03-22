"use client";

import { Box, MapPin, QrCode, Lock } from "lucide-react";
import { Squircle } from "@/components/shared/ui/Squircle";

interface LockerAssignmentCardProps {
  lockerId: string;
  city: string;
  region?: string;
  status: "assigned" | "ready" | "completed";
}

export function LockerAssignmentCard({ lockerId, city, region, status }: LockerAssignmentCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 p-6 space-y-6">
      <div className="flex items-center gap-4 border-b border-white/5 pb-4">
        <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center">
          <Box className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Assigned Pickup Locker</h3>
          <p className="text-sm text-zinc-400">Secure location for your delivery</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Locker ID</span>
          <div className="font-mono text-xl text-white font-bold tracking-wider">{lockerId}</div>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Location</span>
          <div className="flex items-center gap-2 text-white">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>{city} {region && `(${region})`}</span>
          </div>
        </div>
      </div>

      <div className="bg-zinc-950/50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-zinc-400" />
          Pickup Instructions
        </h4>
        <ul className="text-sm text-zinc-400 space-y-2 list-disc list-inside">
          <li>Wait for "Ready for Pickup" notification.</li>
          <li>Use the unique QR code that will be generated.</li>
          <li>Visit the locker location within 3 days.</li>
        </ul>
      </div>

      {status === "ready" && (
        <div className="flex justify-center pt-2">
          <button className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors">
            <QrCode className="w-5 h-5" />
            View Pickup Code
          </button>
        </div>
      )}
    </div>
  );
}

