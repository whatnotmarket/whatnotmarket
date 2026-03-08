"use client"

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRealtimeChat, type ChatMessage } from '@/hooks/use-realtime-chat'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { ChatMessageItem } from './chat-message'
import { toast } from 'sonner'

interface RealtimeChatProps {
  roomName: string
  username: string
  isVerified?: boolean
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
}

const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9]+\.[a-zA-Z]{2,}\/)/i;

export function RealtimeChat({ roomName, username, isVerified, onMessage, messages: initialMessages }: RealtimeChatProps) {
  const [inputValue, setInputValue] = useState('')
  const { messages, sendMessage } = useRealtimeChat({
    roomName,
    username,
    isVerified,
    onMessage,
    initialMessages,
  })
  const scrollRef = useChatScroll(messages)

  const handleSend = async () => {
    if (!inputValue.trim()) return

    if (URL_REGEX.test(inputValue)) {
      toast.error("Sharing links is not allowed in chat.");
      return;
    }

    await sendMessage(inputValue)
    setInputValue('')
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg, i) => {
          const isOwnMessage = msg.user.name === username
          const showHeader = i === 0 || messages[i - 1].user.name !== msg.user.name
          return (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              isOwnMessage={isOwnMessage}
              showHeader={showHeader}
            />
          )
        })}
        {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No messages yet. Start the conversation!
            </div>
        )}
      </div>
      <div className="p-4 border-t bg-muted/30 flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button onClick={handleSend} size="icon" disabled={!inputValue.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
