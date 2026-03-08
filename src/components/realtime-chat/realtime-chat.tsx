"use client"

import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Send, Mic, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRealtimeChat, type ChatMessage } from '@/hooks/use-realtime-chat'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { ChatMessageItem } from './chat-message'
import { toast } from '@/lib/notifications'
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { createClient } from '@/lib/supabase'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

interface RealtimeChatProps {
  roomName: string
  userId: string
  username: string
  isVerified?: boolean
  role?: string
  onMessage?: (messages: ChatMessage[], updatedMessage?: ChatMessage) => void
  messages?: ChatMessage[]
  targetUser?: {
    id: string
    name: string
    image?: string | null
    handle?: string | null
  }
}

const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9]+\.[a-zA-Z]{2,}\/)/i;

export function RealtimeChat({ roomName, userId, username, isVerified, role, onMessage, messages: initialMessages, targetUser }: RealtimeChatProps) {
  const router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const [showCommands, setShowCommands] = useState(false)
  const [timer, setTimer] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const { isRecording, audioBlob, startRecording, stopRecording, clearAudio, permission: audioPermission, error: audioError, requestPermission } = useAudioRecorder()
  
  const { messages, sendMessage, markAsRead } = useRealtimeChat({
    roomName,
    userId,
    username,
    isVerified,
    role,
    onMessage: onMessage
      ? (messages, updatedMessage) => onMessage(messages, updatedMessage as ChatMessage | undefined)
      : undefined,
    initialMessages,
  })
  const scrollRef = useChatScroll(messages)
  const supabase = createClient()

  useEffect(() => {
    if (messages.length === 0) return

    const unreadMessages = messages
        .filter(msg => {
            const isOwnMessage = msg.user.id ? msg.user.id === userId : msg.user.name === username
            return !isOwnMessage && msg.status !== 'read'
        })
        .map(msg => msg.id)

    if (unreadMessages.length > 0) {
        console.log('Marking messages as read:', unreadMessages);
        markAsRead(unreadMessages)
    }
  }, [messages, userId, username, markAsRead])

  useEffect(() => {
      if (isRecording) {
          setTimer(0)
          timerRef.current = setInterval(() => {
              setTimer(prev => prev + 1)
          }, 1000)
      } else {
          if (timerRef.current) clearInterval(timerRef.current)
          setTimer(0)
      }
      return () => {
          if (timerRef.current) clearInterval(timerRef.current)
      }
  }, [isRecording])

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleVoiceClick = async () => {
      // Always ensure we have permission before proceeding
      if (audioPermission !== 'granted') {
        const result = await requestPermission()
        if (result !== true) {
            toast.error(typeof result === 'string' ? result : 'Microphone permission required')
            return
        }
      }

      if (isRecording) {
          stopRecording()
      } else {
          startRecording()
      }
  }

  const sendAudioMessage = async () => {
      if (!audioBlob) return
      
      try {
          const fileName = `${roomName}/${Date.now()}.webm`
          const { data, error } = await supabase.storage
              .from('chat-audio') 
              .upload(fileName, audioBlob, {
                  contentType: 'audio/webm'
              })

          if (error) throw error

          const { data: { publicUrl } } = supabase.storage
              .from('chat-audio')
              .getPublicUrl(fileName)

          await sendMessage('🎤 Voice Message', 'audio', publicUrl)
          clearAudio()
      } catch (err) {
          console.error('Failed to send audio:', err)
          toast.error('Failed to send voice message')
      }
  }
  
  useEffect(() => {
      if (!isRecording && audioBlob) {
            sendAudioMessage()
      }
  }, [isRecording, audioBlob])

  const COMMANDS = [
    { command: '/block', description: 'Blocca la chat', message: 'Chat bloccata.' },
    { command: '/end', description: 'Termina la chat', message: 'Chat terminata.' },
    { command: '/accept', description: 'Accetta il deal', message: 'Deal accettato!' },
    { command: '/decline', description: 'Rifiuta il deal', message: 'Deal rifiutato.' },
    { command: '/report', description: 'Segnala utente', message: 'Utente segnalato.' },
  ]

  const filteredCommands = COMMANDS.filter(c => c.command.toLowerCase().startsWith(inputValue.toLowerCase()))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)
      if (val.startsWith('/')) {
          setShowCommands(true)
      } else {
          setShowCommands(false)
      }
  }

  const handleCommandSelect = async (cmd: typeof COMMANDS[0]) => {
      setInputValue('')
      setShowCommands(false)
      // Execute command logic (send predefined message for now)
      await sendMessage(cmd.message)
      toast.success(`Comando ${cmd.command} eseguito`)
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return

    if (URL_REGEX.test(inputValue)) {
      toast.error("Sharing links is not allowed in chat.");
      return;
    }

    // Check if it's a command typed manually
    if (inputValue.startsWith('/')) {
        const cmd = COMMANDS.find(c => c.command === inputValue.trim())
        if (cmd) {
            await handleCommandSelect(cmd)
            return
        }
    }

    await sendMessage(inputValue)
    setInputValue('')
    setShowCommands(false)
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInputValue((prev) => prev + emojiData.emoji)
  }

  return (
    <div className="flex flex-col h-full w-full bg-background/0">
      {targetUser && (
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#101010]">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/10 rounded-xl">
                    <AvatarImage src={targetUser.image || undefined} alt={targetUser.name} className="rounded-xl" />
                    <AvatarFallback className="rounded-xl">{targetUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-semibold text-white text-sm">{targetUser.name}</span>
                    {targetUser.handle && <span className="text-xs text-zinc-500">@{targetUser.handle}</span>}
                </div>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8 border-white/10 hover:bg-white/5 text-zinc-300"
                onClick={() => router.push(`/profile/${targetUser.id}`)}
            >
                View Profile
            </Button>
        </div>
      )}
      
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg, i) => {
          // Use userId for ownership check if available, otherwise fallback to name
          const isOwnMessage = msg.user.id ? msg.user.id === userId : msg.user.name === username
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
      <div className="p-4 border-t bg-muted/30 flex gap-2 items-center relative">
        {showCommands && filteredCommands.length > 0 && (
            <div className="absolute bottom-full left-4 mb-2 w-64 bg-[#101010] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                {filteredCommands.map((cmd) => (
                    <button
                        key={cmd.command}
                        onClick={() => handleCommandSelect(cmd)}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center justify-between group transition-colors"
                    >
                        <span className="font-medium text-white group-hover:text-blue-400 transition-colors">{cmd.command}</span>
                        <span className="text-xs text-zinc-500">{cmd.description}</span>
                    </button>
                ))}
            </div>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Smile className="h-5 w-5 text-zinc-400 hover:text-white" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full border-none p-0 shadow-none bg-transparent" align="start">
            <div className="shadow-xl rounded-xl overflow-hidden">
                <EmojiPicker 
                    onEmojiClick={handleEmojiClick}
                    theme={Theme.DARK}
                    width={320}
                    height={400}
                    lazyLoadEmojis={true}
                />
            </div>
          </PopoverContent>
        </Popover>
        <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`shrink-0 ${isRecording ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`}
                    onClick={handleVoiceClick}
                >
                    <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 16 16" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path 
                            d="M5 3C5 1.34315 6.34315 0 8 0C9.65685 0 11 1.34315 11 3V7C11 8.65685 9.65685 10 8 10C6.34315 10 5 8.65685 5 7V3Z" 
                            fill="currentColor"
                        />
                        <path 
                            d="M9 13.9291V16H7V13.9291C3.60771 13.4439 1 10.5265 1 7V6H3V7C3 9.76142 5.23858 12 8 12C10.7614 12 13 9.76142 13 7V6H15V7C15 10.5265 12.3923 13.4439 9 13.9291Z" 
                            fill="currentColor"
                        />
                    </svg>
                </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#101010] border border-white/10 text-white z-[60]" side="top" sideOffset={10}>
                <p>Clicca per inviare un messaggio vocale</p>
            </TooltipContent>
        </Tooltip>
        </TooltipProvider>
        <div className="relative flex-1">
          {isRecording ? (
              <div className="absolute inset-0 bg-[#101010] z-20 flex items-center justify-between px-2 rounded-md border border-red-500/30">
                  <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-mono text-white">{formatTime(timer)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-400 hover:text-white"
                          onClick={() => {
                              stopRecording()
                              // Set a flag to prevent sending? 
                              // Current effect sends if blob exists. 
                              // We need a way to discard.
                              // Hack: clearAudio immediately? No, blob sets after stop.
                              // We need to ignore the next blob.
                              // For now, let's just Stop = Send as requested.
                              // If they want to cancel, we'd need more logic.
                              // Let's assume Stop button means finish & send.
                          }}
                      >
                          <Send className="h-4 w-4" />
                      </Button>
                  </div>
              </div>
          ) : (
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend()
                if (e.key === 'Escape') setShowCommands(false)
            }}
            placeholder="Type a message..."
            className="w-full pr-12"
          />
          )}
          <AnimatePresence>
            {!isRecording && inputValue.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-[calc(100%-8px)]"
              >
                <Button 
                  onClick={handleSend} 
                  size="icon" 
                  className="h-full w-auto aspect-square rounded-md"
                >
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5"
                  >
                    <path 
                      d="M12 6V18M12 6L7 11M12 6L17 11" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
      </AnimatePresence>
    </div>
  )
}
