"use client";

import { useRef, useEffect, useState } from "react";
import { Squircle } from "@/components/ui/Squircle";
import { cn } from "@/lib/utils";

const DEFAULT_CATEGORIES = [
  "All",
  "Accounts",
  "Gaming",
  "Telco",
  "Software",
  "Skins",
  "Social Media",
  "Crypto",
  "Services",
];

interface TrendingCategoryTabsProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
  categories?: string[];
  className?: string;
}

export function TrendingCategoryTabs({
  selectedCategory,
  onSelect,
  categories = DEFAULT_CATEGORIES,
  className,
}: TrendingCategoryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftFade(scrollLeft > 0);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScroll);
    }

    return () => {
      window.removeEventListener("resize", checkScroll);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", checkScroll);
      }
    };
  }, [categories]);

  return (
    <div className={cn("relative group overflow-hidden", className)}>
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-12 z-20 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none transition-opacity duration-300",
          showLeftFade ? "opacity-100" : "opacity-0"
        )}
      />

      <div ref={scrollContainerRef} className="no-scrollbar flex items-center gap-2.5 overflow-x-auto px-1 py-1">
        {categories.map((category) => {
          const isSelected = selectedCategory === category;

          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className="group/btn relative flex-shrink-0 rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Squircle
                as="div"
                radius={14}
                smoothing={1}
                borderWidth={1}
                borderColor="transparent"
                borderClassName={cn(
                  "transition-colors duration-200",
                  isSelected ? "stroke-white/10" : "stroke-white/[0.08] group-hover/btn:stroke-white/10"
                )}
                className={cn(
                  "text-[13px] transition-all duration-200",
                  isSelected ? "text-white font-bold shadow-lg shadow-black/20" : "text-zinc-400 font-medium hover:text-zinc-200"
                )}
                innerClassName={cn(
                  "px-4 py-2 transition-colors duration-200",
                  isSelected ? "bg-[#2C2C2E]" : "bg-[#1C1C1E] hover:bg-[#222224]"
                )}
              >
                {category}
              </Squircle>
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-12 z-20 bg-gradient-to-l from-black via-black/80 to-transparent pointer-events-none transition-opacity duration-300",
          showRightFade ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

