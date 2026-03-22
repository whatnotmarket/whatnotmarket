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
  variant?: "default" | "polymarket";
  triggerPlaceholder?: string;
  rightHint?: string;
  triggerStyle?: "default" | "liquid-glass";
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

export function GlobalCommandSearch({
  className,
  variant = "default",
  triggerPlaceholder = "Search products, brands, categories, sellers, pages...",
  rightHint,
  triggerStyle = "default",
}: GlobalCommandSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeScope, setActiveScope] = useState<SearchScopeId | null>(null);
  const isPolymarketVariant = variant === "polymarket";
  const isLiquidGlassTrigger = isPolymarketVariant && triggerStyle === "liquid-glass";

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
  const resolvedRightHint = rightHint ?? (isPolymarketVariant ? "Ctrl K" : hotkeyLabel);
  const [hintModifier = "Ctrl", hintKey = "K"] = resolvedRightHint.split(" ");
  const triggerBackgroundColor = "var(--cmdk-trigger-bg, #13232D)";
  const triggerBorderColor = isPolymarketVariant
    ? "var(--cmdk-trigger-border-color, transparent)"
    : "var(--gc-border)";
  const triggerBoxShadow = "none";

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
    <div suppressHydrationWarning ref={rootRef} className={cn("relative flex w-full items-center justify-center", className)}>
      <button
        suppressHydrationWarning
        type="button"
        onClick={openPalette}
        aria-label="Open global search"
        className={cn(
          "group relative hidden w-full cursor-text items-center text-left transition md:flex",
          isLiquidGlassTrigger ? "liquid-glass-wrapper liquid-glass-pill liquid-glass-blur-minimal gap-2 px-4" : "",
          isPolymarketVariant
            ? "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 max-lg:text-[16px]"
            : "h-9 gap-3 rounded-2xl px-3 text-sm font-semibold"
        )}
        style={{
          backgroundColor: isLiquidGlassTrigger ? "transparent" : triggerBackgroundColor,
          backgroundImage: "none",
          borderColor: triggerBorderColor,
          borderWidth: isLiquidGlassTrigger
            ? "0px"
            : isPolymarketVariant
              ? "var(--cmdk-trigger-border-width, 1px)"
              : "2px",
          borderStyle: "solid",
          borderRadius: isPolymarketVariant ? "var(--cmdk-trigger-radius, 12px)" : undefined,
          height: isPolymarketVariant ? "var(--cmdk-trigger-height, 40px)" : undefined,
          paddingInline: isLiquidGlassTrigger
            ? "0px"
            : isPolymarketVariant
              ? "var(--cmdk-trigger-padding-x, 16px)"
              : undefined,
          paddingBlock: isLiquidGlassTrigger
            ? "0px"
            : isPolymarketVariant
              ? "var(--cmdk-trigger-padding-y, 4px)"
              : undefined,
          boxShadow: triggerBoxShadow,
          transition: "background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
          color: "var(--gc-text-primary)",
          opacity: 1,
          overflow: "hidden",
        }}
      >
        {isPolymarketVariant ? (
          isLiquidGlassTrigger ? (
            <>
              <span
                aria-hidden="true"
                className="liquid-glass-visual-layers absolute inset-0 rounded-[999px]"
              >
                <span className="liquid-glass-effect absolute inset-0 rounded-[999px] bg-[linear-gradient(180deg,rgba(22,8,12,0.86),rgba(14,8,10,0.90))] backdrop-blur-[14px] backdrop-saturate-[125%]" />
                <span className="liquid-glass-tint absolute inset-0 rounded-[999px] bg-[radial-gradient(125%_140%_at_50%_-40%,rgba(255,255,255,0.14),rgba(255,255,255,0.05)_34%,rgba(255,255,255,0)_62%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_40%,rgba(0,0,0,0.20)_100%)]" />
                <span className="liquid-glass-shine absolute inset-0 rounded-[999px] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.40),0_6px_22px_rgba(0,0,0,0.22)]" />
                <span className="liquid-glass-top-edge pointer-events-none absolute left-6 right-6 top-[1px] h-px bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.45),rgba(255,255,255,0))]" />
              </span>
              <span className="liquid-glass-content relative z-[1] flex h-full w-full items-center gap-2 px-4">
                <SearchIcon className="mr-2 h-4 w-4 shrink-0 text-[var(--cmdk-placeholder-color,#838383)]" />
                <span
                  className="flex-1 truncate text-left"
                  style={{
                    color: "var(--cmdk-placeholder-color, #838383)",
                    fontSize: "var(--cmdk-placeholder-size, 14px)",
                    fontWeight: "var(--cmdk-placeholder-weight, 500)",
                  }}
                >
                  {triggerPlaceholder}
                </span>
                <kbd className="pointer-events-none hidden h-5 select-none items-center justify-center gap-0.5 rounded-md border border-[var(--gc-border)] px-1.5 font-mono text-[10px] font-medium text-[var(--gc-text-primary)] opacity-0 transition-opacity group-hover:opacity-100 md:flex">
                  <span className="flex items-center">
                    <span className="text-xs leading-none">{hintModifier}</span>
                  </span>
                  <span>+</span>
                  <span>{hintKey}</span>
                </kbd>
              </span>
            </>
          ) : (
            <>
              <span className="flex min-w-0 flex-1 items-center" style={{ gap: "var(--cmdk-leading-gap, 12px)" }}>
                <SearchIcon
                  className="shrink-0"
                  style={{
                    color: "var(--cmdk-placeholder-color, #535353)",
                    width: "var(--cmdk-search-icon-size, 20px)",
                    height: "var(--cmdk-search-icon-size, 20px)",
                  }}
                />
                <span
                  className="truncate"
                  style={{
                    color: "var(--cmdk-placeholder-color, #535353)",
                    fontSize: "var(--cmdk-placeholder-size, 14px)",
                    fontWeight: "var(--cmdk-placeholder-weight, 500)",
                  }}
                >
                  {triggerPlaceholder}
                </span>
              </span>
              <span
                className="pointer-events-none inline-flex shrink-0 items-center leading-none"
                style={{
                  color: "var(--cmdk-shortcut-color, #535353)",
                  backgroundColor: "var(--cmdk-shortcut-bg, #2A3A4A)",
                  borderRadius: "var(--cmdk-shortcut-radius, 12px)",
                  paddingInline: "var(--cmdk-shortcut-padding-x, 10px)",
                  paddingBlock: "var(--cmdk-shortcut-padding-y, 6px)",
                  gap: "var(--cmdk-shortcut-gap, 6px)",
                }}
              >
                <CommandIcon
                  style={{
                    width: "var(--cmdk-shortcut-icon-size, 16px)",
                    height: "var(--cmdk-shortcut-icon-size, 16px)",
                  }}
                />
                <span
                  style={{
                    fontSize: "var(--cmdk-shortcut-font-size, 14px)",
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                  }}
                >
                  {resolvedRightHint}
                </span>
              </span>
            </>
          )
        ) : (
          <>
            <span className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
              <SearchIcon className="h-4 w-4 text-[var(--gc-text-primary)]" />
              <span className="truncate" style={{ color: "var(--gc-text-primary)" }}>
                {triggerPlaceholder}
              </span>
            </span>
            <span
              className="pointer-events-none inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px]"
              style={{
                backgroundColor: "var(--cmdk-trigger-bg, #13232D)",
                borderColor: "var(--gc-border)",
                borderWidth: "2px",
                borderStyle: "solid",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              <CommandIcon className="h-3.5 w-3.5 text-[var(--gc-text-primary)]/80" />
              {hotkeyLabel}
            </span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={openPalette}
        aria-label="Open global search"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl transition md:hidden"
        style={{
          backgroundColor: "var(--cmdk-trigger-bg, #13232D)",
          backgroundImage: "none",
          borderColor: "var(--gc-border)",
          borderWidth: "2px",
          borderStyle: "solid",
          color: "var(--gc-text-primary)",
          opacity: 1,
        }}
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
            className="absolute left-0 z-[80] w-full origin-top overflow-hidden p-0 backdrop-blur-xl"
            style={{
              top: "calc(100% + var(--cmdk-open-offset, 8px))",
              backgroundColor: "var(--cmdk-popup-bg, var(--cmdk-panel-bg, #13232D))",
              borderColor: "var(--cmdk-popup-border-color, var(--gc-border))",
              borderWidth: "var(--cmdk-popup-border-width, 2px)",
              borderStyle: "solid",
              borderRadius: "var(--cmdk-popup-radius, 24px)",
              boxShadow: "var(--cmdk-popup-shadow, none)",
              opacity: 1,
            }}
          >
            <Command className="font-sans [&_*]:font-sans [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:tracking-normal [&_[cmdk-group-heading]]:text-[var(--cmdk-group-heading-color,var(--gc-text-secondary))] [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-1 [&_[cmdk-item]]:transition-colors [&_[cmdk-list]]:max-h-[68vh] [&_[cmdk-list]]:overflow-y-auto [&_[cmdk-list]]:overscroll-contain [&_[cmdk-item][data-disabled=true]]:pointer-events-none [&_[cmdk-item][data-selected=true]]:bg-[var(--cmdk-item-selected-bg,var(--gc-surface))] [&_[cmdk-item][data-selected=true]]:text-[var(--cmdk-item-selected-text-color,var(--gc-text-primary))]">
              {activeScope ? (
                <div className="px-4 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveScope(null)}
                    className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition"
                    style={{
                      backgroundColor: "var(--cmdk-item-featured-bg, var(--gc-surface))",
                      borderColor: "var(--cmdk-item-featured-border-color, var(--gc-border))",
                      borderWidth: "var(--cmdk-item-featured-border-width, 2px)",
                      borderStyle: "solid",
                      color: "var(--cmdk-item-action-color, var(--gc-text-secondary))",
                      opacity: 1,
                    }}
                    aria-label="Clear search scope"
                  >
                    {(() => {
                      const ScopeIcon = SEARCH_SCOPES[activeScope].icon;
                      return <ScopeIcon className="h-3.5 w-3.5" />;
                    })()}
                    <span>{SEARCH_SCOPES[activeScope].label}</span>
                    <X className="h-3.5 w-3.5" style={{ color: "var(--cmdk-item-action-color, var(--gc-text-secondary))" }} />
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
                  <p className="px-4 pt-2 text-[11px]" style={{ color: "var(--cmdk-item-description-color, var(--gc-text-tertiary))" }}>Keep typing for smarter intent detection...</p>
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

                <div
                  className="sticky bottom-0 z-30 mt-2 px-3 py-2 backdrop-blur-md"
                  style={{
                    backgroundColor: "var(--cmdk-footer-bg, var(--gc-surface))",
                    borderTopColor: "var(--cmdk-footer-border-color, var(--gc-border))",
                    borderTopWidth: "var(--cmdk-footer-border-width, 2px)",
                    borderTopStyle: "solid",
                    opacity: 1,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-xs">
                      <span className="truncate font-semibold" style={{ color: "var(--cmdk-footer-primary-color, var(--gc-text-primary))" }}>Open</span>
                      <kbd
                        className="inline-flex h-6 items-center justify-center rounded-md px-2 text-[11px] font-semibold"
                        style={{
                          borderColor: "var(--cmdk-kbd-border-color, var(--gc-border))",
                          borderWidth: "var(--cmdk-kbd-border-width, 2px)",
                          borderStyle: "solid",
                          backgroundColor: "var(--cmdk-kbd-bg, var(--gc-surface))",
                          color: "var(--cmdk-kbd-text-color, var(--gc-text-secondary))",
                        }}
                      >
                        <CornerDownLeft className="h-3.5 w-3.5" />
                      </kbd>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 text-xs">
                      <span style={{ color: "var(--cmdk-footer-secondary-color, var(--gc-text-secondary))" }}>Actions</span>
                      <div className="inline-flex items-center gap-1">
                        <kbd
                          className="inline-flex h-6 items-center justify-center rounded-md px-2 text-[11px] font-semibold"
                          style={{
                            borderColor: "var(--cmdk-kbd-border-color, var(--gc-border))",
                            borderWidth: "var(--cmdk-kbd-border-width, 2px)",
                            borderStyle: "solid",
                            backgroundColor: "var(--cmdk-kbd-bg, var(--gc-surface))",
                            color: "var(--cmdk-kbd-text-color, var(--gc-text-secondary))",
                          }}
                        >
                          {hotkeyLabel === "Cmd K" ? "Cmd" : "Ctrl"}
                        </kbd>
                        <kbd
                          className="inline-flex h-6 items-center justify-center rounded-md px-2 text-[11px] font-semibold"
                          style={{
                            borderColor: "var(--cmdk-kbd-border-color, var(--gc-border))",
                            borderWidth: "var(--cmdk-kbd-border-width, 2px)",
                            borderStyle: "solid",
                            backgroundColor: "var(--cmdk-kbd-bg, var(--gc-surface))",
                            color: "var(--cmdk-kbd-text-color, var(--gc-text-secondary))",
                          }}
                        >
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





