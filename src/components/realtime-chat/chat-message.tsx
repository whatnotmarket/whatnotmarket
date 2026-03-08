import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/use-realtime-chat'
import { CheckCircle2 } from 'lucide-react'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
}

export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
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
        <div
          className={cn(
            'py-2 px-3 rounded-xl text-sm w-fit relative min-w-[60px]',
            isOwnMessage 
              ? 'bg-white text-black' 
              : 'bg-[#101010] text-white border border-white/20'
          )}
        >
          <div className="flex items-end gap-2 flex-wrap justify-end">
            <span className="text-left break-words">{message.content}</span>
            <span className={cn("text-[10px] opacity-70 leading-none mb-0.5 whitespace-nowrap", isOwnMessage ? "text-black/60" : "text-white/60")}>
              {new Date(message.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
