"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Circle, AlertCircle, FileText, ArrowLeft, MoreVertical, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PaymentPanel } from "@/components/PaymentPanel";

// Mock Deal Data
const DEAL = {
  id: "d1",
  status: "verification", // verification, completed
  item: {
    title: "iPhone 15 Pro Max",
    price: 950,
    image: "/iphone.jpg"
  },
  buyer: { name: "Alex M.", id: "u1" },
  seller: { name: "Sarah K.", id: "u2" },
  createdAt: "2026-05-02T10:00:00Z"
};

const MESSAGES = [
  { id: 1, senderId: "u2", text: "Hi Alex! Thanks for accepting my offer.", time: "10:05 AM" },
  { id: 2, senderId: "u1", text: "Hey Sarah, glad we could make a deal. When are you free to meet?", time: "10:06 AM" },
  { id: 3, senderId: "u2", text: "I can do tomorrow afternoon around 2pm at Central Park?", time: "10:07 AM" },
];

export default function DealRoomPage() {
  const params = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState(MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [dealStatus, setDealStatus] = useState(DEAL.status);
  
  // Demo State
  const [viewMode, setViewMode] = useState<"buyer" | "seller">("buyer");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      id: messages.length + 1,
      senderId: viewMode === "buyer" ? "u1" : "u2",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, msg]);
    setNewMessage("");
  };

  const handleCompleteDeal = () => {
      setDealStatus("completed");
      toast.success("Deal marked as completed!");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />

      {/* Demo Controls */}
      <div className="bg-zinc-900 border-b border-zinc-800 py-2 px-4 flex justify-center items-center gap-4">
        <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Demo Mode</span>
        <div className="flex bg-black rounded-lg p-1 border border-zinc-800">
            <button 
                onClick={() => setViewMode("buyer")}
                className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    viewMode === "buyer" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"
                )}
            >
                View as Buyer
            </button>
            <button 
                onClick={() => setViewMode("seller")}
                className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    viewMode === "seller" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"
                )}
            >
                View as Seller
            </button>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
        
        {/* Left: Deal Info & Payments */}
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
                        <h3 className="font-semibold text-lg leading-tight">{DEAL.item.title}</h3>
                        <p className="text-2xl font-bold text-white mt-1">${DEAL.item.price}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Active Deal</span>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Panel */}
            {dealStatus !== "completed" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {viewMode === "buyer" ? (
                        <PaymentPanel dealId={DEAL.id} amount={DEAL.item.price} isBuyer={true} />
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
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Buyer is arranging payment via Escrow.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            <div className="space-y-6 pl-2 relative border-l border-zinc-800 ml-4 py-2">
                {/* Timeline Steps */}
                <div className="relative pl-6">
                    <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-black" />
                    <h4 className="text-sm font-medium text-white">Offer Accepted</h4>
                    <p className="text-xs text-zinc-500 mt-1">May 2, 10:00 AM</p>
                </div>
                
                <div className="relative pl-6">
                    <div className={cn(
                        "absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-black",
                        dealStatus === "verification" || dealStatus === "completed" ? "bg-indigo-500" : "bg-zinc-700"
                    )} />
                    <h4 className={cn("text-sm font-medium", dealStatus === "verification" ? "text-indigo-400" : "text-zinc-400")}>
                        Verification & Chat
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                        Discuss details and verify terms.
                    </p>
                </div>

                <div className="relative pl-6">
                     <div className={cn(
                        "absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-black",
                        dealStatus === "completed" ? "bg-emerald-500" : "bg-zinc-700"
                    )} />
                    <h4 className={cn("text-sm font-medium", dealStatus === "completed" ? "text-emerald-400" : "text-zinc-400")}>
                        Completed
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                        Deal finalized and item received.
                    </p>
                </div>
            </div>

            {dealStatus !== "completed" && (
                <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleCompleteDeal}
                >
                    Mark as Completed
                </Button>
            )}
        </div>

        {/* Center/Right: Chat */}
        <div className="lg:col-span-3 flex flex-col h-full bg-zinc-900/20 border border-zinc-800 rounded-xl overflow-hidden relative">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {viewMode === "buyer" ? DEAL.seller.name[0] : DEAL.buyer.name[0]}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">
                            {viewMode === "buyer" ? DEAL.seller.name : DEAL.buyer.name}
                        </h3>
                        <p className="text-xs text-emerald-400 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-zinc-400">
                    <MoreVertical className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/50">
                {messages.map((msg) => {
                    const isMe = (viewMode === "buyer" && msg.senderId === "u1") || (viewMode === "seller" && msg.senderId === "u2");
                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={cn(
                                "flex w-full",
                                isMe ? "justify-end" : "justify-start"
                            )}
                        >
                            <div className={cn(
                                "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                                isMe 
                                    ? "bg-blue-600 text-white rounded-br-none" 
                                    : "bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700"
                            )}>
                                <p>{msg.text}</p>
                                <p className={cn(
                                    "text-[10px] mt-1 text-right opacity-70",
                                    isMe ? "text-blue-100" : "text-zinc-400"
                                )}>
                                    {msg.time}
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
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        className={cn(
                            "rounded-full h-11 w-11 transition-all duration-200",
                            newMessage.trim() ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-zinc-800 text-zinc-500"
                        )}
                        disabled={!newMessage.trim()}
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
