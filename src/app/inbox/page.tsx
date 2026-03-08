"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { RealtimeChat } from "@/components/realtime-chat/realtime-chat";
import { useUser } from "@/contexts/UserContext";
import { useMessagesQuery } from "@/hooks/use-messages-query";
import { storeMessages } from "@/lib/store-messages";
import { Navbar } from "@/components/Navbar";
import { Loader2 } from "lucide-react";
import { ChatMessage } from "@/hooks/use-realtime-chat";
import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const { user, isLoading } = useUser();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [recentChats, setRecentChats] = useState<{ userId: string, name: string }[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  useEffect(() => {
    async function fetchRecentChats() {
      if (!user) return;
      setLoadingChats(true);
      try {
        // List folders in chat-messages bucket
        // Note: Supabase Storage list at root might return folders as items
        const { data, error } = await supabase.storage.from('chat-messages').list();
        
        if (error) {
          console.error('Error listing chats:', error);
          setLoadingChats(false);
          return;
        }

        if (data) {
          // Filter folders that contain current user ID
          // Folder name format: uuid1_uuid2
          const myRooms = data.filter(item => item.name.includes(user.id));
          
          const userIds = new Set<string>();
          myRooms.forEach(room => {
             const parts = room.name.split('_');
             const otherId = parts.find(id => id !== user.id);
             if (otherId) userIds.add(otherId);
          });
          
          if (userIds.size > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, username, email')
                .in('id', Array.from(userIds));
                
              if (profiles) {
                  setRecentChats(profiles.map(p => ({
                      userId: p.id,
                      name: p.full_name || p.username || p.email || 'User'
                  })));
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
              Please log in to chat.
          </div>
      )
  }

  const roomId = targetUserId ? [user.id, targetUserId].sort().join('_') : null;
  
  return (
      <div className="min-h-screen bg-black text-white flex flex-col">
          <Navbar />
          <div className="flex-1 container mx-auto p-4 h-[calc(100vh-80px)] flex gap-4">
             {/* Sidebar List */}
             <div className={cn(
                 "w-full md:w-1/4 border-r border-white/10 pr-4 flex flex-col gap-2",
                 targetUserId ? "hidden md:flex" : "flex"
             )}>
                 <h2 className="text-xl font-bold mb-4">Recent Chats</h2>
                 {loadingChats ? (
                     <div className="text-zinc-500 text-sm">Loading...</div>
                 ) : recentChats.length === 0 ? (
                     <div className="text-zinc-500 text-sm">No recent chats found.</div>
                 ) : (
                     recentChats.map(chat => (
                         <div 
                            key={chat.userId}
                            onClick={() => router.push(`/inbox?userId=${chat.userId}`)}
                            className={cn(
                                "p-3 rounded-lg cursor-pointer transition-colors",
                                targetUserId === chat.userId 
                                    ? "bg-white/10 text-white" 
                                    : "hover:bg-white/5 text-zinc-300"
                            )}
                         >
                             <div className="font-medium">{chat.name}</div>
                         </div>
                     ))
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
                         <p>Select a chat from the sidebar</p>
                         <p className="text-sm mt-2">or find a user profile to start a new conversation.</p>
                     </div>
                 )}
             </div>
          </div>
      </div>
  )
}

import { Squircle } from "@/components/ui/Squircle";

function ChatContainer({ roomId, currentUser, targetUserId }: { roomId: string, currentUser: any, targetUserId: string }) {
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
                    name: data.full_name || data.username || 'User',
                    image: data.avatar_url,
                    handle: data.username
                });
            }
        }
        loadProfile();
    }, [targetUserId, supabase]);
    
    const handleMessage = useCallback((msgs: ChatMessage[], updatedMessage?: ChatMessage | ChatMessage[]) => {
        storeMessages(msgs, roomId, updatedMessage);
    }, [roomId]);

    const username = currentUser.user_metadata?.full_name || currentUser.email || currentUser.id;
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
                onMessage={handleMessage} 
                targetUser={targetProfile || undefined}
            />
        </Squircle>
    )
}
