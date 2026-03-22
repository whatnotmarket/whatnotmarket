"use client";

import { DealChatPanel } from "@/components/features/deal/DealChatPanel";
import { DealHeader } from "@/components/features/deal/DealHeader";
import { DealLayout,DealMainColumn,DealSideColumn } from "@/components/features/deal/DealLayout";
import { DealSummaryCard } from "@/components/features/deal/DealSummaryCard";
import { DealTimeline } from "@/components/features/deal/DealTimeline";
import { DealUserCard } from "@/components/features/deal/DealUserCard";

// Mock Data for Seller View
const MOCK_DEAL = {
  id: "DL-9382-XA",
  title: "MacBook Pro 16\" M3 Max - 36GB RAM / 1TB SSD - Space Black",
  price: 3200,
  image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  description: "Brand new condition, only 3 battery cycles. Includes original box, charger, and receipt from Apple Store. AppleCare+ valid until 2026.",
  location: "San Francisco, CA",
  postedDate: "2 days ago",
  category: "Electronics",
  status: "offer_received" as const, // Changed status to demonstrate action buttons
  buyer: {
    name: "John Doe",
    avatar: "https://ui-avatars.com/api/?name=John+Doe&background=random",
    rating: 5.0,
    reviews: 12,
    role: "buyer" as const,
    location: "New York, NY",
    joined: "2024"
  },
  timeline: [
    { id: "1", title: "Deal Created", date: "Oct 24, 10:00 AM", status: "completed" as const, description: "Listing created" },
    { id: "2", title: "Offer Received", date: "Oct 24, 10:05 AM", status: "current" as const, description: "John offered $3,200" },
    { id: "3", title: "Offer Negotiation", date: "Upcoming", status: "upcoming" as const },
    { id: "4", title: "Offer Accepted", date: "Upcoming", status: "upcoming" as const },
    { id: "5", title: "Awaiting Payment", date: "Upcoming", status: "upcoming" as const },
    { id: "6", title: "Shipped", date: "Upcoming", status: "upcoming" as const },
    { id: "7", title: "Delivery", date: "Upcoming", status: "upcoming" as const },
    { id: "8", title: "Completed", date: "Upcoming", status: "upcoming" as const },
  ],
  messages: [
    { id: "1", text: "Hi, is this still available?", sender: "them" as const, time: "10:00 AM" },
    { id: "2", text: "Yes it is!", sender: "me" as const, time: "10:02 AM" },
    { id: "3", text: "Would you accept $3200?", sender: "them" as const, time: "10:04 AM" },
  ]
};

export default function SellerDealPage() {
  const handleAccept = () => console.log("Accept Offer");
  const handleCounter = () => console.log("Counter Offer");
  const handleMessage = () => console.log("Send message");
  const handleCancel = () => console.log("Cancel deal");

  return (
    <DealLayout
      header={<DealHeader status={MOCK_DEAL.status} dealId={MOCK_DEAL.id} />}
    >
      <DealMainColumn>
        {/* Deal Summary */}
        <DealSummaryCard
          title={MOCK_DEAL.title}
          price={MOCK_DEAL.price}
          image={MOCK_DEAL.image}
          description={MOCK_DEAL.description}
          location={MOCK_DEAL.location}
          postedDate={MOCK_DEAL.postedDate}
          category={MOCK_DEAL.category}
        />

        {/* Timeline */}
        <DealTimeline events={MOCK_DEAL.timeline} />
      </DealMainColumn>

      <DealSideColumn>
        {/* Buyer Profile & Actions */}
        <DealUserCard 
            user={MOCK_DEAL.buyer}
            onAcceptOffer={handleAccept}
            onCounterOffer={handleCounter}
            onMessage={handleMessage}
            onCancel={handleCancel}
        />

        {/* Chat Panel */}
        <DealChatPanel 
            initialMessages={MOCK_DEAL.messages} 
            recipientName={MOCK_DEAL.buyer.name}
            className="h-[600px]"
        />
      </DealSideColumn>
    </DealLayout>
  );
}

