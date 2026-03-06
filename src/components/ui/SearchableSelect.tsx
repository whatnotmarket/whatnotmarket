"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | string[];
  onChange: (value: any) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  searchPlaceholder?: string;
  multiple?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  className,
  searchPlaceholder = "Search...",
  multiple = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to check if a value is selected
  const isSelected = (optionValue: string) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  // Helper to get display label
  const getDisplayLabel = () => {
    if (multiple && Array.isArray(value) && value.length > 0) {
      if (value.length === 1) {
        return options.find(opt => opt.value === value[0])?.label;
      }
      return `${value.length} selected`;
    }
    const selected = options.find(opt => opt.value === value);
    return selected ? selected.label : null;
  };

  // Helper to get display icon (only for single selection)
  const getDisplayIcon = () => {
    if (multiple) return null;
    const selected = options.find(opt => opt.value === value);
    return selected ? selected.icon : null;
  };

  // Helper to get display subtitle (only for single selection)
  const getDisplaySubtitle = () => {
    if (multiple) return null;
    const selected = options.find(opt => opt.value === value);
    return selected ? selected.subtitle : null;
  };

  // Filter options based on search
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) || 
    opt.subtitle?.toLowerCase().includes(search.toLowerCase())
  );

  // Handle selection
  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
      // Don't close on selection for multiple mode
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearch("");
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {label && <label className="text-sm font-medium text-zinc-300">{label}</label>}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full h-14 flex items-center justify-between px-4 rounded-xl border transition-all duration-200 text-left",
            isOpen 
              ? "bg-[#2C2C2E] border-white/20 ring-1 ring-white/10" 
              : "bg-[#2C2C2E] border-white/5 hover:bg-[#323234] hover:border-white/10"
          )}
        >
          {getDisplayLabel() ? (
            <div className="flex items-center gap-3">
              {getDisplayIcon() && (
                <div className="text-xl shrink-0">
                  {getDisplayIcon()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{getDisplayLabel()}</span>
                {getDisplaySubtitle() && (
                  <span className="text-xs text-zinc-500">{getDisplaySubtitle()}</span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-sm text-zinc-500">{placeholder}</span>
          )}
          <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200", isOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.1 }}
              className="absolute z-50 w-full mt-2 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Search Bar */}
              <div className="p-3 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full h-10 pl-9 pr-4 bg-[#252527] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {/* Options List */}
              <div className="max-h-[280px] overflow-y-auto p-2 space-y-1 no-scrollbar">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => {
                    const selected = isSelected(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group",
                          selected
                            ? "bg-white/10" 
                            : "hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {option.icon && (
                            <div className="w-8 h-8 rounded-full bg-[#252527] flex items-center justify-center text-lg shrink-0 border border-white/5 group-hover:border-white/10 transition-colors">
                              {option.icon}
                            </div>
                          )}
                          <div className="flex flex-col items-start text-left">
                            <span className={cn(
                              "text-sm font-medium transition-colors",
                              selected ? "text-white" : "text-zinc-300 group-hover:text-white"
                            )}>
                              {option.label}
                            </span>
                            {option.subtitle && (
                              <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                                {option.subtitle}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {selected && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-zinc-500">
                    No results found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
