import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
    isVerified?: boolean
  }
  createdAt: string
}

interface UseRealtimeChatProps {
  roomName: string
  username: string
  isVerified?: boolean
  onMessage?: (messages: ChatMessage[]) => void
  initialMessages?: ChatMessage[]
}

export function useRealtimeChat({ roomName, username, isVerified, onMessage, initialMessages = [] }: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    const channel = supabase.channel(roomName)

    channel
      .on('broadcast', { event: 'message' }, (payload) => {
        const newMessage = payload.payload as ChatMessage
        // Prevent duplicate messages if we receive our own broadcast
        if (newMessage.user.name !== username) {
            setMessages((prev) => {
                const next = [...prev, newMessage]
                onMessage?.(next)
                return next
            })
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomName, supabase, username, onMessage])

  const sendMessage = async (content: string) => {
    if (!channelRef.current) return

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      user: { 
          name: username,
          isVerified: isVerified
      },
      createdAt: new Date().toISOString(),
    }

    // Optimistic update
    setMessages((prev) => {
        const next = [...prev, newMessage]
        onMessage?.(next)
        return next
    })

    await channelRef.current.send({
      type: 'broadcast',
      event: 'message',
      payload: newMessage,
    })
  }

  return { messages, sendMessage }
}
