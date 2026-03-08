import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { toast } from '@/lib/notifications'

export interface ChatMessage {
  id: string
  content: string
  user: {
    id: string
    name: string
    isVerified?: boolean
    role?: string
  }
  createdAt: string
  reactions?: Record<string, string[]> // emoji -> array of usernames
  type?: 'text' | 'audio'
  audioUrl?: string
  status?: 'sent' | 'read'
}

interface UseRealtimeChatProps {
  roomName: string
  userId: string
  username: string
  isVerified?: boolean
  role?: string
  onMessage?: (messages: ChatMessage[], updatedMessage?: ChatMessage | ChatMessage[]) => void
  initialMessages?: ChatMessage[]
}

export function useRealtimeChat({ roomName, userId, username, isVerified, role = 'User', onMessage, initialMessages = [] }: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  const onMessageRef = useRef(onMessage)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    const channel = supabase.channel(roomName)

    channel
      .on('broadcast', { event: 'message' }, (payload) => {
        const newMessage = payload.payload as ChatMessage
        
        setMessages((prev) => {
            // Prevent duplicate messages
            if (prev.some(msg => msg.id === newMessage.id)) {
                return prev
            }



            // Show notification only for messages from others
            if (newMessage.user.id !== userId) {
                const displayName = newMessage.user.name;
                const displayRole = newMessage.user.role || (newMessage.user.isVerified ? 'Verified' : 'User');
                
                toast.info({
                    title: `${displayName} (${displayRole})`,
                    description: (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-zinc-300">{newMessage.content}</span>
                      </div>
                    )
                });
            }

            const next = [...prev, newMessage]
            onMessageRef.current?.(next)
            return next
        })
      })
      .on('broadcast', { event: 'reaction' }, (payload) => {
        const { messageId, emoji, user: reactor } = payload.payload as { messageId: string, emoji: string, user: string }
        setMessages((prev) => {
            let updatedMsg: ChatMessage | undefined
            const next = prev.map(msg => {
                if (msg.id === messageId) {
                    const currentReactions = msg.reactions || {}
                    const userList = currentReactions[emoji] || []
                    
                    // Toggle reaction
                    let newUserList
                    if (userList.includes(reactor)) {
                        newUserList = userList.filter(u => u !== reactor)
                    } else {
                        newUserList = [...userList, reactor]
                    }
                    
                    const newReactions = {
                        ...currentReactions,
                        [emoji]: newUserList
                    }
                    
                    // Remove empty reaction arrays
                    if (newUserList.length === 0) {
                        delete newReactions[emoji]
                    }
                    
                    const newMsg = { ...msg, reactions: newReactions }
                    updatedMsg = newMsg
                    return newMsg
                }
                return msg
            })
            if (updatedMsg) onMessageRef.current?.(next, updatedMsg)
            return next
        })
      })
      .on('broadcast', { event: 'read-receipt' }, (payload) => {
          const { messageIds } = payload.payload as { messageIds: string[] }
          setMessages((prev) => {
              let hasUpdates = false
              const next = prev.map(msg => {
                  if (messageIds.includes(msg.id) && msg.status !== 'read') {
                      hasUpdates = true
                      return { ...msg, status: 'read' as const }
                  }
                  return msg
              })
              if (hasUpdates) {
                  onMessageRef.current?.(next)
                  return next
              }
              return prev
          })
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomName, supabase, userId])

  const sendMessage = async (content: string, type: 'text' | 'audio' = 'text', audioUrl?: string) => {
    if (!channelRef.current) return

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      type,
      audioUrl,
      user: { 
          id: userId,
          name: username,
          isVerified: isVerified,
          role: role
      },
      createdAt: new Date().toISOString(),
      reactions: {},
      status: 'sent'
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

  const sendReaction = async (messageId: string, emoji: string) => {
    if (!channelRef.current) return

    // Optimistic update
    setMessages((prev) => {
        let updatedMsg: ChatMessage | undefined
        const next = prev.map(msg => {
            if (msg.id === messageId) {
                const currentReactions = msg.reactions || {}
                const userList = currentReactions[emoji] || []
                
                // Toggle reaction
                let newUserList
                if (userList.includes(username)) {
                    newUserList = userList.filter(u => u !== username)
                } else {
                    newUserList = [...userList, username]
                }
                
                const newReactions = {
                    ...currentReactions,
                    [emoji]: newUserList
                }
                
                if (newUserList.length === 0) {
                    delete newReactions[emoji]
                }
                
                const newMsg = { ...msg, reactions: newReactions }
                updatedMsg = newMsg
                return newMsg
            }
            return msg
        })
        if (updatedMsg) onMessage?.(next, updatedMsg)
        return next
    })

    await channelRef.current.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { messageId, emoji, user: username }
    })
  }

  const markAsRead = async (messageIds: string[]) => {
    if (!channelRef.current || messageIds.length === 0) return

    setMessages((prev) => {
        let updatedMessages: ChatMessage[] = []
        const next = prev.map(msg => {
            if (messageIds.includes(msg.id) && msg.status !== 'read') {
                const newMsg = { ...msg, status: 'read' as const }
                updatedMessages.push(newMsg)
                return newMsg
            }
            return msg
        })
        if (updatedMessages.length > 0) {
             onMessageRef.current?.(next, updatedMessages)
             return next
        }
        return prev
    })

    await channelRef.current.send({
        type: 'broadcast',
        event: 'read-receipt',
        payload: { messageIds }
    })
  }

  return { messages, sendMessage, sendReaction, markAsRead }
}
