"use client";

import { cn } from "@/lib/utils";
import { Squircle } from "@/components/ui/Squircle";

interface Action {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost";
  icon?: React.ElementType;
  disabled?: boolean;
}

interface DealActionsProps {
  actions: Action[];
  className?: string;
}

export function DealActions({ actions, className }: DealActionsProps) {
  if (actions.length === 0) return null;

  return (
    <Squircle
      radius={20}
      smoothing={0.8}
      className={cn("w-full shadow-lg", className)}
      innerClassName="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-4 flex flex-col gap-3"
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        
        // Map variants to classes
        const variantClasses = {
            primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 shadow-lg",
            secondary: "bg-white text-black hover:bg-zinc-200",
            outline: "bg-transparent border border-white/10 text-white hover:bg-white/5",
            destructive: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
            ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5"
        };

        return (
            <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
                    variantClasses[action.variant || "primary"]
                )}
            >
                {Icon && <Icon className="h-4 w-4" />}
                {action.label}
            </button>
        );
      })}
    </Squircle>
  );
}
