"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, className, side = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const gap = 8; // Space between trigger and tooltip

    let top = 0;
    let left = 0;

    switch (side) {
      case "top":
        top = rect.top + scrollY - gap;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + scrollY + gap;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case "left":
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - gap;
        break;
      case "right":
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + gap;
        break;
    }

    setPosition({ top, left });
    setIsVisible(true);
  };

  const arrowTransformMap = {
    top: "bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r",
    bottom: "top-[-4px] left-1/2 -translate-x-1/2 border-t border-l",
    left: "right-[-4px] top-1/2 -translate-y-1/2 border-t border-r",
    right: "left-[-4px] top-1/2 -translate-y-1/2 border-b border-l",
  };

  const initialMap = {
    top: { opacity: 0, scale: 0.9, x: "-50%", y: "calc(-100% + 5px)" },
    bottom: { opacity: 0, scale: 0.9, x: "-50%", y: -5 },
    left: { opacity: 0, scale: 0.9, x: "calc(-100% + 5px)", y: "-50%" },
    right: { opacity: 0, scale: 0.9, x: -5, y: "-50%" },
  };

  const animateMap = {
    top: { opacity: 1, scale: 1, x: "-50%", y: "-100%" },
    bottom: { opacity: 1, scale: 1, x: "-50%", y: 0 },
    left: { opacity: 1, scale: 1, x: "-100%", y: "-50%" },
    right: { opacity: 1, scale: 1, x: 0, y: "-50%" },
  };

  const exitMap = {
    top: { opacity: 0, scale: 0.9, x: "-50%", y: "calc(-100% + 5px)" },
    bottom: { opacity: 0, scale: 0.9, x: "-50%", y: -5 },
    left: { opacity: 0, scale: 0.9, x: "calc(-100% + 5px)", y: "-50%" },
    right: { opacity: 0, scale: 0.9, x: -5, y: "-50%" },
  };

  return (
    <>
      <div 
        className={cn("inline-block cursor-help", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={handleMouseEnter as any}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {mounted && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={initialMap[side]}
              animate={animateMap[side]}
              exit={exitMap[side]}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                top: position.top,
                left: position.left,
                zIndex: 9999,
                pointerEvents: "none",
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 border border-white/10 rounded-lg shadow-xl whitespace-nowrap",
              )}
            >
              {content}
              {/* Arrow */}
              <div 
                className={cn(
                  "absolute w-2 h-2 bg-zinc-900 border-white/10 transform rotate-45",
                  arrowTransformMap[side]
                )} 
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
