"use client";

import Image from "next/image";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { CommandItem, CommandShortcut } from "@/components/ui/command";
import { SearchHighlightedText } from "@/components/search/SearchHighlightedText";
import type { SearchCatalogItem } from "@/components/search/search-types";

type SmartSearchResultItemProps = {
  item: SearchCatalogItem;
  query: string;
  actionLabel: string;
  featured?: boolean;
  onSelect: (item: SearchCatalogItem) => void;
};

function fallbackInitial(title: string): string {
  const clean = title.trim();
  if (!clean) return "?";
  return clean[0]?.toUpperCase() || "?";
}

export function SmartSearchResultItem({ item, query, actionLabel, featured = false, onSelect }: SmartSearchResultItemProps) {
  const Icon = item.icon;
  const showPrice = item.entityType === "product" && typeof item.price === "number";

  return (
    <CommandItem
      value={`${item.title} ${item.description} ${item.keywords.join(" ")}`}
      onSelect={() => onSelect(item)}
      className={[
        "group/item gap-3 py-2.5 data-[selected=true]:bg-white/10",
        featured ? "border border-white/10 bg-white/[0.04]" : "",
      ].join(" ")}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition-colors">
        {item.avatarUrl ? (
          <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-[#22242a]">
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-zinc-300">
              {fallbackInitial(item.title)}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.avatarUrl}
              alt={item.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </div>
        ) : item.thumbnailUrl ? (
          <Image src={item.thumbnailUrl} alt={item.title} width={32} height={32} className="h-8 w-8 object-cover" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-bold text-zinc-100">
            <SearchHighlightedText text={item.title} query={query} />
          </span>
          {item.id === "feature-buy-anywhere" ? (
            <Image
              src="/thinsmooth.svg"
              alt="Smart Search"
              width={20}
              height={20}
              className="h-5 w-5 brightness-0 invert"
            />
          ) : item.badge ? (
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-label="Verified profile" />
          ) : null}
          {showPrice ? (
            <span className="rounded-md border border-emerald-400/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
              {item.currency || "EUR"} {Math.round(item.price as number)}
            </span>
          ) : null}
        </div>

        <p className="truncate text-xs text-zinc-400">
          <SearchHighlightedText text={item.description} query={query} />
        </p>
      </div>

      <CommandShortcut className="flex items-center gap-1 text-zinc-500">
        {actionLabel}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </CommandShortcut>
    </CommandItem>
  );
}
