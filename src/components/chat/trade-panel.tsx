"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from "next/image"
import SolIcon from "cryptocurrency-icons/svg/color/sol.svg"
import UsdcIcon from "cryptocurrency-icons/svg/color/usdc.svg"
import UsdtIcon from "cryptocurrency-icons/svg/color/usdt.svg"
import BtcIcon from "cryptocurrency-icons/svg/color/btc.svg"
import EthIcon from "cryptocurrency-icons/svg/color/eth.svg"
import { toast } from "sonner" 
import { 
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Clock
} from "lucide-react"
import { Deal, DealStatus, Wallet } from "@/types/trade"
import { cn } from "@/lib/utils"

interface TradePanelProps {
  userId: string
  targetUserId: string
  roomName: string // for system messages
  onSystemMessage: (content: string) => void
  onStatusChange?: (status: string) => void
}

const TOKENS = [
  { symbol: 'SOL', name: 'Solana', Icon: SolIcon },
  { symbol: 'USDC', name: 'USD Coin', Icon: UsdcIcon },
  { symbol: 'USDT', name: 'Tether', Icon: UsdtIcon },
  { symbol: 'BTC', name: 'Bitcoin', Icon: BtcIcon },
  { symbol: 'ETH', name: 'Ethereum', Icon: EthIcon },
]

const FIAT_METHODS = [
  { id: 'credit_card', name: 'Credit Card', icon: '💳' },
  { id: 'apple_pay', name: 'Apple Pay', icon: '🍎' },
  { id: 'google_pay', name: 'Google Pay', icon: '🇬' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏦' },
]

function OfferForm({ 
  isCounter = false, 
  isBuying, 
  setIsBuying, 
  offerPrice, 
  setOfferPrice, 
  offerToken, 
  setOfferToken, 
  paymentType, 
  setPaymentType, 
  fiatMethod, 
  setFiatMethod, 
  handleCounterOffer, 
  handleMakeOffer, 
  isTestBuyer, 
  isWhatnotMarket,
  loading
}: any) {
    
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      // Allow only numbers, dots, and commas
      if (/^[0-9.,]*$/.test(value)) {
        setOfferPrice(value)
      }
    }

    return (
    <div className="space-y-4">
      <h4 className="font-medium leading-none">{isCounter ? 'Counter Offer' : 'Create Offer'}</h4>
      <div className="grid gap-4">
        {!isCounter && !isTestBuyer && !isWhatnotMarket && (
            <div className="flex items-center gap-2">
            <Button 
                variant={isBuying ? "default" : "outline"} 
                size="sm" 
                onClick={() => setIsBuying(true)}
                className={cn("flex-1", isBuying ? "bg-white text-black" : "bg-transparent text-white border-white/20")}
            >
                Buy
            </Button>
            <Button 
                variant={!isBuying ? "default" : "outline"} 
                size="sm" 
                onClick={() => setIsBuying(false)}
                className={cn("flex-1", !isBuying ? "bg-white text-black" : "bg-transparent text-white border-white/20")}
            >
                Sell
            </Button>
            </div>
        )}
        
        <div className="space-y-1">
            <Label htmlFor="price">Price</Label>
            <Input 
                id="price" 
                value={offerPrice} 
                onChange={handlePriceChange} 
                placeholder="0.00" 
                className="bg-black/50 border-white/10 h-8"
                autoFocus 
            />
        </div>

        <div className="space-y-1">
             <Label>Payment Type</Label>
             <div className="flex items-center gap-2">
                 <Button 
                    variant={paymentType === 'crypto' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentType('crypto')}
                    className={cn("flex-1 h-8", paymentType === 'crypto' ? "bg-white text-black" : "bg-transparent text-white border-white/20")}
                 >
                    Crypto
                 </Button>
                 <Button 
                    variant={paymentType === 'fiat' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentType('fiat')}
                    className={cn("flex-1 h-8", paymentType === 'fiat' ? "bg-white text-black" : "bg-transparent text-white border-white/20")}
                 >
                    Fiat (On-Ramp)
                 </Button>
             </div>
        </div>

        {paymentType === 'crypto' ? (
            <div className="space-y-1">
                <Label htmlFor="token">Token</Label>
                <Select value={offerToken} onValueChange={setOfferToken}>
                <SelectTrigger className="bg-black/50 border-white/10 h-8">
                    <SelectValue placeholder="Select Token" />
                </SelectTrigger>
                <SelectContent className="bg-[#101010] border-white/10 text-white">
                    {TOKENS.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                        <Image src={token.Icon} alt={token.symbol} width={20} height={20} className="rounded-full" />
                        <span>{token.symbol}</span>
                        </div>
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
        ) : (
            <div className="space-y-2">
                <div className="space-y-1">
                    <Label htmlFor="fiatMethod">Pay with</Label>
                    <Select value={fiatMethod} onValueChange={setFiatMethod}>
                    <SelectTrigger className="bg-black/50 border-white/10 h-8">
                        <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#101010] border-white/10 text-white">
                        {FIAT_METHODS.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                            <div className="flex items-center gap-2">
                            <span>{method.icon}</span>
                            <span>{method.name}</span>
                            </div>
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="text-xs text-zinc-500 text-center pt-1">
                    Partner with <span className="text-indigo-400 font-medium">MoonPay</span>
                </div>
            </div>
        )}

        <Button onClick={isCounter ? handleCounterOffer : handleMakeOffer} disabled={loading} className="w-full bg-white text-black hover:bg-zinc-200 mt-2">
          {loading ? 'Processing...' : (isCounter ? 'Send Counter Offer' : 'Send Offer')}
        </Button>
      </div>
    </div>
    )
}

export function TradePanel({ userId, targetUserId, roomName, onSystemMessage, onStatusChange }: TradePanelProps) {
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeReason, setDisputeReason] = useState("")
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [offerPrice, setOfferPrice] = useState("")
  const [offerToken, setOfferToken] = useState("SOL")
  const [paymentType, setPaymentType] = useState<"crypto" | "fiat">("crypto")
  const [fiatMethod, setFiatMethod] = useState("credit_card")
  const [isBuying, setIsBuying] = useState(true) // true = I am Buyer, false = I am Seller
  const [isCountering, setIsCountering] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isCreatingNewRef = useRef(false)
  
  useEffect(() => {
    isCreatingNewRef.current = isCreatingNew
  }, [isCreatingNew])
  
  const [targetUsername, setTargetUsername] = useState<string>("")
  const [currentUsername, setCurrentUsername] = useState<string>("")

  const supabase = createClient()

  useEffect(() => {
    // Resolve specific usernames for hardcoded roles
    async function resolveUsernames() {
        const { data: currentUser } = await supabase.from('profiles').select('username').eq('id', userId).single()
        const { data: targetUser } = await supabase.from('profiles').select('username').eq('id', targetUserId).single()
        
        if (currentUser) setCurrentUsername(currentUser.username || "")
        if (targetUser) setTargetUsername(targetUser.username || "")
    }
    resolveUsernames()
  }, [userId, targetUserId])

  // Determine fixed roles
  const isTestBuyer = currentUsername === 'testbuyer' || currentUsername === 'buyer'
  const isWhatnotMarket = currentUsername === 'whatnotmarket' || currentUsername === 'admin'
  
  // Force buying mode based on username if applicable
  useEffect(() => {
      if (isTestBuyer) setIsBuying(true)
      if (isWhatnotMarket) setIsBuying(false)
  }, [isTestBuyer, isWhatnotMarket])

  // Listen to system messages as a backup for realtime
  useEffect(() => {
      // If a system message comes in, it might be related to a deal update
      // We can't easily parse the content, but we can trigger a refetch if needed
      // However, we don't have direct access to the message stream here unless passed down.
      // But we can expose a refetch method or use the onSystemMessage callback to trigger checks?
      // Actually, let's just rely on the fact that if a system message is added, something happened.
      
      // Better approach: Since onSystemMessage is called when WE do something,
      // we need to know when the OTHER person does something.
      // The parent RealtimeChat receives messages. 
      // Let's modify the RealtimeChat to pass a "lastMessage" prop or similar signal.
  }, [])
  
  // New prop to signal external updates
  
  // FIX: Force Subscribe to ALL public schema changes for deals, without filters, 
  // and manually filter in the callback.
  // Also ensure we handle INSERTs correctly even if the deal state is null.

  useEffect(() => {
    fetchDeal()
    fetchWallets()
    
    console.log(`Subscribing to deals for room ${roomName} users: ${userId}, ${targetUserId}`)

    const channel = supabase
      .channel(`global-deals-tracker`) // Use a unique name to avoid conflicts
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals'
        },
        (payload) => {
           console.log("Global Realtime payload:", payload.eventType, payload.new)
           
           const newRecord = payload.new as Deal
           // Safety check
           if (!newRecord) return

           // Check if this deal involves our two users
           const participants = [newRecord.buyer_id, newRecord.seller_id]
           const isRelevant = participants.includes(userId) && participants.includes(targetUserId)
           
           if (!isRelevant) return

           console.log("Relevant deal update found!", newRecord)

           if (payload.eventType === 'INSERT') {
               setDeal(newRecord)
           } else if (payload.eventType === 'UPDATE') {
               // Only update if it's the current deal or we don't have one yet
               if (!deal || deal.id === newRecord.id) {
                   // If status is cancelled/completed, we might want to show it or clear it
                   if (['cancelled'].includes(newRecord.status)) {
                       // Optional: setDeal(null) or keep showing cancelled state
                       setDeal(newRecord) 
                   } else {
                       setDeal(newRecord)
                   }
               }
           }
        }
      )
      .subscribe((status) => {
          console.log("Global Subscription status:", status)
      })
      
    // Backup polling every 3 seconds to ensure state consistency
    const interval = setInterval(() => {
        fetchDeal(true) // Silent fetch
    }, 3000)

    return () => {
        supabase.removeChannel(channel)
        clearInterval(interval)
    }
  }, [userId, targetUserId]) // Remove deal dependency to avoid resubscribing constantly

  async function fetchWallets() {
    const { data } = await supabase
      .from("wallets")
      .select("id, address, chain, verified_at")
      .eq("user_id", targetUserId)
    
    if (data) setWallets(data as Wallet[])
  }

  async function fetchDeal(silent = false) {
    if (!silent) setLoading(true)
    try {
      // Find active deal (not completed/cancelled/rejected)
      // We also want to exclude rejected deals if we are looking for a new one, 
      // but we need to show the rejected status if it just happened.
      // Strategy: Fetch the latest deal. If it's rejected/completed, we show it 
      // UNTIL the user clicks "New Offer" which clears local state.
      // But if we reload, we might fetch it again.
      // Fix: If the latest deal is rejected/completed, and it's older than X time? No.
      // Better: We just fetch the latest. The "New Offer" button just clears the UI.
      // When "Send Offer" is clicked, it creates a NEW deal which will be the latest.
      
      const { data } = await supabase
        .from("deals")
        .select("*")
        .or(`and(buyer_id.eq.${userId},seller_id.eq.${targetUserId}),and(buyer_id.eq.${targetUserId},seller_id.eq.${userId})`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        // If we are in "new offer mode" and the fetched deal is a finished one (which we likely just cleared), ignore it.
        const isFinished = ['completed', 'offer_rejected', 'cancelled'].includes(data.status)
        
        // Use ref to avoid stale closure in setInterval
        if (isCreatingNewRef.current && isFinished) {
             setDeal(null)
             onStatusChange?.('new')
        } else {
             // If we found a deal that is not finished (e.g. new offer from other side), exit creation mode
             if (!isFinished) setIsCreatingNew(false)

             // Only update state if data actually changed to avoid re-renders
             setDeal(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(data)) {
                    onStatusChange?.(data.status)
                    return data as Deal
                }
                return prev
             })
        }
      } else {
        setDeal(null)
        onStatusChange?.('new')
      }
    } catch (err) {
      console.error("Error fetching deal:", err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleNewOfferClick = () => {
    setIsCreatingNew(true)
    setDeal(null)
    setShowOfferModal(true)
  }

  async function handleMakeOffer() {
    if (!offerPrice) return
    
    setIsSubmitting(true)

    // Clear any previous deal state just in case
    setDeal(null)
    
    const price = parseFloat(offerPrice)
    const qty = 1
    const fee = price * 0.01 // Mock fee 1%

    const payload = {
      buyer_id: isBuying ? userId : targetUserId,
      seller_id: isBuying ? targetUserId : userId,
      status: (isBuying ? 'buyer_offer_sent' : 'offer_sent') as DealStatus, // Initial state
      price,
      // quantity: qty, // Removed quantity from payload
      token_symbol: paymentType === 'fiat' ? 'USD' : offerToken,
      // TODO: Uncomment after migration applied
      // payment_type: paymentType,
      // fiat_method: paymentType === 'fiat' ? fiatMethod : null,
      fee,
      deal_type: 'direct',
      sender_id: userId,
      last_action_by: userId,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("deals")
      .insert(payload)
      .select()
      .single()

    if (error) {
      toast.error("Failed to create offer")
      console.error(error)
      setIsSubmitting(false)
      return
    }

    setDeal(data as Deal)
    onStatusChange?.(data.status)
    setShowOfferModal(false)
    setIsCreatingNew(false)
    setIsSubmitting(false)
    onSystemMessage(`Offer sent: ${qty}x for ${price} ${offerToken}`)
  }

  async function handleCounterOffer() {
    if (!deal || !offerPrice) return

    setIsSubmitting(true)

    const price = parseFloat(offerPrice)
    const qty = 1
    
    // Determine new status based on who is countering
    // If I am the Buyer, and I counter -> BUYER_COUNTER_OFFER
    // If I am the Seller, and I counter -> SELLER_COUNTER_OFFER
    
    // Check if I am buyer or seller in the deal
    const iAmBuyer = deal.buyer_id === userId
    const newStatus: DealStatus = iAmBuyer ? 'buyer_counter_offer' : 'seller_counter_offer'
    
    const { error } = await supabase
        .from("deals")
        .update({
            status: newStatus,
            price: price,
            // quantity: qty, // Removed quantity
            token_symbol: paymentType === 'fiat' ? 'USD' : offerToken,
            // TODO: Uncomment after migration applied
            // payment_type: paymentType,
            // fiat_method: paymentType === 'fiat' ? fiatMethod : null,
            sender_id: userId, // I am now the sender of the current offer
            last_action_by: userId
        })
        .eq("id", deal.id)
        
    if (error) {
        console.error("Counter offer failed:", error)
        toast.error("Failed to send counter offer")
        setIsSubmitting(false)
        return
    }
    
    // Optimistic update
    const updatedDeal = {
        ...deal,
        status: newStatus,
        price,
        // quantity: qty, // Removed quantity
        token_symbol: paymentType === 'fiat' ? 'USD' : offerToken,
        // payment_type: paymentType,
        // fiat_method: paymentType === 'fiat' ? fiatMethod : undefined,
        sender_id: userId,
        last_action_by: userId
    }
    setDeal(updatedDeal)
    onStatusChange?.(newStatus)
    
    setShowOfferModal(false)
    setIsCountering(false)
    setIsSubmitting(false)
    onSystemMessage(`Counter offer sent: ${qty}x for ${price} ${offerToken}`)
  }

  async function updateStatus(newStatus: DealStatus, message: string) {
    if (!deal) return

    console.log(`Updating status to ${newStatus} for deal ${deal.id}`)

    const { error } = await supabase
      .from("deals")
      .update({ 
          status: newStatus,
          last_action_by: userId
      })
      .eq("id", deal.id)

    if (error) {
      console.error("Update status failed:", error)
      toast.error("Failed to update status")
      return
    }

    console.log("Status updated successfully")
    setDeal({ ...deal, status: newStatus, last_action_by: userId })
    onStatusChange?.(newStatus)
    onSystemMessage(message)
  }

  async function handleResolveDispute() {
    if (!disputeReason.trim()) return
    
    await updateStatus('completed', `Dispute resolved by admin: ${disputeReason}`)
    setShowDisputeModal(false)
    setDisputeReason("")
  }

  // --- Logic for Turn-Based Actions ---

  // Check if it's my turn to act
  const isMyTurn = () => {
      if (!deal) return true // Can create offer
      
      // If deal is completed/cancelled, no one acts
      if (['completed', 'cancelled', 'dispute'].includes(deal.status)) return true // Anyone can view/dispute maybe?
      
      // Negotiation phase
      if (['offer_sent', 'buyer_offer_sent', 'seller_counter_offer', 'buyer_counter_offer'].includes(deal.status)) {
          // If I was the last one to act (last_action_by == userId), then it's NOT my turn.
          const lastActor = deal.last_action_by || deal.sender_id
          if (lastActor) {
              return lastActor !== userId
          }
          // Fallback: if sender_id is also missing (unlikely with new deals), assume it's NOT my turn to avoid race conditions or both acting
          return false
      }
      
      // Execution phase (simplified for now, usually specific roles act)
      if (deal.status === 'offer_accepted') return true // Usually buyer funds
      if (deal.status === 'escrow_funded') return deal.seller_id === userId // Seller ships
      if (deal.status === 'shipped') return deal.buyer_id === userId // Buyer releases
      
      return true
  }

  const getStatusDisplay = () => {
    // If no deal, return a flag to hide
    if (!deal) return null
    
    const amIBuyer = deal.buyer_id === userId
    const lastActor = deal.last_action_by || deal.sender_id
    
    // Determine if I am the one who sent the last action/offer
    const isSender = lastActor === userId
    
    switch (deal.status) {
      case 'offer_sent': 
      case 'buyer_offer_sent':
          return isSender 
              ? { label: 'Offer Sent', color: 'bg-blue-600' }
              : { label: 'Offer Received', color: 'bg-green-600' }
      case 'seller_counter_offer':
          return isSender 
              ? { label: 'Counter Offer Sent', color: 'bg-orange-600' }
              : { label: 'Counter Offer Received', color: 'bg-orange-600' }
      case 'buyer_counter_offer':
          return isSender 
              ? { label: 'Counter Offer Sent', color: 'bg-orange-600' }
              : { label: 'Counter Offer Received', color: 'bg-orange-600' }
      case 'offer_accepted': return { label: 'Offer Accepted', color: 'bg-green-600' }
      case 'escrow_funded': return { label: 'Escrow Funded', color: 'bg-purple-600' }
      case 'shipped': return { label: 'Item Shipped', color: 'bg-blue-500' }
      case 'completed': return { label: 'Completed', color: 'bg-emerald-600' }
      case 'dispute': return { label: 'Dispute', color: 'bg-red-600' }
      case 'cancelled': return { label: 'Cancelled', color: 'bg-red-900' }
      case 'offer_rejected': return { label: 'Rejected', color: 'bg-red-800' }
      default: return { label: 'Negotiating', color: 'bg-zinc-800' }
    }
  }

  const getWaitingMessage = () => {
      if (!deal) return null
      if (['completed', 'cancelled'].includes(deal.status)) return null
      
      const lastActor = deal.last_action_by || deal.sender_id
      
      // If it's negotiation and NOT my turn
      if (['offer_sent', 'buyer_offer_sent', 'seller_counter_offer', 'buyer_counter_offer'].includes(deal.status)) {
          if (lastActor === userId) {
             return (
                 <div className="flex items-center gap-2 text-xs text-zinc-400 animate-pulse">
                     <Clock className="w-3 h-3" />
                     Waiting for {deal.buyer_id === userId ? 'seller' : 'buyer'} response...
                 </div>
             )
          } else {
             return (
                 <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                     Your turn to respond
                 </div>
             )
          }
      }
      return null
  }

  if (loading) return null

  const statusInfo = getStatusDisplay()
  // If there's no active deal, we don't render the top status bar at all
  if (!deal && !statusInfo) {
      return (
          <div className="w-full bg-[#101010] border-b border-white/10">
              <div className="px-3 py-4 flex gap-2 overflow-x-auto items-center">
                   <Popover open={showOfferModal} onOpenChange={setShowOfferModal}>
                    <PopoverTrigger asChild>
                      <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-medium">
                        Make Offer
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-[#101010] border border-white/10 text-white p-4" onInteractOutside={(e) => e.preventDefault()}>
                      <OfferForm 
                        isCounter={false} 
                        isBuying={isBuying}
                        setIsBuying={setIsBuying}
                        offerPrice={offerPrice}
                        setOfferPrice={setOfferPrice}
                        offerToken={offerToken}
                        setOfferToken={setOfferToken}
                        paymentType={paymentType}
                        setPaymentType={setPaymentType}
                        fiatMethod={fiatMethod}
                        setFiatMethod={setFiatMethod}
                        handleCounterOffer={handleCounterOffer}
                        handleMakeOffer={handleMakeOffer}
                        isTestBuyer={isTestBuyer}
                        isWhatnotMarket={isWhatnotMarket}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="text-xs text-zinc-500 italic">Use /buy or /sell to start a transaction status.</div>
              </div>
          </div>
      )
  }

  const canAct = isMyTurn()
  const lastActor = deal?.last_action_by || deal?.sender_id
  const isMyLastAction = lastActor === userId

  // Prepare Counter Offer Modal content
  // Removed internal OfferForm definition to avoid re-renders
  // ...

  const DisputeForm = () => (
    <div className="space-y-4">
      <h4 className="font-medium leading-none">Resolve Dispute</h4>
      <div className="space-y-2">
        <Label htmlFor="reason">Resolution Reason</Label>
        <Input 
          id="reason" 
          value={disputeReason} 
          onChange={e => setDisputeReason(e.target.value)} 
          placeholder="Enter reason for resolution..." 
          className="bg-black/50 border-white/10 h-8" 
        />
      </div>
      <Button onClick={handleResolveDispute} disabled={!disputeReason.trim()} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2">
        Confirm Resolution
      </Button>
    </div>
  )

  return (
    <div className="w-full bg-[#101010] border-b border-white/10">
      {/* Top Bar: Trade Status & Wallet - Only show if a deal exists */}
      {deal && (
        <div className="p-3 flex items-center justify-between gap-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Transaction Status</span>
              <div className="flex items-center gap-3">
                  <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
                  {getWaitingMessage()}
              </div>
            </div>
            
            {!['completed', 'cancelled', 'offer_rejected'].includes(deal.status) && (
              <>
                <Separator orientation="vertical" className="h-8 bg-white/10 mx-2" />
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Current Offer</span>
                  <div className="text-sm font-medium text-white flex gap-2 items-center">
                    {deal.payment_type !== 'fiat' && TOKENS.find(t => t.symbol === deal.token_symbol) && (
                      <Image 
                        src={TOKENS.find(t => t.symbol === deal.token_symbol)!.Icon} 
                        alt={deal.token_symbol || ''} 
                        width={16} 
                        height={16} 
                        className="rounded-full" 
                      />
                    )}
                    <span>{deal.price} {deal.payment_type === 'fiat' ? 'USD' : deal.token_symbol}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Wallet Info (Right Side) */}
          {wallets.length > 0 && (
            <div className="hidden md:flex flex-col items-end">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider flex items-center gap-1">
                  Verified Wallet <ShieldCheck className="w-3 h-3 text-green-500" />
                </span>
                <div className="text-xs text-zinc-300 font-mono mt-1">
                  {wallets[0].address.slice(0, 6)}...{wallets[0].address.slice(-4)}
                </div>
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className={cn("px-3 flex gap-2 overflow-x-auto items-center", deal ? "py-3" : "py-4")}>
        
        {/* Case 1: No active deal -> Make Offer */}
        {!deal && (
           <Popover open={showOfferModal} onOpenChange={setShowOfferModal}>
             <PopoverTrigger asChild>
               <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-medium">
                 Make Offer
               </Button>
             </PopoverTrigger>
             <PopoverContent className="w-80 bg-[#101010] border border-white/10 text-white p-4" onInteractOutside={(e) => e.preventDefault()}>
               <OfferForm 
                 isCounter={false} 
                 isBuying={isBuying}
                 setIsBuying={setIsBuying}
                 offerPrice={offerPrice}
                 setOfferPrice={setOfferPrice}
                 offerToken={offerToken}
                 setOfferToken={setOfferToken}
                 paymentType={paymentType}
                 setPaymentType={setPaymentType}
                 fiatMethod={fiatMethod}
                 setFiatMethod={setFiatMethod}
                 handleCounterOffer={handleCounterOffer}
                 handleMakeOffer={handleMakeOffer}
                 isTestBuyer={isTestBuyer}
                 isWhatnotMarket={isWhatnotMarket}
               />
             </PopoverContent>
           </Popover>
        )}

        {/* Case 2: Negotiation Phase (Offer Sent / Counter Offer) */}
        {deal && ['offer_sent', 'buyer_offer_sent', 'seller_counter_offer', 'buyer_counter_offer'].includes(deal.status) && (
            <>
                {/* If it is NOT my last action, I can Accept, Reject, Counter */}
                {!isMyLastAction ? (
                    <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateStatus('offer_accepted', 'Offer accepted')}>
                            Accept
                        </Button>
                        <Popover open={showOfferModal} onOpenChange={(open) => {
                            setShowOfferModal(open)
                            if (open) {
                                setIsCountering(true)
                                setOfferPrice(deal.price?.toString() || "")
                                setOfferToken(deal.token_symbol || "SOL")
                                if (deal.payment_type) setPaymentType(deal.payment_type)
                                if (deal.fiat_method) setFiatMethod(deal.fiat_method)
                            }
                        }}>
                            <PopoverTrigger asChild>
                                <Button size="sm" variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700">
                                    <RefreshCw className="w-3 h-3 mr-2" /> Counter
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 bg-[#101010] border border-white/10 text-white p-4">
                                <OfferForm 
                                    isCounter={true} 
                                    isBuying={isBuying}
                                    setIsBuying={setIsBuying}
                                    offerPrice={offerPrice}
                                    setOfferPrice={setOfferPrice}
                                    offerToken={offerToken}
                                    setOfferToken={setOfferToken}
                                    paymentType={paymentType}
                                    setPaymentType={setPaymentType}
                                    fiatMethod={fiatMethod}
                                    setFiatMethod={setFiatMethod}
                                    handleCounterOffer={handleCounterOffer}
                                    handleMakeOffer={handleMakeOffer}
                                    isTestBuyer={isTestBuyer}
                                    isWhatnotMarket={isWhatnotMarket}
                                />
                            </PopoverContent>
                        </Popover>
                        <Button size="sm" variant="outline" className="text-red-400 border-red-900/50 hover:bg-red-950/50" onClick={() => updateStatus('offer_rejected', 'Offer rejected')}>
                            Reject
                        </Button>
                    </>
                ) : (
                    // If it IS my last action, I can only Cancel my offer
                    <Button size="sm" variant="outline" className="text-zinc-400 border-white/10" onClick={() => updateStatus('cancelled', 'Offer cancelled')}>
                        Cancel Offer
                    </Button>
                )}
            </>
        )}

        {/* Case 3: Execution Phase */}
        {deal?.status === 'offer_accepted' && (
           deal.buyer_id === userId ? (
             <div className="flex items-center gap-2">
                 <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => updateStatus('escrow_funded', `Escrow funded with ${deal.price} ${deal.token_symbol}`)}>
                   Fund Escrow
                 </Button>
                 <Button size="sm" variant="outline" className="text-red-400 border-red-900/50 hover:bg-red-950/50" onClick={() => updateStatus('cancelled', 'Transaction cancelled by buyer')}>
                   Cancel
                 </Button>
             </div>
           ) : (
             <span className="text-xs text-zinc-400 flex items-center"><Clock className="w-3 h-3 mr-1"/> Waiting for buyer to fund escrow</span>
           )
        )}

        {deal?.status === 'escrow_funded' && (
           deal.seller_id === userId ? (
             <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => updateStatus('shipped', 'Item marked as shipped')}>
               Mark Shipped
             </Button>
           ) : (
             <span className="text-xs text-zinc-400 flex items-center"><Clock className="w-3 h-3 mr-1"/> Waiting for seller to ship</span>
           )
        )}

        {deal?.status === 'shipped' && (
          <>
            {deal.buyer_id === userId ? (
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateStatus('completed', 'Transaction completed. Funds released.')}>
                  Release Funds
                </Button>
            ) : (
                <span className="text-xs text-zinc-400 flex items-center"><Clock className="w-3 h-3 mr-1"/> Waiting for buyer to confirm receipt</span>
            )}
            <Button size="sm" variant="outline" className="text-red-400 border-red-900/50 hover:bg-red-950/50" onClick={() => updateStatus('dispute', 'Dispute opened')}>
              Open Dispute
            </Button>
          </>
        )}
        
        {deal?.status === 'completed' && (isBuying || isTestBuyer) && !isWhatnotMarket && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleNewOfferClick}>
                New Offer
            </Button>
        )}

        {deal?.status === 'cancelled' && (isBuying || isTestBuyer) && !isWhatnotMarket && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleNewOfferClick}>
                New Offer
            </Button>
        )}
        
        {deal?.status === 'dispute' && (
           <div className="flex items-center gap-2">
             <div className="text-xs text-red-400 flex items-center bg-red-950/30 px-3 py-1 rounded border border-red-900/50">
               <AlertTriangle className="w-3 h-3 mr-2" /> Dispute in progress
             </div>
             {isWhatnotMarket && (
               <Popover open={showDisputeModal} onOpenChange={setShowDisputeModal}>
                 <PopoverTrigger asChild>
                   <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs">
                     Resolve Dispute
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-80 bg-[#101010] border border-white/10 text-white p-4">
                   <DisputeForm />
                 </PopoverContent>
               </Popover>
             )}
           </div>
        )}
        
        {deal?.status === 'offer_rejected' && (isBuying || isTestBuyer) && !isWhatnotMarket && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleNewOfferClick}>
                New Offer
            </Button>
        )}
      </div>
    </div>
  )
}
