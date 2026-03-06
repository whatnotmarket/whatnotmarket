"use client";

import { cn } from "@/lib/utils";
import { MoreVertical, Phone, Video, Search, ArrowLeft } from "lucide-react";
import { Conversation } from "./ConversationList";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";
import { useState, useEffect, useRef } from "react";

// Mock messages
const MOCK_MESSAGES = [
  { id: 1, text: "Hi there! Is this item still available?", sender: "them", time: "10:00 AM", status: "read" },
  { id: 2, text: "Yes it is! Are you interested?", sender: "me", time: "10:05 AM", status: "read" },
  { id: 3, text: "I can do tomorrow afternoon around 2pm if that works for you?", sender: "them", time: "10:07 AM", status: "read" },
];

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
}

export function ChatView({ conversation, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, conversation.id]);

  const handleSend = (text: string) => {
    setMessages([...messages, {
      id: Date.now(),
      text,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent"
    }]);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0b0b0c]/50 relative">
      {/* Header */}
      <div className="h-[68px] border-b border-white/5 flex items-center justify-between px-4 bg-white/[0.02] backdrop-blur-xl shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="relative group cursor-pointer">
             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center text-sm font-bold text-zinc-300 shadow-md">
                {conversation.user.name[0]}
             </div>
             {conversation.user.status === "online" && (
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#18181b]" />
             )}
          </div>
          
          <div className="cursor-pointer">
            <h3 className="font-bold text-white text-[15px] leading-tight group-hover:underline decoration-white/30">{conversation.user.name}</h3>
            <p className="text-xs text-indigo-300 font-medium">
              {conversation.user.status === "online" ? "Online" : `Last seen ${conversation.user.lastSeen || "recently"}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-zinc-400">
          <button className="p-2.5 hover:bg-white/5 hover:text-white rounded-full transition-colors hidden sm:block"><Search className="h-5 w-5" /></button>
          <button className="p-2.5 hover:bg-white/5 hover:text-white rounded-full transition-colors hidden sm:block"><Phone className="h-5 w-5" /></button>
          <button className="p-2.5 hover:bg-white/5 hover:text-white rounded-full transition-colors"><MoreVertical className="h-5 w-5" /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar" ref={scrollRef}>
        <div className="flex justify-center py-4">
            <span className="text-xs font-bold text-zinc-500 bg-zinc-900/50 px-3 py-1 rounded-full border border-white/5">Today</span>
        </div>
        {messages.map((msg, i) => {
            const isMe = msg.sender === "me";
            const isLast = i === messages.length - 1 || messages[i + 1].sender !== msg.sender;
            return (
                <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    isMe={isMe} 
                    isLast={isLast}
                />
            );
        })}
      </div>

      {/* Composer */}
      <div className="p-4 bg-white/[0.02] border-t border-white/5 shrink-0 backdrop-blur-md">
        <Composer onSend={handleSend} />
      </div>
    </div>
  );
}
