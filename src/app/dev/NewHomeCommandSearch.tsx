"use client";

import { GlobalCommandSearch } from "@/components/search/GlobalCommandSearch";
import { commandSearchTheme } from "./command-search-theme";

type NewHomeCommandSearchProps = {
  className?: string;
};

export function NewHomeCommandSearch({ className }: NewHomeCommandSearchProps) {
  return (
    <GlobalCommandSearch
      className={className}
      variant="polymarket"
      triggerPlaceholder={commandSearchTheme.triggerPlaceholder}
      rightHint={commandSearchTheme.rightHint}
    />
  );
}
