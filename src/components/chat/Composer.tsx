"use client";

import { Paperclip, Smile, Send, Mic } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ComposerProps {
  onSend: (text: string) => void;
}

export function Composer({ onSend }: ComposerProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        onSend(text);
        setText("");
      }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [text]);

  return (
    <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
      <button className="p-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0">
        <Paperclip className="h-5 w-5" />
      </button>
      
      <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-[24px] focus-within:border-zinc-700 focus-within:bg-zinc-900 transition-all flex items-end relative shadow-inner">
        <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            className="w-full bg-transparent border-none text-white placeholder-zinc-500 resize-none py-3 pl-4 pr-10 max-h-32 min-h-[46px] focus:ring-0 text-[15px] scrollbar-hide rounded-[24px]"
            rows={1}
        />
        <button className="absolute right-2 bottom-2 p-2 text-zinc-400 hover:text-yellow-400 transition-colors">
            <Smile className="h-5 w-5" />
        </button>
      </div>

      {text.trim() ? (
        <button 
            onClick={() => {
                if (text.trim()) {
                    onSend(text);
                    setText("");
                }
            }}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all shadow-lg shrink-0 scale-100 active:scale-95 animate-in zoom-in duration-200"
        >
            <Send className="h-5 w-5 ml-0.5" />
        </button>
      ) : (
        <button className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-all shrink-0">
            <Mic className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
