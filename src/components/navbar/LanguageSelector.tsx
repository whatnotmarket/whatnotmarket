"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { NavPopup } from "./NavPopup";
import { cn } from "@/lib/utils";
import { ORIGINAL_LANGUAGE } from "@/lib/language-policy";
import * as Flags from 'country-flag-icons/react/3x2';

// Mock Data
const LANGUAGES = [
  { code: "en", name: "English", native: "English", Flag: Flags.US },
  { code: "ru", name: "Russian", native: "Русский", Flag: Flags.RU },
  { code: "hy", name: "Armenian", native: "հայერთն", Flag: Flags.AM },
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
  const [selected, setSelected] = useState(ORIGINAL_LANGUAGE.code); // Default to locked language but keep UI selectable state
  const [search, setSearch] = useState("");

  const filtered = LANGUAGES.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.native.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLang = LANGUAGES.find(l => l.code === selected);
  const Flag = selectedLang?.Flag || Flags.US;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm font-bold text-zinc-300 hover:text-white transition-all px-4 py-2 rounded-lg hover:bg-white/5 cursor-pointer"
      >
        <Flag className="w-5 h-5 rounded-[2px]" />
        <ChevronDown className={cn("h-3.5 w-3.5 text-zinc-500 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <NavPopup isOpen={isOpen} onClose={() => setIsOpen(false)} align="center" className="w-[380px]" title="Language">
        <div className="mb-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input 
                    className="w-full bg-[#2A2A2A] border-none rounded-[12px] py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:ring-0 focus:outline-none transition-all"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                />
            </div>
        </div>
        
        <div className="bg-[#222222] rounded-[16px] p-2">
            <div className="max-h-[400px] overflow-y-auto no-scrollbar space-y-1">
                {filtered.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => {
                            setIsOpen(false);
                        }}
                        className={cn(
                            "w-full flex items-center justify-between px-3 h-[50px] rounded-lg transition-all group hover:bg-white/5",
                            selected === lang.code ? "text-white" : "text-zinc-300 hover:text-white"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <lang.Flag className="w-5 h-5 rounded-[2px] shadow-sm" />
                            <span className="text-[15px] font-medium">{lang.native}</span>
                        </div>
                        <div className={cn(
                            "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                            selected === lang.code 
                                ? "bg-[#FF8A00] border-[#FF8A00]" 
                                : "bg-[#2A2A2A] border-zinc-700 group-hover:border-zinc-500"
                        )}>
                            {selected === lang.code && <div className="h-2 w-2 bg-white rounded-full" />}
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </NavPopup>
    </div>
  );
}
