"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

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
  align = "left", // align is ignored for modal mode but kept for compatibility
  title
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
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10"
          >
            <div className={cn(
              "w-full max-w-[440px] overflow-hidden rounded-[20px] bg-[#0A0A0A] p-5 shadow-2xl no-scrollbar relative",
              className
            )}>
                {/* Title and Internal Close Button Header */}
                <div className="flex items-center justify-center relative mb-4">
                    {title && (
                        <div className="text-center text-[16px] font-medium text-white">
                            {title}
                        </div>
                    )}
                    
                    {/* Internal Close button as per spec "top-right corner inside" */}
                    <button
                        onClick={onClose}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white bg-[#1C1C1E] rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="bg-transparent rounded-xl overflow-hidden">
                    {children}
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
