"use client";

import { cn } from "@/lib/core/utils/utils";
import { Send, Paperclip, Smile } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Squircle } from "@/components/shared/ui/Squircle";

interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
  status?: "sent" | "read";
}

interface DealChatPanelProps {
  initialMessages?: Message[];
  className?: string;
  recipientName?: string;
  isOnline?: boolean;
  onSendMessage?: (text: string) => void;
}

export function DealChatPanel({ initialMessages = [], className, recipientName = "Seller", isOnline = true, onSendMessage }: DealChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent"
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
    onSendMessage?.(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Squircle
      radius={24}
      smoothing={0.8}
      className={cn("w-full h-full flex flex-col shadow-xl", className)}
      innerClassName="bg-zinc-900/40 backdrop-blur-md border border-white/5 flex flex-col overflow-hidden"
    >
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
        <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px]">
                <div className="h-full w-full rounded-full bg-zinc-900 overflow-hidden">
                    <img 
                        src={`https://ui-avatars.com/api/?name=${recipientName}&background=random`}
                        alt={recipientName}
                        className="h-full w-full object-cover"
                    />
                </div>
            </div>
            {isOnline && (
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-zinc-900" />
            )}
        </div>
        <div>
            <h3 className="font-semibold text-white text-sm">{recipientName}</h3>
            <p className="text-xs text-emerald-400 font-medium">Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2">
                <div className="p-3 rounded-full bg-white/5">
                    <MessageCircleIcon className="h-6 w-6 opacity-50" />
                </div>
                <p className="text-sm">Start the conversation</p>
            </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.sender === "me";
          return (
            <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[70%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed relative group shadow-sm",
                isMe 
                  ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-none" 
                  : "bg-zinc-800/80 backdrop-blur-sm border border-white/5 text-zinc-100 rounded-bl-none"
              )}>
                <p>{msg.text}</p>
                <span className={cn(
                  "text-[10px] block mt-1 text-right opacity-70",
                  isMe ? "text-indigo-100" : "text-zinc-400"
                )}>
                  {msg.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-white/5 bg-white/[0.02] flex items-end gap-2">
        <button className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0">
            <Paperclip className="h-5 w-5" />
        </button>
        
        <div className="flex-1 bg-zinc-900/50 border border-white/10 rounded-[20px] focus-within:border-zinc-700 focus-within:bg-zinc-900 transition-all flex items-center relative">
            <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-white px-4 py-2.5 placeholder:text-zinc-500"
            />
            <button className="p-2 mr-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <Smile className="h-5 w-5" />
            </button>
        </div>

        <button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20 shrink-0"
        >
            <Send className="h-5 w-5" />
        </button>
      </div>
    </Squircle>
  );
}

function MessageCircleIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
    )
}


