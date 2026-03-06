"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Clock, DollarSign, ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/Navbar";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { Container } from "@/components/ui/primitives/container";
import { Section } from "@/components/ui/primitives/section";
import { Card } from "@/components/ui/primitives/card";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";

// Mock Data
const REQUEST = {
  id: "1",
  title: "iPhone 15 Pro Max 256GB Natural Titanium",
  budget: "$900 - $1000",
  location: "New York, NY",
  time: "2h ago",
  category: "Electronics",
  description: "Looking for a mint condition iPhone 15 Pro Max. Must have original box and receipt. Battery health > 95%. Prefer local meetup in Manhattan.",
  condition: "Used (Like New)",
  user: {
    name: "Alex M.",
    avatar: "/avatars/alex.jpg",
    rating: 4.9
  }
};

const OFFERS = [
  {
    id: "o1",
    price: 950,
    message: "I have one in perfect condition, 98% battery health. Can meet tomorrow.",
    seller: { name: "Sarah K.", rating: 5.0 },
    time: "1h ago"
  },
  {
    id: "o2",
    price: 980,
    message: "Brand new sealed in box. Unwanted gift.",
    seller: { name: "Mike T.", rating: 4.8 },
    time: "30m ago"
  }
];

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  const handleMakeOffer = () => {
    toast.success("Offer sent to buyer!");
    setIsOfferModalOpen(false);
  };

  const handleAcceptOffer = (offerId: string) => {
    toast.success("Offer accepted! Creating deal room...");
    setTimeout(() => {
        router.push(`/deals/${offerId}`); 
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-zinc-900/30 to-transparent opacity-50 blur-[100px]" />
      </div>

      <main className="relative z-10 py-8 space-y-8">
        <Container>
        {/* Back Button */}
        <Button 
            variant="ghost" 
            className="pl-0 hover:bg-transparent hover:text-zinc-300 text-zinc-500 transition-colors -ml-2 mb-8"
            onClick={() => router.back()}
        >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Market
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
            {/* Left Column: Request Details & Offers */}
            <div className="space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Header Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-[#1C1C1E] text-zinc-300 text-xs font-bold border border-white/10">
                                {REQUEST.category}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-[#1C1C1E] text-zinc-300 text-xs font-bold border border-white/10">
                                {REQUEST.condition}
                            </span>
                        </div>
                        
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
                            {REQUEST.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-zinc-400 text-sm">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-400" />
                                <span className="text-emerald-400 font-bold text-lg">{REQUEST.budget}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-zinc-500" />
                                <span>{REQUEST.location}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-zinc-500" />
                                <span>{REQUEST.time}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description Box */}
                    <Card
                        radius={24}
                        smoothing={1}
                        border="default"
                        padding="lg"
                        innerClassName="bg-[#1C1C1E]"
                    >
                        <h3 className="text-lg font-bold text-white mb-4">Description</h3>
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
                            {REQUEST.description}
                        </p>
                    </Card>
                </motion.div>

                {/* Offers List */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-white">Offers</h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-bold border border-white/5">
                            {OFFERS.length}
                        </span>
                    </div>
                    
                    <div className="space-y-4">
                        {OFFERS.map((offer, i) => (
                            <motion.div
                                key={offer.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + (i * 0.1) }}
                            >
                                <Card
                                    radius={20}
                                    smoothing={1}
                                    border="subtle"
                                    padding="md"
                                    innerClassName="bg-[#1C1C1E] flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center group hover:bg-[#222224] transition-colors"
                                    className="hover:stroke-white/10"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-baseline gap-3">
                                            <span className="font-bold text-xl text-white">${offer.price}</span>
                                            <span className="text-zinc-500 text-xs font-medium">• {offer.time}</span>
                                        </div>
                                        <p className="text-zinc-300 text-sm leading-relaxed max-w-lg">{offer.message}</p>
                                        <div className="flex items-center gap-2 pt-1">
                                            <div className="h-5 w-5 rounded-full bg-white/10 border border-white/5" />
                                            <span className="text-xs text-zinc-400 font-bold">{offer.seller.name}</span>
                                            <span className="text-xs text-yellow-500 font-bold flex items-center gap-0.5">
                                                ★ {offer.seller.rating}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                        <Button 
                                            variant="outline" 
                                            className="flex-1 sm:flex-none border-white/10 bg-transparent text-zinc-300 hover:text-white hover:bg-white/5 font-bold h-10 px-6 rounded-xl"
                                        >
                                            Chat
                                        </Button>
                                        <Button 
                                            className="flex-1 sm:flex-none bg-white text-black hover:bg-zinc-200 font-bold h-10 px-6 rounded-xl"
                                            onClick={() => handleAcceptOffer(offer.id)}
                                        >
                                            Accept
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Sidebar */}
            <div className="space-y-6 lg:sticky lg:top-24">
                <Card
                    radius={24}
                    smoothing={1}
                    border="default"
                    padding="md"
                    innerClassName="bg-[#1C1C1E] space-y-6"
                >
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-white">Interested?</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Submit an offer to {REQUEST.user.name}. You can negotiate price and terms.
                        </p>
                    </div>
                    <Button 
                        onClick={() => setIsOfferModalOpen(true)}
                        className="w-full h-12 text-base font-bold bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-xl shadow-lg shadow-purple-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Make an Offer
                    </Button>
                </Card>
                
                <Card
                    radius={20}
                    smoothing={1}
                    border="subtle"
                    padding="md"
                    innerClassName="bg-[#161618] space-y-4"
                >
                    <div className="flex items-center gap-2 text-zinc-300">
                        <ShieldCheck className="w-4 h-4" />
                        <h4 className="font-bold text-sm">Safety Tips</h4>
                    </div>
                    <ul className="text-xs text-zinc-500 space-y-3 leading-relaxed">
                        <li className="flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                            Only pay through Whatnot Market escrow
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                            Meet in public places for local pickups
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                            Verify item condition before accepting
                        </li>
                    </ul>
                </Card>
            </div>
        </div>
        </Container>
      </main>

      {/* Make Offer Modal */}
      <Modal 
        isOpen={isOfferModalOpen} 
        onClose={() => setIsOfferModalOpen(false)}
        title="Make an Offer"
      >
        <div className="space-y-6 pt-2">
            <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-300">Your Price ($)</label>
                <Input 
                    type="number" 
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="e.g. 950"
                    inputSize="lg"
                    autoFocus
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-300">Message</label>
                <Textarea 
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    placeholder="Describe condition, availability, etc."
                    className="min-h-[120px]"
                />
            </div>
            <div className="pt-2 flex justify-end gap-3">
                <Button 
                    variant="ghost" 
                    onClick={() => setIsOfferModalOpen(false)}
                    className="text-zinc-400 hover:text-white hover:bg-white/5 font-bold"
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleMakeOffer} 
                    className="bg-white text-black hover:bg-zinc-200 font-bold px-6"
                >
                    Send Offer
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
