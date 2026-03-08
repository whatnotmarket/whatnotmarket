import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/use-realtime-chat'
import { CheckCircle2, Check, CheckCheck } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react'
import { useState } from 'react'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
  onReact?: (emoji: string) => void
  currentUsername?: string
}

export const ChatMessageItem = ({ message, isOwnMessage, showHeader, onReact, currentUsername }: ChatMessageItemProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleReactionClick = (emojiData: EmojiClickData) => {
      onReact?.(emojiData.emoji)
      setIsOpen(false)
  }

  // Only allow reactions on other people's messages
  const canReact = !isOwnMessage && !!onReact;

  // Calculate reactions display
  const reactions = Object.entries(message.reactions || {}).map(([emoji, users]) => ({
      emoji,
      count: users.length,
      hasReacted: currentUsername ? users.includes(currentUsername) : false
  }))

  const messageContent = (
    <div
      className={cn(
        'py-2 px-3 rounded-xl text-sm w-fit relative min-w-[60px] select-none',
        isOwnMessage 
          ? 'bg-white text-black' 
          : 'bg-[#101010] text-white border border-white/20'
      )}
    >
      <div className="flex items-end gap-2 flex-wrap justify-end">
        {message.type === 'audio' && message.audioUrl ? (
            <audio controls src={message.audioUrl} className="max-w-[200px]" />
        ) : (
            <span className="text-left break-words">{message.content}</span>
        )}
        <span className={cn("text-[10px] opacity-70 leading-none mb-0.5 whitespace-nowrap", isOwnMessage ? "text-black/60" : "text-white/60")}>
          {new Date(message.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
        </span>
        {isOwnMessage && (
            <span className="mb-0.5 ml-1">
                {message.status === 'read' ? (
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                ) : (
                    <Check className="w-3 h-3 text-zinc-400" />
                )}
            </span>
        )}
      </div>
    </div>
  )

  return (
    <div className={`flex mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={cn('max-w-[75%] w-fit flex flex-col gap-1', {
          'items-end': isOwnMessage,
        })}
      >
        {showHeader && (
          <div className={cn("text-xs px-1 font-medium text-foreground/70 mb-0.5 flex items-center gap-1", isOwnMessage && "justify-end")}>
            {message.user.name}
            {message.user.isVerified && (
               <CheckCircle2 className="w-3 h-3 text-blue-500 fill-blue-500/10" />
            )}
          </div>
        )}
        
        {messageContent}

        {/* Reactions Display */}
        {reactions.length > 0 && (
            <div className={cn("flex flex-wrap gap-1 px-1", isOwnMessage && "justify-end")}>
                {reactions.map((reaction) => (
                    <button 
                        key={reaction.emoji}
                        onClick={(e) => {
                            e.stopPropagation()
                            onReact?.(reaction.emoji)
                        }}
                        className={cn(
                            "flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all hover:scale-105 active:scale-95",
                            reaction.hasReacted 
                                ? "bg-blue-500/20 border-blue-500/50 text-blue-200" 
                                : "bg-zinc-800/80 border-white/10 text-zinc-300 hover:bg-zinc-700"
                        )}
                    >
                        <span>{reaction.emoji}</span>
                        {reaction.count > 1 && <span className="font-medium">{reaction.count}</span>}
                    </button>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}
