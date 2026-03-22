"use client";

import { useState } from "react";
import { DealLayout, DealMainColumn, DealSideColumn } from "@/components/features/deal/DealLayout";
import { DealHeader } from "@/components/features/deal/DealHeader";
import { DealSummaryCard } from "@/components/features/deal/DealSummaryCard";
import { DealUserCard } from "@/components/features/deal/DealUserCard";
import { DealTimeline, TimelineEvent } from "@/components/features/deal/DealTimeline";
import { DealChatPanel } from "@/components/features/deal/DealChatPanel";
import { OfferModal } from "@/components/features/deal/OfferModal";
import { ConfirmationModal } from "@/components/shared/ui/ConfirmationModal";
import { DealStatus } from "@/components/features/deal/DealStatusBadge";

// Mock Data
const INITIAL_DEAL = {
  id: "DL-9382-XA",
  title: "MacBook Pro 16\" M3 Max - 36GB RAM / 1TB SSD - Space Black",
  price: 3500, // Listing price
  image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  description: "Brand new condition, only 3 battery cycles. Includes original box, charger, and receipt from Apple Store. AppleCare+ valid until 2026. Selling because I need a Windows machine for work.",
  location: "San Francisco, CA",
  postedDate: "2 days ago",
  category: "Electronics",
  seller: {
    name: "Alice Cooper",
    avatar: "https://ui-avatars.com/api/?name=Alice+Cooper&background=random",
    rating: 4.9,
    reviews: 42,
    role: "seller" as const,
    joined: "2023",
    location: "San Francisco, CA"
  },
  initialTimeline: [
    { id: "1", title: "Deal Created", date: "Oct 24, 10:00 AM", status: "completed" as const, description: "You started this deal" },
    { id: "2", title: "Offer Sent", date: "Pending", status: "current" as const, description: "Send an offer to start negotiation" },
    { id: "3", title: "Offer Accepted", date: "Upcoming", status: "upcoming" as const },
    { id: "4", title: "Payment Required", date: "Upcoming", status: "upcoming" as const },
    { id: "5", title: "Shipping", date: "Upcoming", status: "upcoming" as const },
    { id: "6", title: "Delivery & Inspection", date: "Upcoming", status: "upcoming" as const },
    { id: "7", title: "Completed", date: "Upcoming", status: "upcoming" as const },
  ] as TimelineEvent[],
  initialMessages: [
    { id: "1", text: "Hi Alice, is this still available?", sender: "me" as const, time: "10:00 AM" },
    { id: "2", text: "Yes it is! I just listed it.", sender: "them" as const, time: "10:02 AM" },
  ]
};

export default function BuyerDealPage() {
  const [status, setStatus] = useState<DealStatus>("deal_created");
  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_DEAL.initialTimeline);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_DEAL.initialMessages);

  const handleSendOffer = (amount: number, message: string) => {
    // Update status
    setStatus("offer_sent");
    
    // Update timeline
    const newTimeline = timeline.map(event => {
      if (event.title === "Offer Sent") {
        return { 
          ...event, 
          status: "completed" as const, 
          date: "Just now", 
          description: `You offered $${amount.toLocaleString()}` 
        };
      }
      if (event.title === "Offer Accepted") {
        return { ...event, status: "current" as const, date: "Pending" };
      }
      return event;
    });
    setTimeline(newTimeline);

    // Add message if provided
    if (message) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        text: `OFFER SENT: $${amount.toLocaleString()}\n\n${message}`, 
        sender: "me", 
        time: "Just now" 
      }]);
    } else {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        text: `OFFER SENT: $${amount.toLocaleString()}`, 
        sender: "me", 
        time: "Just now" 
      }]);
    }
  };

  const handleModalClose = () => {
    setIsOfferModalOpen(false);
  };

  const handleSendMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      sender: "me",
      time: "Just now"
    }]);
  };

  const handleCancel = () => {
    setIsCancelModalOpen(true);
  };

  const confirmCancel = () => {
    setStatus("deal_created");
    setTimeline(INITIAL_DEAL.initialTimeline);
    // Reset messages to initial state (optional, but clean for demo)
    setMessages(INITIAL_DEAL.initialMessages);
  };

  return (
    <>
      <DealLayout
        header={<DealHeader status={status} dealId={INITIAL_DEAL.id} />}
      >
        <DealMainColumn>
          {/* Deal Summary */}
          <DealSummaryCard
            title={INITIAL_DEAL.title}
            price={INITIAL_DEAL.price}
            image={INITIAL_DEAL.image}
            description={INITIAL_DEAL.description}
            location={INITIAL_DEAL.location}
            postedDate={INITIAL_DEAL.postedDate}
            category={INITIAL_DEAL.category}
          />

          {/* Timeline */}
          <DealTimeline events={timeline} />
        </DealMainColumn>

        <DealSideColumn>
          {/* Seller Profile & Actions */}
          <DealUserCard 
            user={INITIAL_DEAL.seller}
            
            // Actions based on status
            onSendOffer={status === "deal_created" ? () => setIsOfferModalOpen(true) : undefined}
            
            // Offer Sent State
            actionMessage={status === "offer_sent" ? "Waiting for seller response" : undefined}
            onEditOffer={status === "offer_sent" ? () => setIsOfferModalOpen(true) : undefined}
            onCancel={status === "offer_sent" ? handleCancel : undefined}
            cancelLabel={status === "offer_sent" ? "Cancel Offer" : "Cancel Deal"}
            
            // Shared Actions
            onMessage={() => console.log("Message clicked")}
          />

          {/* Chat Panel */}
          <DealChatPanel 
            initialMessages={messages} 
            recipientName={INITIAL_DEAL.seller.name}
            onSendMessage={handleSendMessage}
            className="h-[600px]"
          />
        </DealSideColumn>
      </DealLayout>

      <OfferModal 
        isOpen={isOfferModalOpen}
        onClose={handleModalClose}
        listingPrice={INITIAL_DEAL.price}
        onSendOffer={handleSendOffer}
      />

      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancel}
        title="Cancel Offer?"
        description="Are you sure you want to cancel your offer? This action cannot be undone."
        confirmLabel="Yes, Cancel Offer"
        cancelLabel="No, Keep Offer"
        isDestructive={true}
      />
    </>
  );
}

