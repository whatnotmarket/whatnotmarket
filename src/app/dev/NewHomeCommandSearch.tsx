"use client";

import { GlobalCommandSearch } from "@/components/search/GlobalCommandSearch";
import { searchbarModify } from "./searchbar-modify";

type NewHomeCommandSearchProps = {
  className?: string;
};

export function NewHomeCommandSearch({ className }: NewHomeCommandSearchProps) {
  return (
    <GlobalCommandSearch
      className={className}
      variant="polymarket"
      triggerPlaceholder={searchbarModify.triggerPlaceholder}
      rightHint={searchbarModify.rightHint}
    />
  );
}
