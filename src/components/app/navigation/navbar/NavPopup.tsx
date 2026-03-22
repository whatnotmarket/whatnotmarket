"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/core/utils/utils";

interface NavPopupProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  title?: string;
}

export function NavPopup({
  isOpen,
  onClose,
  children,
  className,
  title,
}: NavPopupProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10"
          >
            <div
              className={cn(
                "relative no-scrollbar w-full max-w-[440px] overflow-hidden rounded-[20px] bg-[#0A0A0A] p-5 shadow-2xl",
                className
              )}
            >
              <div className="relative mb-4 flex items-center justify-center">
                {title ? <div className="text-center text-[16px] font-medium text-white">{title}</div> : null}

                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={onClose}
                  className="absolute right-0 top-1/2 -translate-y-1/2 rounded-lg bg-[#1C1C1E] p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-hidden rounded-xl bg-transparent">{children}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


