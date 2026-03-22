"use client"

import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect, useRef, useMemo } from 'react'
import { Send, Mic, Smile, Ban, Flag, MessageSquare, Globe, X } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { useRealtimeChat, type ChatMessage } from '@/hooks/use-realtime-chat'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { ChatMessageItem } from './chat-message'
import { toast } from '@/lib/domains/notifications'
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shared/ui/popover'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { createClient } from '@/lib/infra/supabase/supabase'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shared/ui/tooltip"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/shared/ui/avatar"
import { useRouter } from "next/navigation"
import { TradePanel } from '@/components/features/chat/trade-panel'
import { cn } from "@/lib/core/utils/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shared/ui/dialog"
import { Field, FieldGroup } from "@/components/shared/ui/field"
import { Label } from "@/components/shared/ui/label"
import { Textarea } from "@/components/shared/ui/primitives/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select"
import { Checkbox } from "@/components/shared/ui/checkbox"
import { Upload } from 'lucide-react'

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

type SlashCommand = {
  command: string
  description: string
  action: string
  localOnly: boolean
}

const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9]+\.[a-zA-Z]{2,}\/)/i;

export function RealtimeChat({ roomName, userId, username, isVerified, role, onMessage, messages: initialMessages, targetUser }: RealtimeChatProps) {
  const router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const [showCommands, setShowCommands] = useState(false)
  const [timer, setTimer] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [sideOpen, setSideOpen] = useState(false)
  const [sideMode, setSideMode] = useState<'profile' | 'info'>('profile')
  const [panelLoading, setPanelLoading] = useState(false)
  const [panelData, setPanelData] = useState<{
    createdAt?: string
    followers: number
    offers: number
    reviews: number
    totalTransactions: number
    deliveryRate: number
    isFollowing: boolean
    socials?: {
      telegram?: string
      twitter?: string
      website?: string
    }
  }>({ followers: 0, offers: 0, reviews: 0, totalTransactions: 0, deliveryRate: 100, isFollowing: false })
  const headerRef = useRef<HTMLDivElement | null>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  
  const { isRecording, audioBlob, startRecording, stopRecording, clearAudio, permission: audioPermission, error: audioError, requestPermission } = useAudioRecorder()
  
  const { messages, sendMessage, markAsRead, clearRoom } = useRealtimeChat({
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
  const [isBlockedByMe, setIsBlockedByMe] = useState(false)
  const [isBlockedByOther, setIsBlockedByOther] = useState(false)

  // Report Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportCategory, setReportCategory] = useState('')
  const [reportWallet, setReportWallet] = useState('')
  const [reportTxHash, setReportTxHash] = useState('')
  const [hasProof, setHasProof] = useState(false)
  const [proofFiles, setProofFiles] = useState<File[]>([])
  const [isReporting, setIsReporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Block Modal State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)

  // Check block status
  useEffect(() => {
      if (!targetUser?.id) return

      const checkBlockStatus = async () => {
          try {
              // Check if I blocked them
              const { data: myBlock } = await supabase
                  .from('user_blocks')
                  .select('*')
                  .eq('blocker_id', userId)
                  .eq('blocked_id', targetUser.id)
                  .maybeSingle()
              
              setIsBlockedByMe(!!myBlock)

              // Check if they blocked me
              const { data: theirBlock } = await supabase
                  .from('user_blocks')
                  .select('*')
                  .eq('blocker_id', targetUser.id)
                  .eq('blocked_id', userId)
                  .maybeSingle()
              
              setIsBlockedByOther(!!theirBlock)
          } catch (error) {
              console.error('Error checking block status:', error)
          }
      }

      checkBlockStatus()

      // Realtime subscription for blocks
      const channel = supabase
          .channel(`blocks:${roomName}`)
          .on('postgres_changes', { 
              event: '*', 
              schema: 'public', 
              table: 'user_blocks' 
          }, () => {
              checkBlockStatus()
          })
          .subscribe()

      return () => {
          supabase.removeChannel(channel)
      }
  }, [userId, targetUser?.id, supabase, roomName])

  useEffect(() => {
    const measure = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    async function loadPanelData() {
      if (!sideOpen || sideMode !== 'profile' || !targetUser?.id) return
      setPanelLoading(true)
      try {
        const targetId = targetUser.id
        const [{ data: profile }, followersCount, offersCount, completedCount, cancelledCount, { data: followData }] = await Promise.all([
          supabase.from('profiles').select('created_at, telegram_handle, twitter_handle, website').eq('id', targetId).maybeSingle(),
          supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', targetId),
          supabase.from('offers').select('id', { count: 'exact', head: true }).eq('created_by', targetId),
          supabase.from('deals').select('id', { count: 'exact', head: true }).or(`buyer_id.eq.${targetId},seller_id.eq.${targetId}`).eq('status', 'completed'),
          supabase.from('deals').select('id', { count: 'exact', head: true }).or(`buyer_id.eq.${targetId},seller_id.eq.${targetId}`).eq('status', 'cancelled'),
          supabase.from('follows').select('*').eq('follower_id', userId).eq('following_id', targetId).maybeSingle(),
        ])
        const completed = (completedCount.count ?? 0)
        const cancelled = (cancelledCount.count ?? 0)
        const total = completed + cancelled
        const rate = total > 0 ? Math.round((completed / total) * 100) : 100
        setPanelData({
          createdAt: profile?.created_at ?? undefined,
          followers: followersCount.count ?? 0,
          offers: offersCount.count ?? 0,
          reviews: 0,
          totalTransactions: completed,
          deliveryRate: rate,
          isFollowing: !!followData,
          socials: {
            telegram: profile?.telegram_handle,
            twitter: profile?.twitter_handle,
            website: profile?.website
          }
        })
      } catch {
        // Keep graceful fallbacks
      } finally {
        setPanelLoading(false)
      }
    }
    loadPanelData()
  }, [sideOpen, sideMode, targetUser?.id, supabase])

  const toggleFollow = async () => {
    if (!targetUser?.id) return
    const targetId = targetUser.id

    try {
      const nextAction = panelData.isFollowing ? 'unfollow' : 'follow'
      const response = await fetch('/api/follows/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: targetId,
          action: nextAction,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; following?: boolean; followersCount?: number }
        | null

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || 'Failed to update follow state')
      }

      const following = payload.following === true
      const followersCount =
        typeof payload.followersCount === 'number'
          ? payload.followersCount
          : Math.max(0, panelData.followers + (following ? 1 : -1))

      setPanelData((prev) => ({ ...prev, isFollowing: following, followers: followersCount }))
      toast.success(following ? `Ora segui ${targetUser.name}` : `Non segui piÃ¹ ${targetUser.name}`)
    } catch (err) {
      console.error('Error toggling follow:', err)
      toast.error('Errore durante l\'operazione')
    }
  }

  const formatMemberSince = (iso?: string) => {
    if (!iso) return 'â€”'
    const d = new Date(iso)
    const fmt = d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
    return fmt
  }

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

          await sendMessage('ðŸŽ¤ Voice Message', 'audio', publicUrl)
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

  const COMMANDS = useMemo(() => {
    const cmds = [
        { command: '/delete', description: 'Elimina tutti i messaggi', action: 'delete', localOnly: true },
    ]

    console.log('Current username for commands:', username)

    if (targetUser) {
        // Use canonical role from server-derived profile data, never username heuristics.
        const normalizedRole = String(role || "").trim().toLowerCase()
        const isBuyer = normalizedRole === 'buyer'
        const isSeller = normalizedRole === 'seller' || normalizedRole === 'admin'

        console.log('Role check:', { isBuyer, isSeller })

        if (isBuyer) {
            cmds.push({ command: '/buy', description: 'Inizia un acquisto', action: 'buy', localOnly: false })
        }
        if (isSeller) {
            cmds.push({ command: '/sell', description: 'Inizia una vendita', action: 'sell', localOnly: false })
        }

        if (isBlockedByMe) {
            cmds.unshift({ command: '/unblock', description: 'Sblocca il contatto', action: 'unblock', localOnly: false })
        } else {
            cmds.unshift({ command: '/block', description: 'Blocca la chat', action: 'block', localOnly: false })
        }
        cmds.push({ command: '/report', description: 'Segnala utente', action: 'report', localOnly: false })
    }

    return cmds
  }, [isBlockedByMe, isBlockedByOther, targetUser, username])

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

  const handleCommandSelect = async (cmd: SlashCommand) => {
      setInputValue('')
      setShowCommands(false)
      
      if (cmd.action === 'delete') {
          // Delete chat messages
          await clearRoom()
          
          // Cancel active deal if exists
          try {
              const { data: activeDeal } = await supabase
                  .from('deals')
                  .select('id')
                  .or(`and(buyer_id.eq.${userId},seller_id.eq.${targetUser?.id}),and(buyer_id.eq.${targetUser?.id},seller_id.eq.${userId})`)
                  .not("status", "in", `("completed","cancelled")`)
                  .limit(1)
                  .maybeSingle()
              
              if (activeDeal) {
                  const cancelRes = await fetch('/api/deals/transition', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        dealId: activeDeal.id,
                        action: 'cancel',
                      }),
                  })

                  if (!cancelRes.ok) {
                      console.warn('Deal cancel transition rejected while clearing room')
                  }
              }
          } catch (e) {
              console.error("Failed to cancel deal on chat clear", e)
          }
          toast.success(`Comando ${cmd.command} eseguito`)
          return
      }

      if (cmd.action === 'block') {
          setIsBlockModalOpen(true)
          return
      }

      if (cmd.action === 'unblock') {
          try {
              const { error } = await supabase.from('user_blocks').delete()
                  .eq('blocker_id', userId)
                  .eq('blocked_id', targetUser?.id)
              if (error) throw error
              setIsBlockedByMe(false)
              toast.success('Utente sbloccato')
          } catch (e) {
              console.error(e)
              toast.error('Errore durante lo sblocco')
          }
          return
      }

      if (cmd.action === 'report') {
          setIsReportModalOpen(true)
          return
      }

      if (cmd.action === 'buy' || cmd.action === 'sell') {
          // Open the trade panel side if not open
          setSideOpen(true)
          setSideMode('profile')
          
          // Trigger the make offer modal inside TradePanel (handled via a signal or we can just send a system message)
          await sendMessage(`Comando ${cmd.command} avviato`, 'system')
          toast.info(`Configura la tua offerta nel pannello laterale`)
          return
      }
  }

  const confirmBlock = async () => {
    try {
        const { error } = await supabase.from('user_blocks').insert({
            blocker_id: userId,
            blocked_id: targetUser?.id
        })
        if (error) throw error
        setIsBlockedByMe(true)
        setIsBlockModalOpen(false)
        toast.success('Utente bloccato')
    } catch (e) {
        console.error(e)
        toast.error('Errore durante il blocco')
    }
  }

  const submitReport = async () => {
      const reasonLength = reportReason.trim().length
      if (!reportCategory || reasonLength < 20 || reasonLength > 300) return
      
      setIsReporting(true)
      try {
          const reportData = {
              reporter_id: userId,
              reported_id: targetUser?.id,
              category: reportCategory,
              reason: reportReason.trim(),
              wallet_address: reportWallet.trim() || null,
              tx_hash: reportTxHash.trim() || null,
              has_proof: hasProof,
              status: 'pending'
          }
          
          console.log('Submitting report with data:', reportData)

          const { error } = await supabase.from('user_reports').insert(reportData)
          
          if (error) throw error
          
          // Note: In a real scenario, you would upload proofFile to Supabase Storage here
          
          setIsReportModalOpen(false)
          resetReportForm()
          toast.success('Utente segnalato agli admin')
      } catch (e) {
          console.error('Report submission error:', e)
          toast.error('Errore durante la segnalazione. Verifica che il database sia aggiornato.')
      } finally {
          setIsReporting(false)
      }
   }

   const resetReportForm = () => {
       setReportReason('')
       setReportCategory('')
       setReportWallet('')
       setReportTxHash('')
       setHasProof(false)
       setProofFiles([])
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

  const [isDisputeActive, setIsDisputeActive] = useState(false)

  const handleSystemMessage = async (content: string) => {
    await sendMessage(content, 'system')
  }

  const handleDealStatusChange = (status: string) => {
    setIsDisputeActive(status === 'dispute')
  }

  const isInputDisabled = isDisputeActive || isBlockedByMe || isBlockedByOther

  // If blocked by other, listen for unblock in realtime
  useEffect(() => {
      if (!targetUser?.id) return

      const channel = supabase
          .channel(`block-listener:${roomName}`)
          .on('postgres_changes', { 
              event: 'DELETE', 
              schema: 'public', 
              table: 'user_blocks',
              filter: `blocker_id=eq.${targetUser.id}`
          }, (payload) => {
              if (payload.old.blocked_id === userId) {
                  setIsBlockedByOther(false)
                  toast.success(`${targetUser.name} ti ha sbloccato.`)
              }
          })
          .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'user_blocks',
              filter: `blocker_id=eq.${targetUser.id}`
          }, (payload) => {
              if (payload.new.blocked_id === userId) {
                  setIsBlockedByOther(true)
                  toast.error(`${targetUser.name} ti ha bloccato.`)
              }
          })
          .subscribe()

      return () => {
          supabase.removeChannel(channel)
      }
  }, [targetUser?.id, roomName, userId, supabase])

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      {targetUser && (
        <div ref={headerRef} className="flex items-center justify-between p-4 border-b border-white/10 bg-[#101010]">
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-white/10 hover:bg-white/5 text-zinc-300 flex items-center gap-2"
              onClick={() => {
                setSideMode('profile')
                setSideOpen(v => !v)
              }}
              aria-expanded={sideOpen}
              aria-controls="chat-side-panel"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform ${sideOpen ? 'rotate-180' : 'rotate-0'}`}
              >
                <g strokeWidth="0"></g>
                <g strokeLinecap="round" strokeLinejoin="round"></g>
                <g>
                  <path
                    d="M2 7.81125V16.1913C2 17.6813 2.36 18.9212 3.05 19.8713C3.34 20.2913 3.71 20.6612 4.13 20.9513C4.95 21.5513 5.99 21.9012 7.22 21.9812V2.03125C3.94 2.24125 2 4.37125 2 7.81125Z"
                    fill="#ffffff"
                  ></path>
                  <path
                    d="M20.9507 4.13C20.6607 3.71 20.2907 3.34 19.8707 3.05C18.9207 2.36 17.6807 2 16.1907 2H8.7207V22H16.1907C19.8307 22 22.0007 19.83 22.0007 16.19V7.81C22.0007 6.32 21.6407 5.08 20.9507 4.13ZM15.5007 14.03C15.7907 14.32 15.7907 14.8 15.5007 15.09C15.3507 15.24 15.1607 15.31 14.9707 15.31C14.7807 15.31 14.5907 15.24 14.4407 15.09L11.8807 12.53C11.5907 12.24 11.5907 11.76 11.8807 11.47L14.4407 8.91C14.7307 8.62 15.2107 8.62 15.5007 8.91C15.7907 9.2 15.7907 9.68 15.5007 9.97L13.4807 12L15.5007 14.03Z"
                    fill="#ffffff"
                  ></path>
                </g>
              </svg>
              View Profile
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex flex-col transition-all duration-300 ${sideOpen ? 'w-full md:w-2/3' : 'w-full'}`}>
          {targetUser && !isBlockedByMe && !isBlockedByOther && (
            <TradePanel 
              userId={userId} 
              targetUserId={targetUser.id} 
              roomName={roomName}
              onSystemMessage={handleSystemMessage}
              onStatusChange={handleDealStatusChange}
            />
          )}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => {
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
            {messages.length === 0 && !isDisputeActive && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No messages yet. Start the conversation!
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-muted/30 flex justify-center items-end pb-6">
            <div className="w-full max-w-4xl relative">
              {showCommands && filteredCommands.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#101010] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                  {filteredCommands.map(cmd => (
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
              
              <div className="bg-[#101010] border border-white/10 rounded-[2rem] p-4 flex flex-col gap-4 shadow-2xl relative min-h-[100px]">
                {/* Top Row: Emoji & Input */}
                <div className="flex items-start gap-3 w-full">
                   {/* Emoji Picker */}
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 hover:bg-white/10 rounded-full text-zinc-400 mt-1" disabled={isInputDisabled}>
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full border-none p-0 shadow-none bg-transparent" align="start">
                      <div className="shadow-xl rounded-xl overflow-hidden">
                        <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.DARK} width={320} height={400} lazyLoadEmojis />
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Input Field */}
                  <textarea
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value)
                      if (e.target.value.startsWith('/')) {
                        setShowCommands(true)
                      } else {
                        setShowCommands(false)
                      }
                      // Auto-resize
                      e.target.style.height = 'auto'
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                      if (e.key === 'Escape') setShowCommands(false)
                    }}
                    placeholder={
                        isDisputeActive ? "Chat is disabled due to an active dispute." 
                        : isBlockedByMe ? "Hai bloccato questo utente. Usa /unblock per sbloccare."
                        : isBlockedByOther ? `${targetUser?.name || 'Utente'} ti ha bloccato, non puoi chattare con lui fino a che non ti sblocca.`
                        : "Type a message..."
                    }
                    disabled={isInputDisabled && !inputValue.startsWith('/')} 
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-500 text-base resize-none min-h-[24px] max-h-[120px] py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    rows={1}
                  />
                </div>

                {/* Bottom Row: Actions */}
                <div className="flex justify-between items-center w-full pt-2">
                  {/* Commands Trigger */}
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      className="h-9 px-4 rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 text-sm font-medium border border-white/5"
                      onClick={() => {
                        setInputValue('/')
                        setShowCommands(true)
                      }}
                      disabled={isInputDisabled && !isBlockedByMe} // Allow blocked-by-me to use unblock
                    >
                      /commands
                    </Button>
                  </div>

                  {/* Send Button (Conditional) */}
                  <AnimatePresence>
                    {inputValue.trim().length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button 
                          onClick={handleSend} 
                          disabled={isInputDisabled && !inputValue.startsWith('/')}
                          className="h-9 px-4 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center gap-2 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Send
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="text-center mt-3">
                <p className="text-[10px] text-zinc-500">
                  Centra may display inaccurate info, so please double check the response. <span className="underline cursor-pointer">Your Privacy & Orbita GPT</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div id="chat-side-panel" className={`hidden md:flex flex-col bg-[#0b0b0b] border-l border-white/10 transition-all duration-300 ${sideOpen ? 'w-1/3' : 'w-0'}`}>
          {sideOpen && (
            <div className="p-4 overflow-y-auto">
              {sideMode === 'profile' && targetUser && (
                <div className="space-y-5">
                  <div className="px-1 flex items-center justify-between">
                    <div className="text-white font-semibold text-base">{targetUser.handle ? `@${targetUser.handle}` : '@user'}</div>
                    <Button 
                      variant={panelData.isFollowing ? "outline" : "secondary"} 
                      size="sm" 
                      className={cn("h-7 text-xs font-medium", panelData.isFollowing ? "border-white/10 text-zinc-400" : "")}
                      onClick={toggleFollow}
                    >
                      {panelData.isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Social Media Links */}
                    {(panelData.socials?.telegram || panelData.socials?.twitter || panelData.socials?.website) && (
                      <div className="col-span-2 flex flex-wrap gap-2 mb-2">
                        {panelData.socials.telegram && (
                          <a href={`https://t.me/${panelData.socials.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 border border-[#2AABEE]/20 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21.68 3.39L2.14 10.96C0.8 11.49 0.82 12.24 1.9 12.57L6.92 14.14L18.53 6.82C19.08 6.48 19.58 6.67 19.17 7.04L10.32 15.03L10.05 18.91C10.45 18.91 10.63 18.73 10.86 18.51L13.14 16.29L17.88 19.79C18.75 20.27 19.38 20.03 19.59 19L22.69 4.39C23.01 3.12 22.21 2.54 21.68 3.39Z" fill="#2AABEE"/>
                            </svg>
                            <span className="text-xs font-medium text-[#2AABEE]">{panelData.socials.telegram}</span>
                          </a>
                        )}
                        {panelData.socials.twitter && (
                          <a href={`https://twitter.com/${panelData.socials.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="white"/>
                            </svg>
                            <span className="text-xs font-medium text-white">{panelData.socials.twitter}</span>
                          </a>
                        )}
                        {panelData.socials.website && (
                          <a href={panelData.socials.website.startsWith('http') ? panelData.socials.website : `https://${panelData.socials.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                            <Globe className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-xs font-medium text-zinc-300">{panelData.socials.website.replace(/^https?:\/\//, '')}</span>
                          </a>
                        )}
                      </div>
                    )}
                    
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-[11px] text-zinc-400">Member Since</div>
                      <div className="text-sm text-white">{formatMemberSince(panelData.createdAt)}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-[11px] text-zinc-400">Transactions</div>
                      <div className="text-sm text-white">
                        {panelData.deliveryRate}% ({panelData.totalTransactions})
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-[11px] text-zinc-400">Response Time</div>
                      <div className="text-sm text-white">5min</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-[11px] text-zinc-400">Last 30 Days</div>
                      <div className="text-sm text-white">100%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-[11px] text-zinc-400">Escrow Status</div>
                      <div className="text-sm text-white">Not escrow-verified</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-[11px] text-zinc-400">Ranking</div>
                      <div className="text-sm text-white">No verified platform rank</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-[11px] text-zinc-400">Protection Level</div>
                      <div className="text-sm text-white">Standard chat protections</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                      <div className="text-[11px] text-zinc-400">Followers</div>
                      <div className="text-sm text-white">{panelData.followers}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                      <div className="text-[11px] text-zinc-400">My Offers</div>
                      <div className="text-sm text-white">{panelData.offers}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                      <div className="text-[11px] text-zinc-400">Reviews</div>
                      <div className="text-sm text-white">{panelData.reviews}</div>
                    </div>
                  </div>
                  {panelLoading && <div className="text-xs text-zinc-400">Aggiornamento datiâ€¦</div>}
                </div>
              )}
              {sideMode === 'info' && (
                <div className="space-y-3">
                  <div className="text-white font-semibold">Informazioni</div>
                  <div className="text-sm text-zinc-300">Qui verranno mostrati contenuti specifici del comando.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isReportModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsReportModalOpen(false)
          resetReportForm()
        }
      }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Segnala Utente</DialogTitle>
            <DialogDescription>
              Fornisci i dettagli per la segnalazione. Queste informazioni verranno esaminate dai nostri moderatori.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="report-category">Motivo Segnalazione</Label>
              <Select value={reportCategory} onValueChange={setReportCategory}>
                <SelectTrigger id="report-category" className="w-full bg-zinc-900 border-white/10 h-10">
                  <SelectValue placeholder="Seleziona un motivo" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white">
                  <SelectItem value="scam_phishing">Scam / Phishing</SelectItem>
                  <SelectItem value="fake_nft">Fake NFT</SelectItem>
                  <SelectItem value="wash_trading">Wash Trading</SelectItem>
                  <SelectItem value="stolen_asset">Stolen Asset</SelectItem>
                  <SelectItem value="abusive_behavior">Abusive Behavior</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <Label htmlFor="report-reason">Descrizione</Label>
                <span className={cn(
                  "text-[10px] font-medium uppercase tracking-wider",
                  reportReason.trim().length < 20 || reportReason.trim().length > 300 ? "text-red-400" : "text-emerald-500"
                )}>
                  {reportReason.trim().length}/20-300
                </span>
              </div>
              <Textarea
                id="report-reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Descrivi dettagliatamente cosa Ã¨ successo (min. 20 caratteri)..."
                className="min-h-[100px]"
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <Label htmlFor="report-wallet">Wallet Address (opzionale)</Label>
                <Input 
                  id="report-wallet"
                  value={reportWallet}
                  onChange={(e) => setReportWallet(e.target.value)}
                  placeholder="0x..."
                  className="bg-zinc-900 border-white/10 h-10 px-3"
                />
              </Field>
              <Field>
                <Label htmlFor="report-txhash">TX Hash (opzionale)</Label>
                <Input 
                  id="report-txhash"
                  value={reportTxHash}
                  onChange={(e) => setReportTxHash(e.target.value)}
                  placeholder="Hash transazione"
                  className="bg-zinc-900 border-white/10 h-10 px-3"
                />
              </Field>
            </div>

            <Field className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/5 bg-white/5 p-4">
              <Checkbox 
                id="has-proof" 
                checked={hasProof} 
                onCheckedChange={(checked) => setHasProof(checked === true)}
                className="mt-1 border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="has-proof" className="text-sm font-medium cursor-pointer">
                  Ho delle prove da fornire (screenshot/file)
                </Label>
                <p className="text-xs text-zinc-500">
                  Seleziona se hai materiale che supporta la tua segnalazione.
                </p>
              </div>
            </Field>

            {hasProof && (
              <Field>
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setProofFiles(prev => [...prev, ...files]);
                  }}
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-dashed border-white/10 hover:bg-white/5 h-12 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Carica Foto / Screenshot (Multiple)
                </Button>
                
                {proofFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {proofFiles.map((file, idx) => (
                      <div key={idx} className="relative group w-16 h-16 rounded-lg border border-white/10 overflow-hidden bg-white/5">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="preview" 
                          className="w-full h-full object-cover"
                        />
                        <button 
                          onClick={() => setProofFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            )}
          </FieldGroup>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="h-10">Annulla</Button>
            </DialogClose>
            <Button 
              onClick={submitReport} 
              disabled={isReporting || !reportCategory || reportReason.trim().length < 20 || reportReason.trim().length > 300}
              className="bg-white text-black hover:bg-zinc-200 h-10"
            >
              {isReporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" />
                  Invio...
                </>
              ) : (
                "Invia Segnalazione"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBlockModalOpen} onOpenChange={setIsBlockModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Blocca Utente</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler bloccare {targetUser?.name || 'questo utente'}? Non potrete piÃ¹ scambiarvi messaggi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annulla</Button>
            </DialogClose>
            <Button 
              onClick={confirmBlock}
              className="bg-red-600 text-white hover:bg-red-700 border-none"
            >
              Blocca Utente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default RealtimeChat


