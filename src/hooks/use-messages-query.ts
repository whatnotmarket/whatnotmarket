import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ChatMessage } from '@/hooks/use-realtime-chat'

export function useMessagesQuery(roomName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchMessages() {
      if (!roomName) return

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomName)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }

      if (data) {
        const mappedMessages: ChatMessage[] = data.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          user: { name: msg.user_name },
          createdAt: msg.created_at
        }))
        setMessages(mappedMessages)
      }
    }

    fetchMessages()
  }, [roomName])

  return { data: messages }
}
