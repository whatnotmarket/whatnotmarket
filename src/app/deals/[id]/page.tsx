"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send, AlertCircle, FileText, ArrowLeft, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { dealsToast as toast } from "@/lib/notifications";
import { PaymentPanel } from "@/components/PaymentPanel";
import { createClient } from "@/lib/supabase";

type DealRow = {
  id: string;
  status: "verification" | "completed" | "cancelled";
  buyer_id: string;
  seller_id: string;
  request_id: string;
  offer_id: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  deal_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function DealRoomPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const dealId = String(params.id || "");
  const validDealId = isUuid(dealId);

  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState<DealRow | null>(null);
  const [dealTitle, setDealTitle] = useState("Deal");
  const [dealPrice, setDealPrice] = useState(0);
  const [buyerName, setBuyerName] = useState("Buyer");
  const [sellerName, setSellerName] = useState("Seller");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isBuyer = !!deal && currentUserId === deal.buyer_id;
  const dealStatus = deal?.status || "verification";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let active = true;

    async function loadDeal() {
      if (!validDealId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (active) {
        setCurrentUserId(user?.id || null);
      }

      const { data: dealData, error: dealError } = await supabase
        .from("deals")
        .select("id,status,buyer_id,seller_id,request_id,offer_id,created_at")
        .eq("id", dealId)
        .single();

      if (dealError || !dealData) {
        if (active) {
          toast.error("Deal not found or access denied");
          setLoading(false);
        }
        return;
      }

      const [offerRes, requestRes, profilesRes, messagesRes] = await Promise.all([
        supabase.from("offers").select("price").eq("id", dealData.offer_id).maybeSingle(),
        supabase.from("requests").select("title").eq("id", dealData.request_id).maybeSingle(),
        supabase
          .from("profiles")
          .select("id,full_name,username")
          .in("id", [dealData.buyer_id, dealData.seller_id]),
        supabase
          .from("messages")
          .select("id,deal_id,sender_id,content,created_at")
          .eq("deal_id", dealId)
          .order("created_at", { ascending: true }),
      ]);

      const profileMap = (profilesRes.data || []).reduce<Record<string, ProfileRow>>((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      if (!active) return;

      setDeal(dealData as DealRow);
      setDealPrice(Number(offerRes.data?.price || 0));
      setDealTitle(requestRes.data?.title || "Deal");
      setBuyerName(profileMap[dealData.buyer_id]?.full_name || profileMap[dealData.buyer_id]?.username || "Buyer");
      setSellerName(profileMap[dealData.seller_id]?.full_name || profileMap[dealData.seller_id]?.username || "Seller");
      setMessages((messagesRes.data || []) as MessageRow[]);
      setLoading(false);
    }

    loadDeal();

    return () => {
      active = false;
    };
  }, [dealId, supabase, validDealId]);

  useEffect(() => {
    if (!validDealId) return;

    const channel = supabase
      .channel(`deal-messages-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `deal_id=eq.${dealId}`,
        },
        (payload) => {
          const incoming = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, supabase, validDealId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deal || !currentUserId || !newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);

    const { error } = await supabase.from("messages").insert({
      deal_id: deal.id,
      sender_id: currentUserId,
      content,
    });

    setSendingMessage(false);

    if (error) {
      console.error(error);
      toast.error("Failed to send message");
      setNewMessage(content);
    }
  };

  const handleCompleteDeal = async () => {
    if (!deal) return;

    const response = await fetch("/api/deals/transition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dealId: deal.id,
        action: "complete",
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { deal?: DealRow; error?: string }
      | null;

    if (!response.ok || !payload?.deal) {
      toast.error(payload?.error || "Failed to update deal status");
      return;
    }

    setDeal(payload.deal);
    toast.success("Deal marked as completed");
  };

  if (!validDealId) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            Invalid deal id. Open a real deal UUID created after seller acceptance.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-84px)]">
        <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar pb-20">
          <Button variant="ghost" className="pl-0 text-zinc-500 hover:text-white mb-4" onClick={() => router.push("/market")}> 
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <Card className="bg-zinc-900/40 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-zinc-400 uppercase tracking-wider font-medium">Deal Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg leading-tight">{dealTitle}</h3>
                <p className="text-2xl font-bold text-white mt-1">${dealPrice || 0}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Status: {dealStatus}</span>
              </div>
            </CardContent>
          </Card>

          {dealStatus !== "completed" && deal && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isBuyer ? (
                <PaymentPanel dealId={deal.id} amount={dealPrice || 0} isBuyer={true} />
              ) : (
                <Card className="bg-zinc-900/40 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-zinc-400 uppercase tracking-wider font-medium">Payment Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 rounded-lg text-center">
                      <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                        <AlertCircle className="h-5 w-5 text-zinc-400" />
                      </div>
                      <h4 className="font-medium text-white">Awaiting Payment</h4>
                      <p className="text-xs text-zinc-500 mt-1">Buyer will confirm payment via escrow.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {dealStatus !== "completed" && (
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCompleteDeal} disabled={loading}>
              Mark as Completed
            </Button>
          )}
        </div>

        <div className="lg:col-span-3 flex flex-col h-full bg-zinc-900/20 border border-zinc-800 rounded-xl overflow-hidden relative">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                {(isBuyer ? sellerName : buyerName).charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-white">{isBuyer ? sellerName : buyerName}</h3>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live chat
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-zinc-400">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/50">
            {loading && <p className="text-zinc-500">Loading chat...</p>}

            {!loading && messages.length === 0 && (
              <p className="text-zinc-500 text-sm">No messages yet. Start the conversation.</p>
            )}

            {messages.map((msg) => {
              const isMe = currentUserId === msg.sender_id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                      isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700"
                    )}
                  >
                    <p>{msg.content}</p>
                    <p className={cn("text-[10px] mt-1 text-right opacity-70", isMe ? "text-blue-100" : "text-zinc-400")}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 backdrop-blur-md">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
              <Button type="button" variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                <FileText className="h-5 w-5" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-950/50 border-zinc-800 focus:border-zinc-700 rounded-full h-11 px-4"
                disabled={loading || !deal}
              />
              <Button
                type="submit"
                size="icon"
                className={cn(
                  "rounded-full h-11 w-11 transition-all duration-200",
                  newMessage.trim() ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-zinc-800 text-zinc-500"
                )}
                disabled={!newMessage.trim() || sendingMessage || loading || !deal}
              >
                <Send className="h-5 w-5 ml-0.5" />
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

