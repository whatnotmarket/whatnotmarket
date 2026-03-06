"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Clock, DollarSign, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/Navbar";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { Container } from "@/components/ui/primitives/container";
import { Card } from "@/components/ui/primitives/card";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { createClient } from "@/lib/supabase";

type RequestRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  location: string | null;
  condition: string | null;
  created_by: string;
  created_at: string;
  status: "open" | "accepted" | "closed";
};

type OfferRow = {
  id: string;
  price: number;
  message: string | null;
  created_by: string;
  created_at: string;
  status: "pending" | "accepted" | "rejected";
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
};

type OfferView = OfferRow & {
  sellerName: string;
};

const DEMO_REQUEST = {
  id: "demo",
  title: "Demo Request",
  budgetLabel: "$900 - $1000",
  location: "New York, NY",
  time: "just now",
  category: "Electronics",
  description:
    "This route id is not a UUID. Open a real request row from Supabase to enable live offers and acceptance flow.",
  condition: "Any",
  ownerName: "Demo User",
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function formatBudget(min: number | null, max: number | null) {
  if (min === null && max === null) return "Budget not specified";
  if (min !== null && max !== null) return `$${min} - $${max}`;
  if (min !== null) return `From $${min}`;
  return `Up to $${max}`;
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const requestId = String(params.id || "");
  const isRealRequestId = isUuid(requestId);

  const [isLoading, setIsLoading] = useState(true);
  const [requestRow, setRequestRow] = useState<RequestRow | null>(null);
  const [requestOwnerName, setRequestOwnerName] = useState("Unknown");
  const [offers, setOffers] = useState<OfferView[]>([]);
  const [dealByOfferId, setDealByOfferId] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadRequestData() {
      if (!isRealRequestId) {
        if (!active) return;
        setRequestRow(null);
        setOffers([]);
        setDealByOfferId({});
        setCurrentUserId(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (active) {
        setCurrentUserId(user?.id || null);
      }

      const { data: reqData, error: reqError } = await supabase
        .from("requests")
        .select("id,title,description,category,budget_min,budget_max,location,condition,created_by,created_at,status")
        .eq("id", requestId)
        .single();

      if (reqError || !reqData) {
        if (active) {
          toast.error("Request not found");
          setRequestRow(null);
          setOffers([]);
          setDealByOfferId({});
          setIsLoading(false);
        }
        return;
      }

      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("id,full_name,username")
        .eq("id", reqData.created_by)
        .maybeSingle<ProfileRow>();

      const ownerName = ownerProfile?.full_name || ownerProfile?.username || "Unknown";

      const { data: offerRows } = await supabase
        .from("offers")
        .select("id,price,message,created_by,created_at,status")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });

      const offersList = (offerRows || []) as OfferRow[];
      const offerUserIds = Array.from(new Set(offersList.map((offer) => offer.created_by)));

      let sellerNameById: Record<string, string> = {};
      if (offerUserIds.length > 0) {
        const { data: offerProfiles } = await supabase
          .from("profiles")
          .select("id,full_name,username")
          .in("id", offerUserIds);

        sellerNameById = (offerProfiles || []).reduce<Record<string, string>>((acc, row) => {
          acc[row.id] = row.full_name || row.username || "Unknown";
          return acc;
        }, {});
      }

      const { data: dealRows } = await supabase
        .from("deals")
        .select("id,offer_id")
        .eq("request_id", requestId);

      const dealsMap = (dealRows || []).reduce<Record<string, string>>((acc, row) => {
        acc[row.offer_id] = row.id;
        return acc;
      }, {});

      if (!active) return;

      setRequestRow(reqData as RequestRow);
      setRequestOwnerName(ownerName);
      setOffers(
        offersList.map((offer) => ({
          ...offer,
          sellerName: sellerNameById[offer.created_by] || "Unknown",
        }))
      );
      setDealByOfferId(dealsMap);
      setIsLoading(false);
    }

    loadRequestData();

    return () => {
      active = false;
    };
  }, [isRealRequestId, requestId, reloadToken, supabase]);

  const isRequestOwner = !!currentUserId && !!requestRow && requestRow.created_by === currentUserId;

  const handleMakeOffer = async () => {
    if (!isRealRequestId || !requestRow) {
      toast.error("Open a real request to send offers");
      return;
    }

    const numericPrice = Number(offerPrice);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error("Enter a valid offer price");
      return;
    }

    setIsSubmittingOffer(true);

    try {
      const res = await fetch("/api/offers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestRow.id,
          price: numericPrice,
          message: offerMessage,
        }),
      });

      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        toast.error(payload.error || "Failed to send offer");
        return;
      }

      toast.success("Offer sent to seller");
      setIsOfferModalOpen(false);
      setOfferPrice("");
      setOfferMessage("");
      setReloadToken((value) => value + 1);
    } catch (error) {
      console.error(error);
      toast.error("Unexpected error while sending offer");
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    setAcceptingOfferId(offerId);

    try {
      const res = await fetch("/api/offers/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      const payload = await res.json();
      if (!res.ok || !payload.ok || !payload.dealId) {
        toast.error(payload.error || "Failed to accept offer");
        return;
      }

      toast.success("Offer accepted. Opening deal room...");
      router.push(`/deals/${payload.dealId}`);
    } catch (error) {
      console.error(error);
      toast.error("Unexpected error while accepting offer");
    } finally {
      setAcceptingOfferId(null);
    }
  };

  const requestTitle = requestRow?.title || DEMO_REQUEST.title;
  const requestCategory = requestRow?.category || DEMO_REQUEST.category;
  const requestCondition = requestRow?.condition || DEMO_REQUEST.condition;
  const requestDescription = requestRow?.description || DEMO_REQUEST.description;
  const requestLocation = requestRow?.location || DEMO_REQUEST.location;
  const requestTime = requestRow ? new Date(requestRow.created_at).toLocaleString() : DEMO_REQUEST.time;
  const requestBudget = requestRow
    ? formatBudget(requestRow.budget_min, requestRow.budget_max)
    : DEMO_REQUEST.budgetLabel;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-zinc-900/30 to-transparent opacity-50 blur-[100px]" />
      </div>

      <main className="relative z-10 py-8 space-y-8">
        <Container>
          <Button
            variant="ghost"
            className="pl-0 hover:bg-transparent hover:text-zinc-300 text-zinc-500 transition-colors -ml-2 mb-8"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Market
          </Button>

          {!isRealRequestId && (
            <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
              Demo request id detected. To enable real offers + seller acceptance + realtime chat, open a request with UUID id.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
            <div className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-[#1C1C1E] text-zinc-300 text-xs font-bold border border-white/10">
                      {requestCategory}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#1C1C1E] text-zinc-300 text-xs font-bold border border-white/10">
                      {requestCondition || "Any"}
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">{requestTitle}</h1>

                  <div className="flex flex-wrap items-center gap-6 text-zinc-400 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold text-lg">{requestBudget}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-zinc-500" />
                      <span>{requestLocation || "No location"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-zinc-500" />
                      <span>{requestTime}</span>
                    </div>
                  </div>
                </div>

                <Card radius={24} smoothing={1} border="default" padding="lg" innerClassName="bg-[#1C1C1E]">
                  <h3 className="text-lg font-bold text-white mb-4">Description</h3>
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-line text-sm md:text-base">{requestDescription}</p>
                </Card>
              </motion.div>

              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">Offers</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-bold border border-white/5">
                    {offers.length}
                  </span>
                </div>

                {isLoading && <p className="text-zinc-500">Loading offers...</p>}

                <div className="space-y-4">
                  {!isLoading && offers.length === 0 && <p className="text-zinc-500">No offers yet.</p>}

                  {offers.map((offer, i) => {
                    const dealId = dealByOfferId[offer.id];
                    const canAccept = isRequestOwner && offer.status === "pending";

                    return (
                      <motion.div
                        key={offer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
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
                              <span className="text-zinc-500 text-xs font-medium">{new Date(offer.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-zinc-300 text-sm leading-relaxed max-w-lg">{offer.message || "No message"}</p>
                            <div className="flex items-center gap-2 pt-1">
                              <div className="h-5 w-5 rounded-full bg-white/10 border border-white/5" />
                              <span className="text-xs text-zinc-400 font-bold">{offer.sellerName}</span>
                              <span className="text-xs uppercase text-zinc-500">{offer.status}</span>
                            </div>
                          </div>

                          <div className="flex gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                            <Button
                              variant="outline"
                              className="flex-1 sm:flex-none border-white/10 bg-transparent text-zinc-300 hover:text-white hover:bg-white/5 font-bold h-10 px-6 rounded-xl"
                              onClick={() => (dealId ? router.push(`/deals/${dealId}`) : undefined)}
                              disabled={!dealId}
                            >
                              {dealId ? "Open Chat" : "Chat after accept"}
                            </Button>

                            {canAccept && (
                              <Button
                                className="flex-1 sm:flex-none bg-white text-black hover:bg-zinc-200 font-bold h-10 px-6 rounded-xl"
                                onClick={() => handleAcceptOffer(offer.id)}
                                disabled={acceptingOfferId === offer.id}
                              >
                                {acceptingOfferId === offer.id ? "Accepting..." : "Accept"}
                              </Button>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24">
              <Card radius={24} smoothing={1} border="default" padding="md" innerClassName="bg-[#1C1C1E] space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Interested?</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">Submit an offer to {requestOwnerName}. The chat opens only after seller acceptance.</p>
                </div>
                <Button
                  onClick={() => setIsOfferModalOpen(true)}
                  className="w-full h-12 text-base font-bold bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-xl shadow-lg shadow-purple-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={!isRealRequestId || isRequestOwner}
                >
                  {isRequestOwner ? "You are the seller" : "Make an Offer"}
                </Button>
              </Card>

              <Card radius={20} smoothing={1} border="subtle" padding="md" innerClassName="bg-[#161618] space-y-4">
                <div className="flex items-center gap-2 text-zinc-300">
                  <ShieldCheck className="w-4 h-4" />
                  <h4 className="font-bold text-sm">Safety Tips</h4>
                </div>
                <ul className="text-xs text-zinc-500 space-y-3 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                    Chat activates only after accepted offer
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                    Use escrow for payment confirmation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                    Keep all deal communication inside the platform
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </Container>
      </main>

      <Modal isOpen={isOfferModalOpen} onClose={() => setIsOfferModalOpen(false)} title="Make an Offer">
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
              placeholder="Describe terms, delivery time, and notes"
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
            <Button onClick={handleMakeOffer} className="bg-white text-black hover:bg-zinc-200 font-bold px-6" disabled={isSubmittingOffer}>
              {isSubmittingOffer ? "Sending..." : "Send Offer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

