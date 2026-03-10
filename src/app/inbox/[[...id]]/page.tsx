"use client";

import { useParams, useRouter } from "next/navigation";
import { RealtimeChat } from "@/components/realtime-chat/realtime-chat";
import { useUser } from "@/contexts/UserContext";
import { useMessagesQuery } from "@/hooks/use-messages-query";
import { Navbar } from "@/components/Navbar";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, MessageSquarePlus, X } from "lucide-react";
import { toast } from "@/lib/notifications";

type FoundUser = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type ChatMessageRecord = {
  room_id: string;
  content: string;
  created_at: string;
  sender_id: string;
  is_read: boolean;
  receiver_id?: string;
  type?: string;
  is_deleted?: boolean;
};

type CurrentUser = {
  id: string;
  email?: string | null;
  user_metadata?: {
    username?: string | null;
    full_name?: string | null;
    is_admin?: boolean;
    seller_status?: string | null;
  };
};

export default function ChatPage() {
  const params = useParams();
  // Get raw ID from URL path (e.g. /inbox/123 or /inbox/wallet)
  // If params.id is undefined, it means we are at /inbox root
  const rawUserId = params.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const { user, isLoading } = useUser();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [recentChats, setRecentChats] = useState<{ 
    userId: string, 
    name: string, 
    avatarUrl: string | null,
    lastMessage: string,
    lastMessageType: string, // Added to distinguish system messages
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


  // New Chat Modal & Search Logic
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [foundUsers, setFoundUsers] = useState<FoundUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const handleSearchUsers = async (query: string) => {
      setSearchUserQuery(query);
      if (query.length < 2) {
          setFoundUsers([]);
          return;
      }
      
      setSearchingUsers(true);
      try {
        const { data } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
            .neq('id', user?.id) // Exclude self
            .limit(5);
            
        if (data) {
            setFoundUsers(data);
        }
      } catch (e) {
          console.error(e);
      } finally {
          setSearchingUsers(false);
      }
  };


  // Realtime subscription for updates
  useEffect(() => {
    if (!user) return;

    // Listen to changes in chat_messages table
    const channel = supabase
      .channel('inbox-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE)
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          console.log('Inbox Realtime Event:', payload);
          const newMessage = payload.new as ChatMessageRecord;
          const oldMessage = payload.old as ChatMessageRecord;
          const roomId = newMessage?.room_id || oldMessage?.room_id;
          
          if (!roomId || typeof roomId !== 'string') return;

          // Determine the other user ID from room ID
          const parts = roomId.split('_');
          const otherUserId = parts.find((id: string) => id !== user.id);
          const isMyRoom = parts.includes(user.id);
          
          if (!otherUserId || !isMyRoom) return;

          // Handle message deletion (soft delete)
          if (payload.eventType === 'UPDATE' && newMessage.is_deleted) {
              setRecentChats(prev => prev.filter(c => c.userId !== otherUserId));
              return;
          }

           // Show notification if it's an incoming message and we are NOT in this chat currently
           const isIncoming = newMessage?.sender_id !== user.id;
           const isCurrentChat = targetUserId === otherUserId;
           
           if (isIncoming && !isCurrentChat && payload.eventType === 'INSERT') {
               let senderName = 'Qualcuno';
               const { data: profile } = await supabase.from('profiles').select('full_name, username').eq('id', otherUserId).single();
               if (profile) senderName = profile.full_name || profile.username || 'Utente';

               toast.info({
                   title: senderName,
                   description: (
                     <div className="flex flex-col gap-1">
                       <span className="text-sm text-zinc-300 truncate max-w-[200px]">{newMessage.content}</span>
                     </div>
                   ),
                   action: {
                       label: 'Vedi',
                       onClick: () => router.push(`/inbox/${otherUserId}`)
                   }
               });
           }
 
           // Update list
           setRecentChats(prev => {
             const existingChatIndex = prev.findIndex(c => c.userId === otherUserId);
             
             if (existingChatIndex >= 0) {
               // Update existing chat
               const updatedChats = [...prev];
               const existingTime = new Date(updatedChats[existingChatIndex].lastMessageTime).getTime();
               const newTime = new Date(newMessage.created_at).getTime();
               
               if (newTime >= existingTime) {
                   updatedChats[existingChatIndex] = {
                     ...updatedChats[existingChatIndex],
                     lastMessage: newMessage.content,
                     lastMessageTime: newMessage.created_at,
                     // Increment unread count if it's incoming and we're not viewing it
                     unreadCount: (isIncoming && !isCurrentChat && payload.eventType === 'INSERT') 
                        ? updatedChats[existingChatIndex].unreadCount + 1 
                        : (payload.eventType === 'UPDATE' && newMessage.is_read) 
                            ? 0 
                            : updatedChats[existingChatIndex].unreadCount
                   };
                   // Move to top
                   updatedChats.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
                   return updatedChats;
               }
               return prev;
             }
             return prev;
           });

          // Check if it's a new chat (using functional state to avoid dependency)
          if (payload.eventType === 'INSERT') {
              setRecentChats(prev => {
                 const isInList = prev.some(c => c.userId === otherUserId);
                 if (!isInList) {
                    fetchProfileAndAdd(otherUserId, newMessage);
                 }
                 return prev;
              });
          }
        }
      )
      .subscribe();

    async function fetchProfileAndAdd(userId: string, message: ChatMessageRecord) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .eq('id', userId)
            .single();
            
        if (profile) {
            setRecentChats(prev => {
                if (prev.some(c => c.userId === userId)) return prev;
                
                const newChat = {
                    userId: profile.id,
                    name: profile.full_name || profile.username || 'Utente',
                    avatarUrl: profile.avatar_url,
                    lastMessage: message.content,
                    lastMessageType: message.type || 'text',
                    lastMessageTime: message.created_at,
                    unreadCount: message.sender_id !== user?.id ? 1 : 0
                };
                return [newChat, ...prev];
            });
        }
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, targetUserId]); // Added targetUserId to handle unread count updates correctly

  useEffect(() => {
    async function fetchRecentChats() {
      if (!user) return;
      setLoadingChats(true);
      try {
        // Fetch recent messages from DB to identify rooms and calculate unread counts
        const { data, error } = await supabase
          .from('chat_messages')
          .select('room_id, created_at, content, is_read, sender_id, type, is_deleted')
          .ilike('room_id', `%${user.id}%`)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error listing chats:', error);
          setLoadingChats(false);
          return;
        }

        if (data) {
          const userIds = new Set<string>();
          const roomStats = new Map<string, { lastMessage: string, lastMessageType: string, lastTime: string, unreadCount: number }>();

          data.forEach(msg => {
             const parts = msg.room_id.split('_');
             const otherId = parts.find((id: string) => id !== user.id);
             if (!otherId) return;
             
             userIds.add(otherId);

             if (!roomStats.has(msg.room_id)) {
                roomStats.set(msg.room_id, { 
                  lastMessage: msg.content, 
                  lastMessageType: msg.type || 'text',
                  lastTime: msg.created_at,
                  unreadCount: 0 
                });
             }

             // Count unread if it's incoming and not read
             if (msg.sender_id !== user.id && !msg.is_read) {
                const stats = roomStats.get(msg.room_id)!;
                stats.unreadCount++;
             }
          });
          
          if (userIds.size > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url')
                .in('id', Array.from(userIds));

              // Fetch related deals
              const { data: deals } = await supabase
                .from('deals')
                .select(`
                  id, 
                  status, 
                  buyer_id, 
                  seller_id,
                  offers!inner(price)
                `)
                .or(`buyer_id.in.(${Array.from(userIds).map(id => `'${id}'`).join(',')}),seller_id.in.(${Array.from(userIds).map(id => `'${id}'`).join(',')})`)
                .order('created_at', { ascending: false });
                
              if (profiles) {
                  const chats = profiles.map(p => {
                      const roomId = [user.id, p.id].sort().join('_');
                      const stats = roomStats.get(roomId);
                      
                      const userDeal = deals?.find(d => 
                        (d.buyer_id === p.id && d.seller_id === user.id) || 
                        (d.seller_id === p.id && d.buyer_id === user.id)
                      );
                      
                      const offersData = (userDeal?.offers ?? null) as
                        | { price: number }
                        | Array<{ price: number }>
                        | null;
                      const dealPrice = Array.isArray(offersData)
                        ? (offersData[0]?.price ?? 0)
                        : (offersData?.price ?? 0);

                      return {
                          userId: p.id,
                          name: p.full_name || p.username || 'Utente',
                          avatarUrl: p.avatar_url,
                          lastMessage: stats?.lastMessage || '',
                          lastMessageType: stats?.lastMessageType || 'text',
                          lastMessageTime: stats?.lastTime || '',
                          unreadCount: stats?.unreadCount || 0,
                          deal: userDeal ? {
                            id: userDeal.id,
                            status: userDeal.status,
                            price: dealPrice,
                            currency: 'USDC'
                          } : undefined
                      };
                  });
                  
                  chats.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
                  setRecentChats(chats);
              }
          }
        }
      } catch (e) {
        console.error('Failed to fetch recent chats:', e);
      } finally {
        setLoadingChats(false);
      }
    }
    
    fetchRecentChats();
  }, [user, supabase]);

  useEffect(() => {
    if (targetUserId) {
      setRecentChats(prev => prev.map(chat => 
        chat.userId === targetUserId ? { ...chat, unreadCount: 0 } : chat
      ));
    }
  }, [targetUserId]);

  // Reset search when modal is toggled
  useEffect(() => {
      if (!isNewChatOpen) {
          setSearchUserQuery("");
          setFoundUsers([]);
          setSearchingUsers(false);
      }
  }, [isNewChatOpen]);

  const groupedChats = useMemo(() => {
    const groups = {
      active: [] as typeof recentChats,
      completed: [] as typeof recentChats,
      cancelled: [] as typeof recentChats,
      other: [] as typeof recentChats
    };

    const filtered = searchQuery 
        ? recentChats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : recentChats;

    filtered.forEach(chat => {
      const status = chat.deal?.status;
      // Active: anything that is not completed or cancelled
      if (!status || !['completed', 'cancelled', 'offer_rejected'].includes(status)) {
        groups.active.push(chat);
      } else if (status === 'completed') {
        groups.completed.push(chat);
      } else if (status === 'cancelled' || status === 'offer_rejected') {
        groups.cancelled.push(chat);
      } else {
        groups.other.push(chat);
      }
    });

    return groups;
  }, [recentChats, searchQuery]);

  if (isLoading) {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    )
  }

  if (!user) {
      return (
          <div className="min-h-screen bg-black text-white flex items-center justify-center">
              Esegui il login per chattare.
          </div>
      )
  }

  const roomId = targetUserId ? [user.id, targetUserId].sort().join('_') : null;

  const renderChatItem = (chat: typeof recentChats[0]) => (
    <div 
       key={chat.userId}
      onClick={() => router.push(`/inbox/${chat.userId}`)} 
       className={cn(
           "p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 border border-transparent group",
           targetUserId === chat.userId 
               ? "bg-white/10 border-white/5 shadow-lg" 
               : "hover:bg-white/5"
       )}
    >
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12 border border-white/10 shadow-sm transition-transform group-hover:scale-105">
            <AvatarImage src={chat.avatarUrl || undefined} />
            <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">
              {chat.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {chat.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-black h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center border-2 border-black shadow-lg animate-in zoom-in duration-300">
              {chat.unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-baseline mb-1">
            <div className={cn("font-bold truncate text-sm tracking-tight", targetUserId === chat.userId ? "text-white" : "text-zinc-100")}>
              {chat.name}
            </div>
            {chat.lastMessageTime && (
              <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap ml-2">
                {formatDistanceToNow(new Date(chat.lastMessageTime), { addSuffix: true, locale: it })}
              </span>
            )}
          </div>

          {chat.deal ? (
            <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
              <span className="text-[11px] font-black text-emerald-400 shrink-0">
                {chat.deal.price} {chat.deal.currency}
              </span>
              <span className="text-zinc-700 shrink-0 text-[10px]">|</span>
              <span className={cn(
                "text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border shrink-0",
                chat.deal.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                chat.deal.status === 'cancelled' || chat.deal.status === 'offer_rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                "bg-blue-500/10 text-blue-500 border-blue-500/20"
              )}>
                {chat.deal.status === 'verification' ? 'Trattativa' : 
                 chat.deal.status === 'offer_sent' ? 'Offerta' :
                 chat.deal.status === 'offer_rejected' ? 'Rifiutata' :
                 chat.deal.status === 'shipped' ? 'Spedito' :
                 chat.deal.status}
              </span>
            </div>
          ) : (
             <div className="h-4" /> // Spacer for alignment
          )}
          
          <div className={cn(
            "text-xs truncate leading-relaxed flex items-center gap-1.5",
            chat.unreadCount > 0 ? "text-zinc-200 font-semibold" : "text-zinc-500",
            chat.lastMessageType === 'system' && "text-indigo-400 italic"
          )}>
            {chat.lastMessageType === 'system' && <span className="w-1 h-1 rounded-full bg-indigo-500" />}
            {chat.lastMessage || 'Nessun messaggio'}
          </div>
        </div>
    </div>
  );
  
  return (
      <div className="min-h-screen bg-black text-white flex flex-col">
          <Navbar />
          <div className="flex-1 container mx-auto p-4 h-[calc(100vh-80px)] flex gap-4">
             {/* Sidebar List */}
             <div className={cn(
                 "w-full md:w-1/3 lg:w-1/4 border-r border-white/5 pr-4 flex flex-col gap-4 overflow-y-auto no-scrollbar",
                 targetUserId ? "hidden md:flex" : "flex"
             )}>
                 <div className="flex flex-col gap-4 mb-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight">Messaggi</h2>
                        <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                                    <MessageSquarePlus className="h-5 w-5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Nuova chat</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col gap-4 mt-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                                        <Input 
                                            placeholder="Cerca username..." 
                                            className="pl-9 bg-zinc-900 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-offset-0 focus-visible:ring-white/20"
                                            value={searchUserQuery}
                                            onChange={(e) => handleSearchUsers(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                                        {searchingUsers ? (
                                            <div className="text-center py-4 text-zinc-500 text-sm">Cercando...</div>
                                        ) : foundUsers.length > 0 ? (
                                            foundUsers.map(u => (
                                                <button 
                                                    key={u.id}
                                                    onClick={() => {
                        router.push(`/inbox/${u.id}`);
                                                        setIsNewChatOpen(false);
                                                    }}
                                                    className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left"
                                                >
                                                    <Avatar className="h-10 w-10 border border-white/10">
                                                        <AvatarImage src={u.avatar_url || undefined} />
                                                        <AvatarFallback>{(u.full_name || u.username || '?').substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="font-medium truncate">{u.full_name || u.username}</div>
                                                        <div className="text-xs text-zinc-500 truncate">@{u.username}</div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : searchUserQuery.length > 1 ? (
                                            <div className="text-center py-4 text-zinc-500 text-sm">Nessun utente trovato</div>
                                        ) : (
                                            <div className="text-center py-4 text-zinc-500 text-sm">Cerca un utente per iniziare</div>
                                        )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    
                    {recentChats.length > 0 && (
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <Input 
                                placeholder="Cerca tra le chat..." 
                                className="pl-9 bg-zinc-900/50 border-white/5 text-white placeholder:text-zinc-500 focus-visible:ring-offset-0 focus-visible:ring-white/20 h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    )}
                 </div>

                 {loadingChats ? (
                     <div className="flex flex-col gap-3">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-16 w-full rounded-xl bg-white/5 animate-pulse" />
                        ))}
                     </div>
                 ) : recentChats.length === 0 ? (
                     <div className="flex flex-col items-center justify-center gap-4 py-10 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-zinc-500 text-sm text-center">Nessuna chat trovata.</p>
                        <Button 
                            variant="outline" 
                            className="bg-white/5 border-white/10 hover:bg-white/10 text-zinc-200"
                            onClick={() => setIsNewChatOpen(true)}
                        >
                            Nuova chat
                        </Button>
                     </div>
                 ) : (
                    <div className="flex flex-col gap-6">
                      {groupedChats.active.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 px-1">Attive</h3>
                          <div className="flex flex-col gap-1">
                            {groupedChats.active.map(renderChatItem)}
                          </div>
                        </div>
                      )}

                      {groupedChats.completed.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/70 px-1">Completate</h3>
                          <div className="flex flex-col gap-1 opacity-80 hover:opacity-100 transition-opacity">
                            {groupedChats.completed.map(renderChatItem)}
                          </div>
                        </div>
                      )}

                      {groupedChats.cancelled.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500/70 px-1">Annullate</h3>
                          <div className="flex flex-col gap-1 opacity-60 hover:opacity-100 transition-opacity">
                            {groupedChats.cancelled.map(renderChatItem)}
                          </div>
                        </div>
                      )}

                      {groupedChats.other.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 px-1">Altro</h3>
                          <div className="flex flex-col gap-1">
                            {groupedChats.other.map(renderChatItem)}
                          </div>
                        </div>
                      )}
                    </div>
                 )}
             </div>

             {/* Chat Area */}
             <div className={cn(
                 "flex-1 flex flex-col",
                 !targetUserId ? "hidden md:flex items-center justify-center text-zinc-500" : "flex"
             )}>
                 {targetUserId && roomId ? (
                     <ChatContainer roomId={roomId} currentUser={user} targetUserId={targetUserId} />
                 ) : (
                     <div className="text-center">
                         <p>Seleziona una chat dalla barra laterale</p>
                         <p className="text-sm mt-2">o trova il profilo di un utente per iniziare una nuova conversazione.</p>
                     </div>
                 )}
             </div>
          </div>
      </div>
  )
}

import { Squircle } from "@/components/ui/Squircle";

function ChatContainer({ roomId, currentUser, targetUserId }: { roomId: string, currentUser: CurrentUser, targetUserId: string }) {
    const { data: messages } = useMessagesQuery(roomId);
    const [targetProfile, setTargetProfile] = useState<{ id: string, name: string, image?: string, handle?: string } | null>(null);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        async function loadProfile() {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url')
                .eq('id', targetUserId)
                .single();
            
            if (data) {
                setTargetProfile({
                    id: data.id,
                    name: data.full_name || data.username || 'Utente',
                    image: data.avatar_url,
                    handle: data.username
                });
            }
        }
        loadProfile();
    }, [targetUserId, supabase]);
    
    const username = currentUser.user_metadata?.username || currentUser.user_metadata?.full_name || currentUser.email || currentUser.id;
    // Check if user is verified (admin or seller verified)
    const isVerified = currentUser.user_metadata?.is_admin === true || currentUser.user_metadata?.seller_status === 'verified';
    
    // Determine Role
    const role = currentUser.user_metadata?.is_admin === true ? 'Admin' : (currentUser.user_metadata?.seller_status === 'verified' ? 'Seller' : 'Buyer');

    return (
        <Squircle
            radius={32}
            smoothing={1}
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0.1)"
            className="flex-1 w-full h-full"
            innerClassName="bg-black/50 overflow-hidden flex flex-col"
        >
            <RealtimeChat 
                roomName={roomId} 
                userId={currentUser.id}
                username={username} 
                isVerified={isVerified}
                role={role}
                messages={messages} 
                targetUser={targetProfile || undefined}
            />
        </Squircle>
    )
}
