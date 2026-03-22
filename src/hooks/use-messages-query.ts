import { useEffect, useState } from 'react'
import { createClient } from '@/lib/infra/supabase/supabase'
import { ChatMessage } from '@/hooks/use-realtime-chat'

export function useMessagesQuery(roomName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchMessages() {
      if (!roomName) return

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          type,
          metadata,
          is_read,
          is_deleted,
          sender:profiles(id, full_name, username, role_preference, seller_status, is_admin)
        `)
        .eq('room_id', roomName)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages from DB:', error)
        return
      }

      if (data) {
        const mappedMessages: ChatMessage[] = data.map((msg: any) => {
          // Construct user object from profile join or metadata snapshot
          const profile = msg.sender
          const snapshot = msg.metadata?.user_snapshot
          
          const user = {
            id: msg.sender_id,
            name: profile?.full_name || profile?.username || snapshot?.name || 'Unknown User',
            isVerified: profile?.is_admin || profile?.seller_status === 'verified' || snapshot?.isVerified,
            role: profile?.is_admin ? 'Admin' : (profile?.seller_status === 'verified' ? 'Seller' : (snapshot?.role || 'User'))
          }

          return {
            id: msg.id,
            content: msg.content,
            user,
            createdAt: msg.created_at,
            reactions: msg.metadata?.reactions || {},
            type: msg.type as 'text' | 'audio',
            audioUrl: msg.metadata?.audioUrl,
            status: msg.is_read ? 'read' : (msg.metadata?.status || 'sent')
          }
        })
        
        setMessages(mappedMessages)
      }
    }

    fetchMessages()
  }, [roomName])

  return { data: messages }
}

