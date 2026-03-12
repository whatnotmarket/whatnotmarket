"use client";

import { useState } from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { ChevronDown, Search } from "lucide-react";
import { ORIGINAL_LANGUAGE } from "@/lib/language-policy";
import { cn } from "@/lib/utils";
import { NavPopup } from "./NavPopup";

const LANGUAGES = [
  { code: "en", name: "English", native: "English", Flag: Flags.US },
  { code: "ru", name: "Russian", native: "Русский", Flag: Flags.RU },
  { code: "hy", name: "Armenian", native: "Հայերեն", Flag: Flags.AM },
  { code: "az", name: "Azerbaijani", native: "Azərbaycan", Flag: Flags.AZ },
  { code: "zh", name: "Chinese", native: "简体中文", Flag: Flags.CN },
  { code: "cs", name: "Czech", native: "Čeština", Flag: Flags.CZ },
  { code: "nl", name: "Dutch", native: "Nederlands", Flag: Flags.NL },
  { code: "fr", name: "French", native: "Français", Flag: Flags.FR },
  { code: "ka", name: "Georgian", native: "ქართული", Flag: Flags.GE },
  { code: "de", name: "German", native: "Deutsch", Flag: Flags.DE },
];

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected] = useState(ORIGINAL_LANGUAGE.code);
  const [search, setSearch] = useState("");

  const filtered = LANGUAGES.filter(
    (language) =>
      language.name.toLowerCase().includes(search.toLowerCase()) ||
      language.native.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLang = LANGUAGES.find((language) => language.code === selected);
  const Flag = selectedLang?.Flag || Flags.US;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Open language selector"
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-zinc-300 transition-all hover:bg-white/5 hover:text-white"
      >
        <Flag className="h-5 w-5 rounded-[2px]" />
        <ChevronDown className={cn("h-3.5 w-3.5 text-zinc-500 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <NavPopup isOpen={isOpen} onClose={() => setIsOpen(false)} align="center" className="w-[380px]" title="Language">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              className="w-full rounded-[12px] border-none bg-[#1C1C1E] py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 transition-all focus:outline-none focus:ring-0"
              placeholder="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="rounded-[16px] bg-[#1C1C1E] p-2">
          <div className="no-scrollbar max-h-[400px] space-y-1 overflow-y-auto">
            {filtered.map((language) => (
              <button
                type="button"
                key={language.code}
                onClick={() => {
                  setIsOpen(false);
                }}
                className={cn(
                  "group flex h-[50px] w-full items-center justify-between rounded-lg px-3 transition-all hover:bg-white/5",
                  selected === language.code ? "text-white" : "text-zinc-300 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <language.Flag className="h-5 w-5 rounded-[2px] shadow-sm" />
                  <span className="text-[15px] font-medium">{language.native}</span>
                </div>
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                    selected === language.code
                      ? "border-white bg-white"
                      : "border-zinc-700 bg-transparent group-hover:border-zinc-500"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </NavPopup>
    </div>
  );
}
