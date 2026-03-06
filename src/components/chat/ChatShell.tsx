"use client";

import { Squircle } from "@/components/ui/Squircle";
import { cn } from "@/lib/utils";

interface ChatShellProps {
  children: React.ReactNode;
  className?: string;
}

export function ChatShell({ children, className }: ChatShellProps) {
  return (
    <div className={cn("relative w-full h-[calc(100vh-140px)] min-h-[600px]", className)}>
      <Squircle
        radius={24}
        smoothing={0.8}
        className={cn("w-full h-full shadow-2xl", className)}
        innerClassName="bg-zinc-950/80 backdrop-blur-xl flex overflow-hidden"
        borderWidth={1}
        borderColor="rgba(255, 255, 255, 0.08)"
      >
        {children}
      </Squircle>
    </div>
  );
}
