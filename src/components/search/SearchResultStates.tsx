"use client";

import { Sparkles } from "lucide-react";

export function SearchLoadingSkeleton() {
  return (
    <div className="space-y-2 px-3 py-3">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-1/3 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

type SmartEmptyStateProps = {
  query: string;
};

export function SmartEmptyState({ query }: SmartEmptyStateProps) {
  return (
    <div className="px-4 py-10 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <Sparkles className="h-4 w-4 text-zinc-400" />
      </div>
      <p className="text-sm font-semibold text-zinc-100">No exact match for &quot;{query}&quot;</p>
      <p className="mt-1 text-xs text-zinc-400">Try a brand, category, color, or a simpler keyword.</p>
    </div>
  );
}
