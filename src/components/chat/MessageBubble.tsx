"use client";

import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";
import { Squircle } from "@/components/ui/Squircle";

interface MessageBubbleProps {
  message: {
    text: string;
    time: string;
    status: string;
  };
  isMe: boolean;
  isLast: boolean;
}

export function MessageBubble({ message, isMe, isLast }: MessageBubbleProps) {
  return (
    <div className={cn("flex w-full mb-1 group/bubble", isMe ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[75%] relative flex flex-col", isMe ? "items-end" : "items-start")}>
        <Squircle
            radius={18}
            smoothing={1}
            corners="all"
            className={cn(
                "shadow-sm transition-transform duration-200", 
                isMe ? "origin-bottom-right" : "origin-bottom-left"
            )}
            innerClassName={cn(
                "px-4 py-2 relative text-[15px] leading-relaxed min-w-[120px]",
                isMe 
                  ? "bg-indigo-600 text-white" 
                  : "bg-[#27272a] text-zinc-100"
            )}
        >
            <p className="whitespace-pre-wrap break-words pr-2 pb-3.5">
                {message.text}
            </p>
            <div className={cn(
                "absolute bottom-1 right-3 flex items-center gap-1 text-[10px] select-none",
                isMe ? "text-indigo-200/80" : "text-zinc-500"
            )}>
                <span>{message.time}</span>
                {isMe && (
                    message.status === "read" 
                        ? <CheckCheck className="h-3 w-3 text-indigo-200" /> 
                        : <Check className="h-3 w-3" />
                )}
            </div>
        </Squircle>
      </div>
    </div>
  );
}
