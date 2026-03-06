"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ChatShell } from "@/components/chat/ChatShell";
import { ConversationList, Conversation } from "@/components/chat/ConversationList";
import { ChatView } from "@/components/chat/ChatView";

// Mock Conversations
const CONVERSATIONS: Conversation[] = [
  {
    id: "d1",
    user: { name: "Sarah K.", avatar: "/avatars/sarah.jpg", status: "online" },
    lastMessage: "I can do tomorrow afternoon around 2pm...",
    time: "10:07 AM",
    unread: 2,
    item: "iPhone 15 Pro Max"
  },
  {
    id: "d2",
    user: { name: "Mike T.", avatar: "/avatars/mike.jpg", status: "offline", lastSeen: "2 hours ago" },
    lastMessage: "Is this still available?",
    time: "Yesterday",
    unread: 0,
    item: "Herman Miller Aeron"
  },
  {
    id: "d3",
    user: { name: "Jessica W.", avatar: "/avatars/jessica.jpg", status: "online" },
    lastMessage: "Offer accepted!",
    time: "Mon",
    unread: 0,
    item: "Sony A7IV"
  },
  {
    id: "d4",
    user: { name: "Alex R.", avatar: "", status: "offline", lastSeen: "1 day ago" },
    lastMessage: "Can you ship to Italy?",
    time: "Sun",
    unread: 0,
    item: "MacBook Pro M3"
  },
  {
    id: "d5",
    user: { name: "David L.", avatar: "", status: "online" },
    lastMessage: "Thanks for the quick reply!",
    time: "Sun",
    unread: 0
  }
];

export default function InboxPage() {
  const [activeId, setActiveId] = useState<string | undefined>("d1");
  const activeConversation = CONVERSATIONS.find(c => c.id === activeId);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-2 md:px-4 py-4 md:py-6 max-w-[1600px] h-[calc(100vh-64px)] md:h-[calc(100vh-80px)]">
        <ChatShell className="h-full min-h-0">
            {/* Desktop Layout: Split View */}
            <div className="hidden md:flex h-full w-full">
                <ConversationList 
                    conversations={CONVERSATIONS} 
                    activeId={activeId} 
                    onSelect={setActiveId} 
                    className="h-full shrink-0"
                />
                <div className="flex-1 h-full min-w-0 bg-[#0b0b0c]/50 relative">
                    {/* Background Pattern or Image could go here */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none" />
                    
                    {activeConversation ? (
                        <ChatView 
                            key={activeConversation.id}
                            conversation={activeConversation} 
                            onBack={() => setActiveId(undefined)}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 select-none">
                            <div className="w-24 h-24 rounded-[32px] bg-zinc-900/50 flex items-center justify-center shadow-inner border border-white/5">
                                <span className="text-5xl opacity-50">💬</span>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-zinc-300">Your Messages</h3>
                                <p className="text-sm text-zinc-500 mt-1">Select a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Layout: Stacked View */}
            <div className="md:hidden h-full w-full">
                {activeId ? (
                    activeConversation && (
                        <ChatView 
                            key={activeConversation.id}
                            conversation={activeConversation} 
                            onBack={() => setActiveId(undefined)}
                        />
                    )
                ) : (
                    <ConversationList 
                        conversations={CONVERSATIONS} 
                        activeId={activeId} 
                        onSelect={setActiveId} 
                        className="w-full h-full border-r-0"
                    />
                )}
            </div>
        </ChatShell>
      </main>
    </div>
  );
}
