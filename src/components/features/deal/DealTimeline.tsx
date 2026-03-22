"use client";

import { Squircle } from "@/components/shared/ui/Squircle";
import { cn } from "@/lib/core/utils/utils";
import { Check,Circle } from "lucide-react";

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  status: "completed" | "current" | "upcoming";
  icon?: React.ElementType;
}

interface DealTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function DealTimeline({ events, className }: DealTimelineProps) {
  return (
    <Squircle
      radius={24}
      smoothing={0.8}
      className={cn("w-full shadow-lg", className)}
      innerClassName="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <ClockIcon className="h-5 w-5 text-indigo-400" />
        Activity Timeline
      </h3>
      
      <div className="relative space-y-0">
        {/* Vertical Line */}
        <div className="absolute left-6 top-4 bottom-4 w-px bg-zinc-800" />

        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          const Icon = event.icon || (event.status === "completed" ? Check : Circle);
          
          return (
            <div key={event.id} className={cn("relative flex gap-4 pb-8", isLast && "pb-0")}>
              {/* Icon Container */}
              <div className={cn(
                "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 transition-colors",
                event.status === "completed" ? "bg-indigo-600 border-zinc-950 text-white" :
                event.status === "current" ? "bg-zinc-900 border-indigo-500 text-indigo-400 ring-4 ring-indigo-500/20" :
                "bg-zinc-900 border-zinc-800 text-zinc-600"
              )}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex flex-col pt-1.5 min-w-0">
                <div className="flex items-baseline justify-between gap-4">
                  <h4 className={cn(
                    "text-sm font-semibold leading-none",
                    event.status === "upcoming" ? "text-zinc-500" : "text-white"
                  )}>
                    {event.title}
                  </h4>
                  <span className="text-xs text-zinc-500 font-mono shrink-0">
                    {event.date}
                  </span>
                </div>
                {event.description && (
                  <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Squircle>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}


