"use client";

import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";

interface DealLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}

export function DealLayout({ children, header, className }: DealLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      <Navbar />
      
      <main className={cn("container mx-auto px-4 py-8 max-w-7xl", className)}>
        {header && <div className="mb-8">{header}</div>}
        
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start relative">
            {children}
        </div>
      </main>
    </div>
  );
}

export function DealMainColumn({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("lg:col-span-8 space-y-6 min-w-0", className)}>
            {children}
        </div>
    );
}

export function DealSideColumn({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("lg:col-span-4 space-y-6 sticky top-24", className)}>
            {children}
        </div>
    );
}
