"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { useState } from "react";

export interface Conversation {
  id: string;
  user: {
    name: string;
    avatar: string;
    status: "online" | "offline";
    lastSeen?: string;
  };
  lastMessage: string;
  time: string;
  unread: number;
  item?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function ConversationList({ conversations, activeId, onSelect, className }: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter(c => 
    c.user.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("flex flex-col w-full md:w-[320px] lg:w-[380px] border-r border-white/5 bg-zinc-900/30 backdrop-blur-md", className)}>
      <div className="p-4 border-b border-white/5 space-y-4 shrink-0">
        <h2 className="text-xl font-bold px-2 text-white/90">Messages</h2>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            placeholder="Search messages..." 
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
        {filtered.map((conv) => (
          <ConversationRow 
            key={conv.id} 
            conversation={conv} 
            isActive={activeId === conv.id} 
            onClick={() => onSelect(conv.id)} 
          />
        ))}
      </div>
    </div>
  );
}

function ConversationRow({ conversation, isActive, onClick }: { conversation: Conversation; isActive: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative p-3 rounded-2xl transition-all cursor-pointer select-none border border-transparent",
        isActive 
            ? "bg-indigo-600/20 border-indigo-500/20 shadow-lg shadow-indigo-500/5" 
            : "hover:bg-white/5 hover:border-white/5"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg transition-transform group-hover:scale-105",
            isActive ? "bg-indigo-600 text-white" : "bg-gradient-to-br from-zinc-700 to-zinc-600 text-zinc-300"
          )}>
            <span className="uppercase">{conversation.user.name[0]}</span>
          </div>
          {conversation.user.status === "online" && (
            <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-[3px] border-[#18181b] shadow-sm" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex justify-between items-baseline mb-0.5">
            <h3 className={cn("font-semibold truncate text-[15px]", isActive ? "text-white" : "text-zinc-200")}>
                {conversation.user.name}
            </h3>
            <span className={cn("text-xs font-medium shrink-0 ml-2 transition-colors", 
                conversation.unread > 0 ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-400"
            )}>
              {conversation.time}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <p className={cn("text-sm truncate pr-2 transition-colors", 
                isActive ? "text-indigo-200/80" : (conversation.unread > 0 ? "text-white font-medium" : "text-zinc-400 group-hover:text-zinc-300")
            )}>
              {conversation.item && (
                <span className={cn(
                    "mr-1.5 font-medium text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider",
                    isActive ? "bg-indigo-400/20 text-indigo-200" : "bg-zinc-800 text-zinc-400"
                )}>
                    Item
                </span>
              )}
              {conversation.lastMessage}
            </p>
            {conversation.unread > 0 && (
              <div className="h-5 min-w-[20px] px-1.5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0 animate-in zoom-in duration-200">
                {conversation.unread}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
