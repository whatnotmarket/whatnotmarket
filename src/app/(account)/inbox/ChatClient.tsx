"use client";

import { Navbar } from "@/components/app/navigation/Navbar";
import { RealtimeChat } from "@/components/features/realtime-chat/realtime-chat";
import { Avatar,AvatarFallback,AvatarImage } from "@/components/shared/ui/avatar";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/core/utils/utils";
import { createClient } from "@/lib/infra/supabase/supabase";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { useParams,useRouter } from "next/navigation";
import { useCallback,useEffect,useMemo,useState } from "react";

import { Button } from "@/components/shared/ui/button";
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogTrigger } from "@/components/shared/ui/dialog";
import { Input } from "@/components/shared/ui/input";
import { CopyMap } from "@/lib/app/content/copy-system";
import { MessageSquarePlus,Search } from "lucide-react";

type ChatListEntry = {
  userId: string;
  lastMessage: string;
  lastMessageType: string;
  lastMessageTime: string;
  unreadCount: number;
};

export function ChatClient({ copy }: { copy: CopyMap }) {
  const params = useParams();
  const rawUserId = params.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<{
    id: string;
    name: string;
    image?: string | null;
    handle?: string | null;
  } | null>(null);
  const { user, isLoading, role: appRole, isFounder } = useUser();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [recentChats, setRecentChats] = useState<{ 
    userId: string, 
    name: string, 
    avatarUrl: string | null,
    lastMessage: string,
    lastMessageType: string, 
    lastMessageTime: string,
    unreadCount: number,
    deal?: {
      id: string,
      status: string,
      price: number,
      currency?: string,
      lastEvent?: string
    }
  }[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  const sidebarCopy = copy['sidebar'] || {};
  const chatCopy = copy['chat'] || {};

  // Resolve rawUserId (UUID or Wallet) to targetUserId (UUID)
  useEffect(() => {
    async function resolveUser() {
        if (!rawUserId) {
            setTargetUserId(null);
            return;
        }
        
        // If it looks like a UUID, use it directly
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(rawUserId)) {
            setTargetUserId(rawUserId);
            return;
        }

        // Security hardening: do not resolve direct chats by wallet/payout address.
        setTargetUserId(null);
    }
    resolveUser();
  }, [rawUserId, supabase]);

  useEffect(() => {
    async function loadTargetUser() {
      if (!targetUserId) {
        setTargetUser(null);
        return;
      }

      const existingChat = recentChats.find((chat) => chat.userId === targetUserId);
      if (existingChat) {
        setTargetUser({
          id: existingChat.userId,
          name: existingChat.name,
          image: existingChat.avatarUrl,
          handle: null,
        });
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .eq("id", targetUserId)
        .maybeSingle();

      if (error || !profile) {
        setTargetUser({
          id: targetUserId,
          name: "Unknown User",
        });
        return;
      }

      setTargetUser({
        id: profile.id,
        name: profile.full_name || profile.username || "Unknown User",
        image: profile.avatar_url,
        handle: profile.username,
      });
    }

    loadTargetUser();
  }, [targetUserId, recentChats, supabase]);

  // Fetch recent chats
  const fetchRecentChats = useCallback(async () => {
    if (!user) return;
    setLoadingChats(true);
    
    try {
      // Get all unique users we've chatted with
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          receiver_id,
          is_read,
          type
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by user
      const chatsMap = new Map<string, ChatListEntry>();
      
      messages?.forEach(msg => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!chatsMap.has(otherUserId)) {
          chatsMap.set(otherUserId, {
            userId: otherUserId,
            lastMessage: msg.content,
            lastMessageType: msg.type || 'text',
            lastMessageTime: msg.created_at,
            unreadCount: 0
          });
        }
        
        // Count unread from others
        if (msg.receiver_id === user.id && !msg.is_read) {
          const chat = chatsMap.get(otherUserId);
          if (chat) {
            chat.unreadCount++;
          }
        }
      });

      // Fetch profiles for these users
      const userIds = Array.from(chatsMap.keys());
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds);

        // Fetch active deals
        const { data: deals } = await supabase
          .from('deals')
          .select('id, status, price, buyer_id, seller_id')
          .or(`buyer_id.in.(${userIds.join(',')}),seller_id.in.(${userIds.join(',')})`)
          .eq('status', 'active'); // Only active deals

        const finalChats = userIds.flatMap(id => {
          const chat = chatsMap.get(id);
          if (!chat) {
            return [];
          }

          const profile = profiles?.find(p => p.id === id);
          const deal = deals?.find(d => (d.buyer_id === id && d.seller_id === user.id) || (d.seller_id === id && d.buyer_id === user.id));
          
          return [{
            ...chat,
            name: profile?.full_name || profile?.username || "Unknown User",
            avatarUrl: profile?.avatar_url,
            deal: deal ? {
              id: deal.id,
              status: deal.status,
              price: deal.price
            } : undefined
          }];
        });

        setRecentChats(finalChats);
      } else {
        setRecentChats([]);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoadingChats(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchRecentChats();
    
    // Subscribe to new messages to update list
    const channel = supabase
      .channel('chat_list_updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${user?.id}`
      }, () => {
        fetchRecentChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecentChats, user, supabase]);

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/auth?next=/inbox");
    return null;
  }

  const roomName = targetUserId ? [user.id, targetUserId].sort().join("_") : null;
  const username =
    user.user_metadata?.username || user.user_metadata?.full_name || user.email || user.id;
  const isVerified = isFounder || appRole === "seller";
  const role = isFounder ? "Admin" : appRole === "seller" ? "Seller" : "Buyer";

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Navbar /> {/* This might need adjustment as Navbar is usually at top, but layout might differ for chat app */}
      {/* Actually, Chat page usually has its own layout or hides standard Navbar. 
          Assuming standard layout for now, but often chat is full screen. 
          Let's adjust: typically chat page shouldn't have top navbar if it's a dashboard-like view, 
          or it should be integrated. Based on current file structure, it seems standalone.
      */}
      
      <div className="flex w-full h-full pt-14"> {/* pt-14 to account for fixed Navbar */}
        {/* Sidebar */}
        <div className={cn(
          "w-full md:w-80 border-r border-white/10 flex flex-col bg-[#1C1C1E]",
          targetUserId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h1 className="font-bold text-xl">{sidebarCopy.title || "Messages"}</h1>
            {/* New Chat Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-white/10">
                  <MessageSquarePlus className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1C1C1E] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    placeholder="Search users..." 
                    className="bg-black/50 border-white/10"
                    // Implement user search here if needed
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <Input 
                placeholder={sidebarCopy.search_placeholder || "Search messages..."}
                className="pl-9 bg-black/20 border-white/5 focus:border-white/20 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingChats ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
              </div>
            ) : recentChats.length === 0 ? (
              <div className="text-center p-8 text-zinc-500 text-sm">
                {sidebarCopy.empty || "No conversations yet."}
              </div>
            ) : (
              <div className="space-y-1">
                {recentChats.map(chat => (
                  <div
                    key={chat.userId}
                    onClick={() => router.push(`/inbox/${chat.userId}`)}
                    className={cn(
                      "p-3 mx-2 rounded-xl cursor-pointer transition-colors flex gap-3 items-start",
                      targetUserId === chat.userId ? "bg-white/10" : "hover:bg-white/5"
                    )}
                  >
                    <div className="relative">
                        <Avatar>
                        <AvatarImage src={chat.avatarUrl || undefined} alt={chat.name} />
                        <AvatarFallback>{chat.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {chat.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                                {chat.unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-bold text-sm truncate">{chat.name}</span>
                        <span className="text-[10px] text-zinc-500 whitespace-nowrap ml-2">
                          {formatDistanceToNow(new Date(chat.lastMessageTime), { addSuffix: false })}
                        </span>
                      </div>
                      <p className={cn(
                          "text-xs truncate",
                          chat.unreadCount > 0 ? "text-white font-medium" : "text-zinc-400"
                      )}>
                        {chat.lastMessageType === 'image' ? 'ðŸ“· Image' : 
                         chat.lastMessageType === 'deal_update' ? 'âš¡ Deal Update' : 
                         chat.lastMessage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-black",
          !targetUserId ? "hidden md:flex" : "flex"
        )}>
          {targetUserId && roomName ? (
            <RealtimeChat 
              roomName={roomName}
              userId={user.id}
              username={username}
              isVerified={isVerified}
              role={role}
              targetUser={targetUser || undefined}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <MessageSquarePlus className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-zinc-400">{chatCopy.placeholder_title || "Select a conversation"}</h3>
              <p className="text-sm">{chatCopy.placeholder_desc || "Choose a chat from the sidebar to start messaging."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


