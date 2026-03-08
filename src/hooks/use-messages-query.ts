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
        .storage
        .from('chat-messages')
        .list(roomName, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        })

      if (error) {
        console.error('Error fetching messages from storage:', error)
        return
      }

      if (data) {
        // Fetch content for each message
        const messagesPromises = data.map(async (file) => {
          if (!file.name.endsWith('.json')) return null

          const { data: content, error: downloadError } = await supabase
            .storage
            .from('chat-messages')
            .download(`${roomName}/${file.name}`)

          if (downloadError || !content) {
             console.error('Error downloading message:', file.name, downloadError)
             return null
          }

          try {
             const text = await content.text()
             return JSON.parse(text) as ChatMessage
          } catch (e) {
             console.error('Error parsing message:', file.name, e)
             return null
          }
        })

        const resolved = await Promise.all(messagesPromises)
        const validMessages = resolved.filter((m): m is ChatMessage => m !== null)
        
        // Sort by createdAt just in case filename sort wasn't enough (though timestamp prefix helps)
        validMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        
        setMessages(validMessages)
      }
    }

    fetchMessages()
  }, [roomName])

  return { data: messages }
}
