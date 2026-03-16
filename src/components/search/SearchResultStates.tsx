"use client";

import { Sparkles } from "lucide-react";

export function SearchLoadingSkeleton() {
  return (
    <div className="space-y-2 px-3 py-3">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 rounded-xl px-3 py-2"
          style={{
            borderColor: "var(--cmdk-item-featured-border-color, var(--gc-border))",
            borderWidth: "var(--cmdk-item-featured-border-width, 2px)",
            borderStyle: "solid",
            backgroundColor: "var(--cmdk-item-featured-bg, var(--gc-surface))",
          }}
        >
          <div className="h-9 w-9 animate-pulse rounded-xl" style={{ backgroundColor: "var(--cmdk-item-icon-bg, var(--gc-surface))" }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-1/3 animate-pulse rounded" style={{ backgroundColor: "var(--cmdk-item-icon-bg, var(--gc-surface))" }} />
            <div className="h-3 w-2/3 animate-pulse rounded" style={{ backgroundColor: "var(--cmdk-item-icon-bg, var(--gc-surface))" }} />
          </div>
          <div className="h-3 w-16 animate-pulse rounded" style={{ backgroundColor: "var(--cmdk-item-icon-bg, var(--gc-surface))" }} />
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
      <div
        className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          borderColor: "var(--cmdk-item-icon-border-color, var(--gc-border))",
          borderWidth: "var(--cmdk-item-icon-border-width, 2px)",
          borderStyle: "solid",
          backgroundColor: "var(--cmdk-item-icon-bg, var(--gc-surface))",
        }}
      >
        <Sparkles className="h-4 w-4" style={{ color: "var(--cmdk-item-icon-color, var(--gc-text-secondary))" }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: "var(--cmdk-item-title-color, var(--gc-text-primary))" }}>No exact match for &quot;{query}&quot;</p>
      <p className="mt-1 text-xs" style={{ color: "var(--cmdk-item-description-color, var(--gc-text-tertiary))" }}>Try a brand, category, color, or a simpler keyword.</p>
    </div>
  );
}



