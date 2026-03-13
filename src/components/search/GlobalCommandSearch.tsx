"use client";

import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Command as CommandIcon,
  Compass,
  CornerDownLeft,
  Search as SearchIcon,
  ShoppingBag,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { Command, CommandGroup, CommandInput, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { SmartSearchResultItem } from "@/components/search/SmartSearchResultItem";
import { SearchLoadingSkeleton, SmartEmptyState } from "@/components/search/SearchResultStates";
import { useSmartSearch } from "@/components/search/use-smart-search";
import type { SearchCatalogItem, SearchScopeId } from "@/components/search/search-types";

type GlobalCommandSearchProps = {
  className?: string;
};

type ScopeUI = {
  id: SearchScopeId;
  label: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
};

const SEARCH_SCOPES: Record<SearchScopeId, ScopeUI> = {
  users: { id: "users", label: "Users", hint: "Search users...", icon: UserRound },
  "verified-sellers": { id: "verified-sellers", label: "Verified Sellers", hint: "Search verified sellers...", icon: BadgeCheck },
  services: { id: "services", label: "Services", hint: "Search services...", icon: BriefcaseBusiness },
  products: { id: "products", label: "Products", hint: "Search products...", icon: ShoppingBag },
  wallet: { id: "wallet", label: "Wallet", hint: "Search wallet address...", icon: Wallet },
  pages: { id: "pages", label: "Pages", hint: "Search pages...", icon: Compass },
};

function toCapitalized(text: string): string {
  const clean = text.trim();
  if (!clean) return "";
  return `${clean.charAt(0).toUpperCase()}${clean.slice(1)}`;
}

function resolveScopeFromItem(item: SearchCatalogItem): SearchScopeId | null {
  if (item.id.startsWith("quick-users") || item.id.startsWith("suggest-users")) return "users";
  if (item.id.startsWith("quick-verified-sellers")) return "verified-sellers";
  if (item.id.startsWith("quick-services") || item.id.startsWith("suggest-services")) return "services";
  if (item.id.startsWith("quick-products") || item.id.startsWith("suggest-products")) return "products";
  if (item.id.startsWith("quick-wallet") || item.id.startsWith("suggest-wallet")) return "wallet";
  if (item.id.startsWith("quick-pages")) return "pages";
  return null;
}

function getActionLabel(item: SearchCatalogItem): string {
  const group = item.group.toLowerCase();
  const title = item.title.toLowerCase();
  const href = item.href.toLowerCase();
  const keywords = item.keywords.map((k) => k.toLowerCase()).join(" ");
  const combined = `${group} ${title} ${href} ${keywords}`;

  const isScopeSelector = resolveScopeFromItem(item) !== null;
  if (item.id.startsWith("quick-verified-sellers")) return "Search verified sellers";
  if (isScopeSelector) return "Select category";

  if (item.entityType === "prediction") return "Predict with AI";
  if (combined.includes("best sellers") || combined.includes("sellers of the week")) return "Open";
  if (combined.includes("verified sellers") || href.includes("/seller/")) return "Open seller profile";
  if (combined.includes("users") || href.includes("/buyer/") || combined.includes("buyer")) return "Open user profile";
  if (combined.includes("wallet")) return "Open wallet";
  if (combined.includes("category") || group.includes("categories") || href.includes("/category/")) {
    const categoryName = item.title.trim().toLowerCase();
    return categoryName ? `Open ${categoryName}` : "Open";
  }
  if (combined.includes("request") || href.includes("/requests")) return "Open request";
  if (combined.includes("service")) return "Open service";
  if (combined.includes("product")) return "Open product";
  if (combined.includes("page") || group.includes("site pages") || group.includes("trust & safety")) return "Explore more";
  return "Open";
}

export function GlobalCommandSearch({ className }: GlobalCommandSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeScope, setActiveScope] = useState<SearchScopeId | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { groupedItems, visibleGroups, isLoading, saveRecent, parsed } = useSmartSearch({
    open,
    query,
    activeScope,
  });

  const hotkeyLabel = useMemo(() => {
    if (typeof navigator === "undefined") return "Ctrl K";
    return navigator.platform.toUpperCase().includes("MAC") ? "Cmd K" : "Ctrl K";
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const next = !open;
        setOpen(next);
        if (!next) {
          setQuery("");
          setActiveScope(null);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
        setQuery("");
        setActiveScope(null);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
        setActiveScope(null);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const hasResults = useMemo(
    () => visibleGroups.some((group) => (groupedItems.get(group) ?? []).length > 0),
    [groupedItems, visibleGroups]
  );

  const firstItemId = useMemo(() => {
    for (const group of visibleGroups) {
      const list = groupedItems.get(group) ?? [];
      if (list.length) return list[0].id;
    }
    return null;
  }, [groupedItems, visibleGroups]);

  const onItemSelect = (item: SearchCatalogItem) => {
    const nextScope = resolveScopeFromItem(item);
    if (nextScope) {
      setActiveScope(nextScope);
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }

    if (item.entityType === "recent" || item.entityType === "trending" || item.entityType === "prediction") {
      setQuery(item.title);
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }

    saveRecent(query, item);
    setOpen(false);
    setQuery("");
    setActiveScope(null);
    router.push(item.href);
  };

  const openPalette = () => {
    setOpen((prev) => {
      const next = !prev;
      if (!next) {
        setQuery("");
        setActiveScope(null);
      }
      return next;
    });
  };

  return (
    <div ref={rootRef} className={cn("relative flex w-full items-center justify-center", className)}>
      <button
        type="button"
        onClick={openPalette}
        aria-label="Open global search"
        className="relative hidden h-10 w-full items-center gap-3 rounded-2xl border border-white/15 bg-[#101114] px-4 text-left text-sm text-zinc-300 transition-all duration-200 hover:border-white/25 hover:bg-[#17181d] md:flex"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <SearchIcon className="h-4 w-4 text-zinc-400" />
          <span className="truncate">Search products, brands, categories, sellers, pages...</span>
        </span>
        <span className="pointer-events-none inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-400/85">
          <CommandIcon className="h-3.5 w-3.5 text-zinc-500" />
          {hotkeyLabel}
        </span>
      </button>

      <button
        type="button"
        onClick={openPalette}
        aria-label="Open global search"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-zinc-200 transition-all hover:bg-white/20 md:hidden"
      >
        <SearchIcon className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-[calc(100%+0.5rem)] z-[80] w-full origin-top overflow-hidden rounded-3xl border border-white/15 bg-[#0b0c0e]/95 p-0 shadow-2xl backdrop-blur-xl"
          >
            <Command className="font-sans [&_*]:font-sans [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:tracking-normal [&_[cmdk-group-heading]]:text-zinc-200 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-1 [&_[cmdk-input]]:h-12 [&_[cmdk-input]]:w-full [&_[cmdk-input]]:bg-transparent [&_[cmdk-input]]:text-sm [&_[cmdk-input]]:outline-none [&_[cmdk-input]]:placeholder:text-zinc-500 [&_[cmdk-item]]:transition-colors [&_[cmdk-list]]:max-h-[68vh] [&_[cmdk-list]]:overflow-y-auto [&_[cmdk-list]]:overscroll-contain [&_[cmdk-item][data-disabled=true]]:pointer-events-none [&_[cmdk-item][data-selected=true]]:bg-white/10 [&_[cmdk-item][data-selected=true]]:text-white">
              {activeScope ? (
                <div className="px-4 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveScope(null)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:bg-white/10"
                    aria-label="Clear search scope"
                  >
                    {(() => {
                      const ScopeIcon = SEARCH_SCOPES[activeScope].icon;
                      return <ScopeIcon className="h-3.5 w-3.5" />;
                    })()}
                    <span>{SEARCH_SCOPES[activeScope].label}</span>
                    <X className="h-3.5 w-3.5 text-zinc-400" />
                  </button>
                </div>
              ) : null}

              <CommandInput
                ref={inputRef}
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder={activeScope ? SEARCH_SCOPES[activeScope].hint : "What do you need?"}
                aria-label="Smart marketplace search"
              />

              <CommandList className="no-scrollbar">
                {parsed.isShort && query.trim() ? (
                  <p className="px-4 pt-2 text-[11px] text-zinc-500">Keep typing for smarter intent detection…</p>
                ) : null}

                {isLoading ? (
                  <SearchLoadingSkeleton />
                ) : hasResults ? (
                  visibleGroups.map((group) => {
                    const groupItems = groupedItems.get(group) ?? [];
                    if (!groupItems.length) return null;

                    return (
                      <CommandGroup key={group} heading={toCapitalized(group)}>
                        {groupItems.map((item) => (
                          <SmartSearchResultItem
                            key={item.id}
                            item={item}
                            query={query}
                            actionLabel={getActionLabel(item)}
                            featured={item.id === firstItemId}
                            onSelect={onItemSelect}
                          />
                        ))}
                      </CommandGroup>
                    );
                  })
                ) : (
                  <SmartEmptyState query={query || "your search"} />
                )}

                <div className="sticky bottom-0 z-30 mt-2 border-t border-white/10 bg-[#0c0d10]/95 px-3 py-2 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-xs">
                      <span className="truncate font-semibold text-zinc-100">Open</span>
                      <kbd className="inline-flex h-6 items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 text-[11px] font-semibold text-zinc-300">
                        <CornerDownLeft className="h-3.5 w-3.5" />
                      </kbd>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 text-xs">
                      <span className="text-zinc-400">Actions</span>
                      <div className="inline-flex items-center gap-1">
                        <kbd className="inline-flex h-6 items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 text-[11px] font-semibold text-zinc-300">
                          {hotkeyLabel === "Cmd K" ? "Cmd" : "Ctrl"}
                        </kbd>
                        <kbd className="inline-flex h-6 items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 text-[11px] font-semibold text-zinc-300">
                          K
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </CommandList>
            </Command>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
