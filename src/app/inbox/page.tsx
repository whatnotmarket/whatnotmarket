"use client";

import { useSearchParams } from "next/navigation";
import { RealtimeChat } from "@/components/realtime-chat/realtime-chat";
import { useUser } from "@/contexts/UserContext";
import { useMessagesQuery } from "@/hooks/use-messages-query";
import { storeMessages } from "@/lib/store-messages";
import { Navbar } from "@/components/Navbar";
import { Loader2 } from "lucide-react";
import { ChatMessage } from "@/hooks/use-realtime-chat";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const { user, isLoading } = useUser();


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

  if (!targetUserId) {
      return (
          <div className="min-h-screen bg-black text-white flex flex-col">
              <Navbar />
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                  Select a user profile to start chatting.
              </div>
          </div>
      )
  }

  const roomId = [user.id, targetUserId].sort().join('_');
  
  return (
      <div className="min-h-screen bg-black text-white flex flex-col">
          <Navbar />
          <div className="flex-1 container mx-auto p-4 h-[calc(100vh-80px)]">
             <ChatContainer roomId={roomId} currentUser={user} />
          </div>
      </div>
  )
}

function ChatContainer({ roomId, currentUser }: { roomId: string, currentUser: any }) {
    const { data: messages } = useMessagesQuery(roomId);
    
    const handleMessage = (msgs: ChatMessage[]) => {
        storeMessages(msgs, roomId);
    }

    const username = currentUser.user_metadata?.full_name || currentUser.email || currentUser.id;
    // Check if user is verified (admin or seller verified)
    const isVerified = currentUser.user_metadata?.is_admin === true || currentUser.user_metadata?.seller_status === 'verified';

    return (
        <RealtimeChat 
            roomName={roomId} 
            username={username} 
            isVerified={isVerified}
            messages={messages} 
            onMessage={handleMessage} 
        />
    )
}
