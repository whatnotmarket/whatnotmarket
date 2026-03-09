"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Calendar,
  TrendingUp,
  Clock,
  Package,
  Camera,
  Move,
  MessageSquare,
  Ban,
  Flag,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { profileToast as toast } from "@/lib/notifications";
import { createClient } from "@/lib/supabase";

const MOCK_LISTINGS = [
  { id: 1, title: "Netflix 4K UHD Lifetime", price: 15.0, image: "NFX", sold: 120 },
  { id: 2, title: "Spotify Premium Upgrade", price: 8.5, image: "SPF", sold: 450 },
  { id: 3, title: "NordVPN 2 Year Account", price: 12.0, image: "VPN", sold: 85 },
];

type EditableImageType = "avatar" | "banner";

type StoredProfile = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  created_at: string | null;
  role_preference: "buyer" | "seller" | "both" | null;
  telegram_handle: string | null;
  twitter_handle: string | null;
  website: string | null;
};

type ProfileState = {
  name: string;
  handle: string;
  avatar: string;
  banner: string;
  level: number;
  memberSince: string;
  followers: number;
  following: number;
  description: string;
  telegram?: string;
  twitter?: string;
  website?: string;
  isOnline: boolean;
  successfulDeliveries: number;
  sellerRanking: string;
  sellerProtection: string;
  avgResponseTime: string;
  buyerRanking: string;
  buyerProtection: string;
  totalPurchases: number;
  totalOffers: number;
  bannerPosition: number;
  deliveryRate: number;
  totalLifetimeOrders: number;
  last30DaysScore: number;
};

type PurchaseItem = {
  id: string;
  title: string;
  price: number;
  purchasedAt: string;
};

type OfferItem = {
  id: string;
  title: string;
  price: number;
  status: string;
  createdAt: string;
};

type DealSummaryRow = {
  id: string;
  request_id: string;
  offer_id: string;
  created_at: string;
};

type ProfileClientProps = {
  targetProfileId?: string | null;
  targetHandle?: string | null;
  routeRole?: "buyer" | "seller" | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeHandle(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._-]/g, "");
}

function toDisplayHandle(raw: string | null | undefined) {
  const clean = normalizeHandle(raw || "");
  return clean ? `@${clean}` : "@";
}

function formatMemberSince(createdAt: string | null | undefined) {
  if (!createdAt) return "Just joined";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Just joined";
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
}

function getBuyerRanking(totalPurchases: number) {
  if (totalPurchases >= 20) return "Elite Buyer";
  if (totalPurchases >= 5) return "Trusted Buyer";
  if (totalPurchases >= 1) return "Active Buyer";
  return "Rookie Buyer";
}

function getSellerRanking(totalSales: number) {
  if (totalSales >= 20) return "Elite Seller";
  if (totalSales >= 5) return "Trusted Seller";
  if (totalSales >= 1) return "Active Seller";
  return "Rookie Seller";
}

function getRoleDefaults(isSeller: boolean) {
  return {
    name: isSeller ? "Seller" : "Buyer",
    handle: "@",
    avatar: isSeller
      ? "https://ui-avatars.com/api/?name=Seller&background=10b981&color=fff"
      : "https://ui-avatars.com/api/?name=Buyer&background=3b82f6&color=fff",
    banner: "/framehero.svg",
  };
}

function getBaseProfile(isSeller: boolean): ProfileState {
  const defaults = getRoleDefaults(isSeller);
  return {
    ...defaults,
    level: 1,
    memberSince: "Just joined",
    followers: 0,
    following: 0,
    description: "",
    isOnline: true,
    successfulDeliveries: 0,
    sellerRanking: "Rookie Seller",
    sellerProtection: "Base Coverage",
    avgResponseTime: "-",
    buyerRanking: "Rookie Buyer",
    buyerProtection: "Base Protection",
    totalPurchases: 0,
    totalOffers: 0,
    bannerPosition: 50,
    deliveryRate: 100,
    totalLifetimeOrders: 0,
    last30DaysScore: 100,
  };
}

function FounderMark() {
  return (
    <span className="group/founder relative inline-flex items-center pointer-events-auto">
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M21.007 8.27C22.194 9.125 23 10.45 23 12c0 1.55-.806 2.876-1.993 3.73.24 1.442-.134 2.958-1.227 4.05-1.095 1.095-2.61 1.459-4.046 1.225C14.883 22.196 13.546 23 12 23c-1.55 0-2.878-.807-3.731-1.996-1.438.235-2.954-.128-4.05-1.224-1.095-1.095-1.459-2.611-1.217-4.05C1.816 14.877 1 13.551 1 12s.816-2.878 2.002-3.73c-.242-1.439.122-2.955 1.218-4.05 1.093-1.094 2.61-1.467 4.057-1.227C9.125 1.804 10.453 1 12 1c1.545 0 2.88.803 3.732 1.993 1.442-.24 2.956.135 4.048 1.227 1.093 1.092 1.468 2.608 1.227 4.05Zm-4.426-.084a1 1 0 0 1 .233 1.395l-5 7a1 1 0 0 1-1.521.126l-3-3a1 1 0 0 1 1.414-1.414l2.165 2.165 4.314-6.04a1 1 0 0 1 1.395-.232Z"
          fill="#ffffff"
        />
      </svg>
      <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[9999] -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover/founder:opacity-100">
        Founder of WhatnotMarket
      </span>
    </span>
  );
}

function ProfileEditPencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0" />
      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
      <g id="SVGRepo_iconCarrier">
        <path
          d="M11 4H7.2C6.0799 4 5.51984 4 5.09202 4.21799C4.71569 4.40974 4.40973 4.7157 4.21799 5.09202C4 5.51985 4 6.0799 4 7.2V16.8C4 17.9201 4 18.4802 4.21799 18.908C4.40973 19.2843 4.71569 19.5903 5.09202 19.782C5.51984 20 6.0799 20 7.2 20H16.8C17.9201 20 18.4802 20 18.908 19.782C19.2843 19.5903 19.5903 19.2843 19.782 18.908C20 18.4802 20 17.9201 20 16.8V12.5M15.5 5.5L18.3284 8.32843M10.7627 10.2373L17.411 3.58902C18.192 2.80797 19.4584 2.80797 20.2394 3.58902C21.0205 4.37007 21.0205 5.6364 20.2394 6.41745L13.3774 13.2794C12.6158 14.0411 12.235 14.4219 11.8012 14.7247C11.4162 14.9936 11.0009 15.2162 10.564 15.3882C10.0717 15.582 9.54378 15.6885 8.48793 15.9016L8 16L8.04745 15.6678C8.21536 14.4925 8.29932 13.9048 8.49029 13.3561C8.65975 12.8692 8.89125 12.4063 9.17906 11.9786C9.50341 11.4966 9.92319 11.0768 10.7627 10.2373Z"
          stroke="#ffffff"
          strokeWidth="2.16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function BioText({ text, isWhatnotMarket }: { text: string; isWhatnotMarket: boolean }) {
  if (!text) return "No bio yet.";
  
  if (!isWhatnotMarket) {
    return <>{text}</>;
  }

  // Regex migliorata per supportare domini come whatnotmarket.app anche senza http/www
  const linkRegex = /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
  const parts = text.split(linkRegex);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.match(linkRegex)) {
           let href = part;
           if (!href.startsWith('http')) {
             href = `https://${href}`;
           }
           
           const isWhatnotApp = part.toLowerCase().includes('whatnotmarket.app');
           
           return (
             <a 
               key={i} 
               href={href} 
               target="_blank" 
               rel="noopener noreferrer" 
               className={cn(
                 "hover:underline",
                 isWhatnotApp ? "font-bold text-white" : "text-white"
               )}
               onClick={(e) => e.stopPropagation()}
             >
               {part}
             </a>
           );
        }
        return part;
      })}
    </>
  );
}


export function ProfileClient({
  targetProfileId = null,
  targetHandle = null,
  routeRole = null,
}: ProfileClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { role } = useUser();
  const viewerRole = role === "seller" ? "seller" : "buyer";
  const requestedTargetId = targetProfileId;
  const normalizedTargetHandle = normalizeHandle(targetHandle || "");
  const hasExplicitTarget = Boolean(requestedTargetId || normalizedTargetHandle);
  const validTargetProfileId = targetProfileId && isUuid(targetProfileId) ? targetProfileId : null;
  const initialProfileRole = routeRole || viewerRole;

  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [resolvedTargetId, setResolvedTargetId] = useState<string | null>(validTargetProfileId);
  const [profileRole, setProfileRole] = useState<"buyer" | "seller">(initialProfileRole);
  const [isSaving, setIsSaving] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProfileMissing, setIsProfileMissing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [bannerObjectFit, setBannerObjectFit] = useState<"cover" | "fill">("cover");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [offerItems, setOfferItems] = useState<OfferItem[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    handle: "",
    avatar: "",
    banner: "",
    description: "",
    telegram: "",
    twitter: "",
    website: "",
    bannerPosition: 50,
  });
  const [pendingImages, setPendingImages] = useState<Record<EditableImageType, File | null>>({
    avatar: null,
    banner: null,
  });

  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startPos = useRef(0);

  const [profile, setProfile] = useState<ProfileState | null>(null);
  const isSeller = profile ? (profileRole === "seller") : (initialProfileRole === "seller");
  const isFounderProfile = profile ? (
    normalizeHandle(profile.handle) === "whatnotmarket" ||
    normalizeHandle(profile.name) === "whatnotmarket"
  ) : false;
  const isOwnProfile = !!currentUserId && !!resolvedTargetId && currentUserId === resolvedTargetId;
  const displayBannerSrc = profile ? (isEditing ? editForm.banner || profile.banner : profile.banner) : "/banner-placeholder.jpg";

  useEffect(() => {
    let active = true;
    setIsProfileLoading(true);
    setProfile(null); // Reset profile to ensure loading state shows
    setIsProfileMissing(false);

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      const viewerId = user?.id || null;
      setCurrentUserId(viewerId);

      let targetId = validTargetProfileId;
      let resolvedRole: "buyer" | "seller" = routeRole || viewerRole;

      if (!targetId && normalizedTargetHandle) {
        const findByHandle = async (candidate: string, mode: "eq" | "ilike") => {
          const query = supabase.from("profiles").select("id,role_preference");
          const { data, error } =
            mode === "eq"
              ? await query.eq("username", candidate).maybeSingle()
              : await query.ilike("username", candidate).maybeSingle();

          if (error) {
            console.error(`Handle lookup error (${mode}:${candidate}):`, error);
            return null;
          }
          return data;
        };

        const handleLookup =
          (await findByHandle(normalizedTargetHandle, "eq")) ||
          (await findByHandle(`@${normalizedTargetHandle}`, "eq")) ||
          (await findByHandle(normalizedTargetHandle, "ilike")) ||
          (await findByHandle(`@${normalizedTargetHandle}`, "ilike"));

        if (handleLookup?.id) {
          targetId = handleLookup.id;
        }

        if (!routeRole) {
          const pref = handleLookup?.role_preference;
          resolvedRole = pref === "seller" ? "seller" : "buyer";
        }

        // If the requested handle is the current user's handle, treat it as own profile
        // even when generic handle lookup misses due inconsistent stored formatting.
        if (!targetId && viewerId) {
          const { data: meProfile, error: meProfileError } = await supabase
            .from("profiles")
            .select("id,username,role_preference")
            .eq("id", viewerId)
            .maybeSingle();

          if (meProfileError) {
            console.error("Viewer profile lookup error:", meProfileError);
          }

          if (meProfile && normalizeHandle(meProfile.username) === normalizedTargetHandle) {
            targetId = viewerId;
            if (!routeRole) {
              resolvedRole = meProfile.role_preference === "seller" ? "seller" : "buyer";
            }
          }
        }
      }

      if (!targetId) {
        if (hasExplicitTarget) {
          setProfileRole(resolvedRole);
          setProfile(getBaseProfile(resolvedRole === "seller"));
          setResolvedTargetId(null);
          setPurchaseItems([]);
          setIsFollowing(false);
          setIsProfileMissing(true);
          setIsProfileLoading(false);
          return;
        }
        if (viewerId) {
          targetId = viewerId;
        }
      }

      if (!targetId) {
        setProfileRole(resolvedRole);
        setProfile(getBaseProfile(resolvedRole === "seller"));
        setResolvedTargetId(null);
        setPurchaseItems([]);
        setIsFollowing(false);
        setIsProfileLoading(false);
        return;
      }

      const [
        profileRes,
        followersRes,
        followingRes,
        purchasesCountRes,
        salesCountRes,
        purchaseDealsRes,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name,username,avatar_url,banner_url,bio,created_at,role_preference,telegram_handle,twitter_handle,website")
          .eq("id", targetId)
          .maybeSingle(),
        supabase
          .from("follows")
          .select("following_id", { count: "exact", head: true })
          .eq("following_id", targetId),
        supabase
          .from("follows")
          .select("follower_id", { count: "exact", head: true })
          .eq("follower_id", targetId),
        supabase
          .from("deals")
          .select("id", { count: "exact", head: true })
          .eq("buyer_id", targetId)
          .eq("status", "completed"),
        supabase
          .from("deals")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", targetId)
          .eq("status", "completed"),
        supabase
          .from("deals")
          .select("id,request_id,offer_id,created_at")
          .eq("buyer_id", targetId)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (!active) return;

      if (profileRes.error) {
        console.error("Load profile error:", profileRes.error);
      }

      const dbProfile = (profileRes.data || null) as StoredProfile | null;
      if (!dbProfile && hasExplicitTarget) {
        if (viewerId && targetId === viewerId) {
          setProfileRole(resolvedRole);
          setProfile(getBaseProfile(resolvedRole === "seller"));
          setResolvedTargetId(targetId);
          setPurchaseItems([]);
          setOfferItems([]);
          setIsFollowing(false);
          setIsProfileLoading(false);
          return;
        }

        setProfileRole(resolvedRole);
        setProfile(getBaseProfile(resolvedRole === "seller"));
        setResolvedTargetId(null);
        setPurchaseItems([]);
        setOfferItems([]);
        setIsFollowing(false);
        setIsProfileMissing(true);
        setIsProfileLoading(false);
        return;
      }

      if (!routeRole) {
        resolvedRole = dbProfile?.role_preference === "seller" ? "seller" : resolvedRole;
      }
      setProfileRole(resolvedRole);
      setResolvedTargetId(targetId);

      const defaults = getRoleDefaults(resolvedRole === "seller");
      const followers = followersRes.count || 0;
      const following = followingRes.count || 0;
      const totalPurchases = purchasesCountRes.count || 0;
      const successfulDeliveries = salesCountRes.count || 0;

      const rawDeals = (purchaseDealsRes.data || []) as DealSummaryRow[];
      let purchases: PurchaseItem[] = [];

      if (rawDeals.length > 0) {
        const requestIds = [...new Set(rawDeals.map((row) => row.request_id))];
        const offerIds = [...new Set(rawDeals.map((row) => row.offer_id))];

        const [requestsRes, offersRes] = await Promise.all([
          supabase.from("requests").select("id,title").in("id", requestIds),
          supabase.from("offers").select("id,price").in("id", offerIds),
        ]);

        const requestMap = new Map<string, string>();
        const offerMap = new Map<string, number>();

        (requestsRes.data || []).forEach((row) => {
          requestMap.set(row.id, row.title);
        });

        (offersRes.data || []).forEach((row) => {
          offerMap.set(row.id, Number(row.price || 0));
        });

        purchases = rawDeals.map((row) => ({
          id: row.id,
          title: requestMap.get(row.request_id) || "Purchase",
          price: offerMap.get(row.offer_id) || 0,
          purchasedAt: row.created_at,
        }));
      }

      // Fetch offers if the profile is a seller
      let offers: OfferItem[] = [];
      let totalOffersCount = 0;
      let globalDeliveries = 0;
      
      // If profile is whatnotmarket, fetch ALL completed deals on platform
      let totalLifetimeOrders = 0;
      let deliveryRate = 100;
      let last30DaysScore = 100;
      
      const isWhatnotProfile = toDisplayHandle(dbProfile?.username) === "@whatnotmarket";

      if (isWhatnotProfile) {
         const { count } = await supabase
           .from("deals")
           .select("id", { count: "exact", head: true })
           .eq("status", "completed");
         globalDeliveries = count || 0;
         totalLifetimeOrders = globalDeliveries;
         
         // For Whatnot, assume 100% success rate and score for now
         deliveryRate = 100;
         last30DaysScore = 100;
      } else if (resolvedRole === "seller") {
         // Calculate for normal seller
         // Total Lifetime Orders = Total Completed Deals as seller
         const { count: lifetimeCount } = await supabase
            .from("deals")
            .select("id", { count: "exact", head: true })
            .eq("seller_id", targetId)
            .eq("status", "completed");
         
         totalLifetimeOrders = lifetimeCount || 0;
         
         // Delivery Rate = Completed / (Completed + Cancelled) * 100
         // Or simplified: just base it on completed vs total attempted deals
         const { count: totalDealsCount } = await supabase
            .from("deals")
            .select("id", { count: "exact", head: true })
            .eq("seller_id", targetId)
            .in("status", ["completed", "cancelled"]);
            
         const totalDeals = totalDealsCount || 0;
         if (totalDeals > 0) {
            deliveryRate = Math.round((totalLifetimeOrders / totalDeals) * 100);
         } else {
            deliveryRate = 100; // Default to 100 if no deals yet
         }

         // Last 30 Days Score
         // Based on deals created in last 30 days that are completed
         const thirtyDaysAgo = new Date();
         thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
         
         const { data: last30Deals } = await supabase
            .from("deals")
            .select("status")
            .eq("seller_id", targetId)
            .gte("created_at", thirtyDaysAgo.toISOString())
            .in("status", ["completed", "cancelled"]);
            
         if (last30Deals && last30Deals.length > 0) {
            const completedLast30 = last30Deals.filter(d => d.status === "completed").length;
            last30DaysScore = Math.round((completedLast30 / last30Deals.length) * 100);
         } else {
            last30DaysScore = 100; // Default if no recent activity
         }
      }

      if (resolvedRole === "seller") {
        const { data: offersData, count: offersCount } = await supabase
          .from("offers")
          .select("id, price, status, created_at, requests(title)", { count: "exact" })
          .eq("created_by", targetId)
          .order("created_at", { ascending: false })
          .limit(20);
        
        totalOffersCount = offersCount || 0;

        if (offersData) {
          offers = offersData.map((offer) => ({
            id: offer.id,
            // @ts-ignore: join result
            title: offer.requests?.title || "Unknown Request",
            price: Number(offer.price),
            status: offer.status,
            createdAt: offer.created_at,
          }));
        }
      }

      const totalActivity = totalPurchases + successfulDeliveries;
      
      setProfile({
        ...getBaseProfile(resolvedRole === "seller"),
        name: dbProfile?.full_name || defaults.name,
        handle: toDisplayHandle(dbProfile?.username),
        avatar: dbProfile?.avatar_url || defaults.avatar,
        banner: dbProfile?.banner_url || defaults.banner,
        description: dbProfile?.bio || "",
        telegram: dbProfile?.telegram_handle || "",
        twitter: dbProfile?.twitter_handle || "",
        website: dbProfile?.website || "",
        memberSince: formatMemberSince(dbProfile?.created_at),
        followers,
        following,
        totalPurchases,
        totalOffers: totalOffersCount,
        successfulDeliveries: isWhatnotProfile ? globalDeliveries : successfulDeliveries,
        avgResponseTime: isWhatnotProfile ? "5min" : "-",
        buyerRanking: getBuyerRanking(totalPurchases),
        sellerRanking: isWhatnotProfile ? "Platinum Escrow" : getSellerRanking(successfulDeliveries),
        sellerProtection: isWhatnotProfile ? "Maximum Coverage" : "Base Coverage",
        level: Math.max(1, Math.floor(totalActivity / 5) + 1),
        deliveryRate,
        totalLifetimeOrders,
        last30DaysScore,
      });

      setPurchaseItems(purchases);
      setOfferItems(offers);

      if (viewerId && viewerId !== targetId) {
        const { data: followRow, error: followError } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", viewerId)
          .eq("following_id", targetId)
          .maybeSingle();

        if (!followError) {
          setIsFollowing(!!followRow);
        }
      } else {
        setIsFollowing(false);
      }

      setIsProfileLoading(false);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [hasExplicitTarget, normalizedTargetHandle, routeRole, supabase, validTargetProfileId, viewerRole]);

  useEffect(() => {
    if (!currentUserId || !resolvedTargetId || currentUserId === resolvedTargetId) {
      setIsBlocked(false);
      return;
    }

    async function checkBlockStatus() {
      if (!currentUserId || !resolvedTargetId) return;

      const { data, error } = await supabase
        .from("user_blocks")
        .select("*")
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", resolvedTargetId)
        .maybeSingle();

      if (!error && data) {
        setIsBlocked(true);
      } else {
        setIsBlocked(false);
      }
    }

    checkBlockStatus();

    // Subscribe to block changes
    const channel = supabase
      .channel(`profile-blocks-${resolvedTargetId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_blocks',
        filter: `blocker_id=eq.${currentUserId}` 
      }, () => {
        checkBlockStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, resolvedTargetId, supabase]);

  const handleEditClick = () => {
    if (!isOwnProfile) return;
    setEditForm({
      name: profile?.name ?? "",
      handle: profile?.handle ?? "",
      avatar: profile?.avatar ?? "",
      banner: profile?.banner ?? "",
      description: profile?.description ?? "",
      telegram: profile?.telegram ?? "",
      twitter: profile?.twitter ?? "",
      website: profile?.website ?? "",
      bannerPosition: profile?.bannerPosition ?? 50,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPendingImages({ avatar: null, banner: null });
  };

  const uploadProfileImage = async (file: File, type: EditableImageType) => {
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const extension = file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase() || "jpg"
      : "jpg";
    const bucket = type === "avatar" ? "avatars" : "profile-banners";
    const roleSegment = isSeller ? "seller" : "buyer";
    const filePath = `${currentUserId}/${roleSegment}/${type}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!isOwnProfile) return;
    if (!currentUserId) {
      toast.error("Sign in to save profile.");
      return;
    }

    const normalizedHandle = normalizeHandle(editForm.handle);
    const normalizedName = String(editForm.name || "").trim();
    if (normalizedName.length < 2) {
      toast.error("Display name must be at least 2 characters.");
      return;
    }

    if (normalizedHandle.length < 3) {
      toast.error("Handle must be at least 3 characters.");
      return;
    }

    const linkRegex = /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;
    const hasLink = linkRegex.test(editForm.description);
    if (hasLink && normalizedHandle !== "whatnotmarket") {
       toast.error("Only @whatnotmarket can add links to bio.");
       return;
    }

    setIsSaving(true);

    try {
      let nextAvatar = editForm.avatar || profile?.avatar || "";
      let nextBanner = editForm.banner || profile?.banner || "";

      if (pendingImages.avatar) {
        nextAvatar = await uploadProfileImage(pendingImages.avatar, "avatar");
      }

      if (pendingImages.banner) {
        nextBanner = await uploadProfileImage(pendingImages.banner, "banner");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: normalizedName,
          username: normalizedHandle,
          bio: editForm.description,
          avatar_url: nextAvatar,
          banner_url: nextBanner,
          telegram_handle: editForm.telegram,
          twitter_handle: editForm.twitter,
          website: editForm.website,
        })
        .eq("id", currentUserId);

      if (updateError) {
        if (updateError.code === "23505") {
          toast.error("Handle already used. Choose another one.");
          return;
        }
        throw updateError;
      }
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          name: normalizedName,
          handle: `@${normalizedHandle}`,
          avatar: nextAvatar,
          banner: nextBanner,
          description: editForm.description,
          telegram: editForm.telegram,
          twitter: editForm.twitter,
          website: editForm.website,
          bannerPosition: editForm.bannerPosition,
        };
      });
      setPendingImages({ avatar: null, banner: null });
      setIsEditing(false);
      router.replace(`/profile/${normalizedHandle}`);
      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Save profile error:", error);
      toast.error("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    async function checkFollowStatus() {
        if (!currentUserId || !resolvedTargetId) {
            console.log("CheckFollowStatus: Missing IDs", { currentUserId, resolvedTargetId });
            return;
        }
        
        try {
            console.log("Checking follow status for:", { follower: currentUserId, following: resolvedTargetId });
            const { data, error } = await supabase
                .from("follows")
                .select("*")
                .eq("follower_id", currentUserId)
                .eq("following_id", resolvedTargetId); // Removed .maybeSingle() to debug array result
            
            if (error) {
                console.error("Supabase Follow Check Error:", error);
                throw error;
            }

            console.log("Follow Status Data:", data);
            setIsFollowing(data && data.length > 0);
        } catch (error) {
            console.error("Error checking follow status:", error);
        }
    }

    checkFollowStatus();
  }, [currentUserId, resolvedTargetId, supabase]);

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      toast.error("Sign in to follow users.");
      return;
    }

    const targetId = resolvedTargetId;
    if (!targetId || currentUserId === targetId || isFollowLoading) return;

    setIsFollowLoading(true);

    try {
      if (isFollowing) {
        // Optimistic update
        setIsFollowing(false);
        setProfile((prev) => prev ? ({ ...prev, followers: Math.max(0, prev.followers - 1) }) : prev);

        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetId);

        if (error) {
           console.error("Unfollow Error:", error);
           // Revert if error
           setIsFollowing(true);
           setProfile((prev) => prev ? ({ ...prev, followers: prev.followers + 1 }) : prev);
           toast.error(`Failed to unfollow: ${error.message}`);
           return;
        }

        toast.success("Unfollowed successfully");
      } else {
        // Optimistic update
        setIsFollowing(true);
        setProfile((prev) => prev ? ({ ...prev, followers: prev.followers + 1 }) : prev);

        // Explicitly check for existing record first to debug state mismatch
        const { data: existing } = await supabase
            .from("follows")
            .select("*")
            .eq("follower_id", currentUserId)
            .eq("following_id", targetId)
            .maybeSingle();
        
        if (existing) {
             console.log("Follow relationship already exists in DB, skipping insert.");
             toast.success("Following successfully");
             return;
        }

        // Use insert instead of upsert to see if explicit error helps debug
        const { error } = await supabase.from("follows").insert({
          follower_id: currentUserId,
          following_id: targetId,
        });

        if (error) {
            console.error("Follow Error:", error);
            // Revert if error
            setIsFollowing(false);
            setProfile((prev) => prev ? ({ ...prev, followers: Math.max(0, prev.followers - 1) }) : prev);
            
            if (error.code === '23505') {
                 // Duplicate key error - means we are already following!
                 // Sync state to true
                 setIsFollowing(true);
                 setProfile((prev) => prev ? ({ ...prev, followers: prev.followers + 1 }) : prev);
                 toast.success("Following successfully (synced)");
            } else {
                 toast.error(`Failed to follow: ${error.message}`);
            }
            return;
        }

        toast.success("Following successfully");
      }
    } catch (error) {
      console.error("Follow toggle error:", error);
      toast.error("Failed to update follow status.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!currentUserId || !resolvedTargetId || currentUserId === resolvedTargetId) return;
    
    if (!isBlocked) {
      setIsBlockModalOpen(true);
      return;
    }
    
    // Unblock directly
    confirmBlock();
  };

  const confirmBlock = async () => {
    if (!currentUserId || !resolvedTargetId) return;
    setIsBlocking(true);

    try {
      if (isBlocked) {
        // Unblock
        const { error } = await supabase
          .from("user_blocks")
          .delete()
          .eq("blocker_id", currentUserId)
          .eq("blocked_id", resolvedTargetId);

        if (error) throw error;
        setIsBlocked(false);
        toast.success("User unblocked successfully");
      } else {
        // Block
        const { error } = await supabase.from("user_blocks").insert({
          blocker_id: currentUserId,
          blocked_id: resolvedTargetId,
        });

        if (error) throw error;
        setIsBlocked(true);
        toast.success("User blocked successfully");
        setIsBlockModalOpen(false);
      }
    } catch (error) {
      console.error("Block toggle error:", error);
      toast.error("Failed to update block status.");
    } finally {
      setIsBlocking(false);
    }
  };

  const handleReport = async () => {
    if (!currentUserId || !resolvedTargetId || currentUserId === resolvedTargetId) return;
    setIsReportModalOpen(true);
  };

  const submitReport = async () => {
    if (!currentUserId || !resolvedTargetId || !reportReason.trim()) return;

    setIsReporting(true);
    try {
      const { error } = await supabase.from("user_reports").insert({
        reporter_id: currentUserId,
        reported_id: resolvedTargetId,
        reason: reportReason.trim(),
      });

      if (error) throw error;
      toast.success("User reported successfully. Admins will review.");
      setIsReportModalOpen(false);
      setReportReason("");
    } catch (error) {
      console.error("Report error:", error);
      toast.error("Failed to submit report.");
    } finally {
      setIsReporting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: EditableImageType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingImages((prev) => ({ ...prev, [type]: file }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm((prev) => ({
        ...prev,
        [type]: reader.result as string,
      }));
      toast.success(`${type === "avatar" ? "Avatar" : "Banner"} updated.`);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) return;
    setIsDraggingBanner(true);
    startY.current = e.clientY;
    startPos.current = editForm.bannerPosition;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingBanner) return;
      const deltaY = e.clientY - startY.current;
      const deltaPercent = (deltaY / 320) * 100 * -1;
      const newPos = Math.max(0, Math.min(100, startPos.current + deltaPercent));
      setEditForm((prev) => ({ ...prev, bannerPosition: newPos }));
    };

    const handleMouseUp = () => setIsDraggingBanner(false);

    if (isDraggingBanner) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingBanner]);

  useEffect(() => {
    if (!displayBannerSrc) {
      setBannerObjectFit("cover");
      return;
    }

    let cancelled = false;
    const probe = new window.Image();

    probe.onload = () => {
      if (cancelled) return;
      const isSmall = probe.naturalWidth < 1200 || probe.naturalHeight < 320;
      setBannerObjectFit(isSmall ? "fill" : "cover");
    };

    probe.onerror = () => {
      if (cancelled) return;
      setBannerObjectFit("cover");
    };

    probe.src = displayBannerSrc;

    return () => {
      cancelled = true;
    };
  }, [displayBannerSrc]);

  useEffect(() => {
    if (!isProfileMissing) return;
    router.replace("/market");
  }, [isProfileMissing, router]);

  if (isProfileLoading || !profile) {
    return (
      <div className="min-h-screen bg-black text-white pb-20">
        <Navbar />
        <div className="h-64 md:h-80 w-full bg-zinc-900 animate-pulse" />
        <main className="container mx-auto px-4 sm:px-6 relative z-20 -mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
            <div className="rounded-3xl border border-white/10 bg-[#1C1C1E] p-6 h-[500px]">
              <div className="mx-auto mb-4 h-32 w-32 rounded-full bg-zinc-800 animate-pulse" />
              <div className="mx-auto mb-3 h-6 w-40 rounded bg-zinc-800 animate-pulse" />
              <div className="mx-auto mb-6 h-4 w-28 rounded bg-zinc-800 animate-pulse" />
              <div className="grid grid-cols-2 gap-3 mt-8">
                <div className="h-16 rounded-xl bg-zinc-800 animate-pulse" />
                <div className="h-16 rounded-xl bg-zinc-800 animate-pulse" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-12 w-48 rounded-xl bg-zinc-800 animate-pulse mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="h-40 rounded-2xl bg-[#1C1C1E] border border-white/10 animate-pulse" />
                 <div className="h-40 rounded-2xl bg-[#1C1C1E] border border-white/10 animate-pulse" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isProfileMissing) {
    return (
      <div className="min-h-screen bg-black text-white pb-20">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 py-16">
          <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-[#1C1C1E] p-8 text-center">
            <h1 className="text-2xl font-bold text-white">Profile not found</h1>
            <p className="mt-3 text-sm text-zinc-400">This profile does not exist or is not available.</p>
            <Link
              href="/market"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
            >
              Back to Market
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-zinc-800 selection:text-white pb-20">
      <Navbar />

      <div
        ref={bannerRef}
        className={cn(
          "relative -mt-4 md:-mt-6 w-full rounded-b-[24px] border-x border-b border-zinc-800 group select-none transition-all duration-300",
          isEditing ? "h-auto min-h-[40rem] pb-10" : "h-80 md:h-[30rem] overflow-hidden",
          isEditing && "cursor-move"
        )}
        onMouseDown={handleBannerMouseDown}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10 pointer-events-none" />
        <Image
          src={displayBannerSrc}
          alt="Banner"
          fill
          className={cn(
            "opacity-60 transition-all duration-75 ease-out",
            bannerObjectFit === "fill" ? "object-fill" : "object-cover"
          )}
          style={{ objectPosition: `center ${isEditing ? editForm.bannerPosition : profile.bannerPosition}%` }}
          priority
          draggable={false}
        />

        <div className="container mx-auto px-4 sm:px-6 relative h-full">
          {!isEditing && isOwnProfile && (
            <div className="absolute top-8 md:top-10 right-4 sm:right-6 z-30">
              <Button
                onClick={handleEditClick}
                variant="outline"
                className="gap-2 !border-[#101010]/70 !bg-[#101010]/80 hover:!bg-[#101010]/90 text-xs md:text-sm h-7 md:h-10 px-3 md:px-4"
                aria-label="Modifica profilo"
              >
                Modifica profilo
                <ProfileEditPencilIcon />
              </Button>
            </div>
          )}
          {isEditing && isOwnProfile && (
            <div className="absolute top-8 md:top-10 right-4 sm:right-6 z-30">
              <ButtonGroup>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  className="!border-[#101010]/70 !bg-[#101010]/80 hover:!bg-[#101010]/90 text-xs md:text-sm h-7 md:h-10 px-3 md:px-4"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  variant="outline"
                  className="!border-[#101010]/70 !bg-[#101010]/80 hover:!bg-[#101010]/90 text-xs md:text-sm h-7 md:h-10 px-3 md:px-4"
                >
                  Salva
                </Button>
              </ButtonGroup>
            </div>
          )}

          {isEditing && isOwnProfile && (
            <div className="absolute top-8 md:top-10 left-4 sm:left-6 z-30 flex flex-col md:flex-row items-start md:items-center gap-2">
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild className="gap-2 !border-[#101010]/70 !bg-[#101010]/80 hover:!bg-[#101010]/90 text-xs md:text-sm h-7 md:h-10 px-3 md:px-4 w-full md:w-auto justify-start md:justify-center">
                  <span>
                    <Camera className="w-3 h-3 md:w-4 md:h-4" />
                    Change Banner
                  </span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "banner")} />
              </label>
              
              <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 !border-[#101010]/70 !bg-[#101010]/80 hover:!bg-[#101010]/90 cursor-move text-xs md:text-sm h-7 md:h-10 px-3 md:px-4 w-full md:w-auto justify-start md:justify-center"
                >
                  <Move className="w-3 h-3 md:w-4 md:h-4" />
                  Drag to reposition
                </Button>
            </div>
          )}
        </div>

        <div className={cn("z-20 flex items-center justify-center", isEditing ? "relative py-20" : "absolute inset-0 pointer-events-none")}>
          <div className={cn("flex w-full max-w-3xl flex-col items-center px-4 text-center mt-8 md:mt-0", isEditing && "mt-16 md:mt-0")}>
            <div className="relative mb-3 pointer-events-auto">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-[#1C1C1E] overflow-hidden relative z-10 bg-zinc-800">
                <Image
                  src={isEditing ? editForm.avatar || profile.avatar : profile.avatar}
                  alt={isEditing ? editForm.name || profile.name : profile.name}
                  fill
                  className="object-fill"
                />
                {isEditing && (
                  <div className="absolute inset-0 z-20 bg-black/55 transition-colors hover:bg-black/65">
                    <label className="flex h-full w-full cursor-pointer items-center justify-center">
                      <Camera className="w-5 h-5 md:w-7 md:h-7 text-white/85" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "avatar")} />
                    </label>
                  </div>
                )}
              </div>
              {profile.isOnline && (
                <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-3 h-3 md:w-5 md:h-5 bg-emerald-500 border-2 md:border-4 border-[#1C1C1E] rounded-full z-20" title="Online" />
              )}
              <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-white/10 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full border border-white/25 z-20 backdrop-blur-sm">
                Lvl {profile.level}
              </div>
            </div>

            {isEditing ? (
              <div className="mb-3 w-full max-w-[300px] space-y-1.5">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-[#1C1C1E]/70 px-2.5 py-1 text-center text-2xl md:text-3xl font-bold text-white outline-none focus:border-white/25"
                  placeholder="Display name"
                />
                <input
                  value={editForm.handle}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, handle: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-[#1C1C1E]/70 px-2.5 py-1 text-center text-xs md:text-sm text-zinc-200 outline-none focus:border-white/25"
                  placeholder="@handle"
                />
              </div>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center justify-center gap-2 max-w-full">
                  <span className="truncate max-w-[200px] sm:max-w-[300px] md:max-w-none">{profile.name}</span>
                  {isFounderProfile ? (
                    <FounderMark />
                  ) : (
                    isSeller && <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 flex-shrink-0" />
                  )}
                </h1>
                <p className="text-zinc-300 text-xs md:text-sm mb-3 truncate max-w-[250px] sm:max-w-[350px] mx-auto">{profile.handle}</p>
              </>
            )}

            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#1C1C1E] p-4 md:p-5 text-left focus-within:border-white/25 focus-within:ring-1 focus-within:ring-white/15">
              <h2 className="mb-2 text-lg md:text-xl font-bold text-white flex justify-between items-center">
                About
                {isEditing && (
                   <span className={cn("text-xs", editForm.description.length > 250 ? "text-red-400" : "text-zinc-500")}>
                     {editForm.description.length}/250
                   </span>
                )}
              </h2>
              {isEditing ? (
                <>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length <= 250) {
                        setEditForm((prev) => ({ ...prev, description: val }));
                      }
                    }}
                    className="h-[80px] w-full resize-none border-none bg-transparent text-sm leading-relaxed text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0 md:text-base overflow-y-auto"
                    placeholder="Write your bio (max 250 characters)..."
                  />
                  
                  <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="white"/>
                        </svg>
                      </div>
                      <input
                        value={editForm.twitter}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, twitter: e.target.value }))}
                        className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-zinc-600 focus:ring-0 focus:outline-none px-0"
                        placeholder="X (Twitter) handle"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-zinc-400 whitespace-pre-wrap md:text-base">
                    <BioText text={profile.description || ""} isWhatnotMarket={normalizeHandle(profile.handle) === "whatnotmarket"} />
                  </p>
                  
                  {profile.twitter && (
                    <div className="pt-3 border-t border-white/10">
                      <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="white"/>
                        </svg>
                        <span className="text-xs font-medium text-white">{profile.twitter}</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <main className="container mx-auto px-4 sm:px-6 relative z-20 mt-2 md:mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
          <div className="space-y-6 lg:sticky lg:top-20">
            <Squircle
              radius={32}
              smoothing={1}
              className="w-full drop-shadow-2xl"
              innerClassName="bg-[#1C1C1E] border border-white/10 overflow-hidden p-4 md:p-6"
            >
              <div className="flex flex-col items-center text-center relative">

                <div className="grid grid-cols-2 gap-2 md:gap-3 w-full mb-4 md:mb-6">
                  <div className="bg-[#2C2C2E] rounded-xl p-2 md:p-3 flex flex-col items-center justify-center border border-white/5">
                    <span className="text-base md:text-lg font-bold text-white">{profile.followers}</span>
                    <span className="text-[10px] md:text-xs text-zinc-500">Followers</span>
                  </div>
                  <div className="bg-[#2C2C2E] rounded-xl p-2 md:p-3 flex flex-col items-center justify-center border border-white/5">
                    <span className="text-base md:text-lg font-bold text-white">{profile.following}</span>
                    <span className="text-[10px] md:text-xs text-zinc-500">Following</span>
                  </div>
                </div>

                {!isEditing && resolvedTargetId && !isOwnProfile && (
                  <div className="w-full mb-4 md:mb-6 space-y-2 md:space-y-3">
                    <button
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                      className={cn(
                        "w-full h-9 md:h-10 rounded-xl font-bold transition-all text-sm md:text-base",
                        isFollowing
                          ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          : "bg-white text-black hover:bg-zinc-200",
                        isFollowLoading && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      {isFollowLoading ? "Updating..." : isFollowing ? "Following" : "Follow"}
                    </button>
                    
                    {!isBlocked && (
                      <Link
                        href={`/inbox?userId=${resolvedTargetId}`}
                        className="w-full h-9 md:h-10 rounded-xl font-bold bg-black text-white hover:bg-zinc-900 border border-white/10 flex items-center justify-center gap-2 transition-all text-sm md:text-base"
                      >
                        <Image 
                          src="/chat.png" 
                          alt="Chat" 
                          width={20} 
                          height={20} 
                          className="w-4 h-4 md:w-5 md:h-5 object-contain" 
                        />
                        Chat
                      </Link>
                    )}

                     <div className="flex gap-2 pt-1 md:pt-2">
                        <button 
                          onClick={handleBlockToggle}
                          disabled={isBlocking}
                          className={cn(
                            "flex-1 h-8 md:h-9 rounded-lg font-medium text-[10px] md:text-xs bg-zinc-800/50 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 border border-white/5 flex items-center justify-center gap-1 md:gap-1.5 transition-all group",
                            isBlocked && "text-red-500 bg-red-500/5 border-red-500/20"
                          )}
                        >
                           <Ban className={cn("w-3 h-3 md:w-3.5 md:h-3.5 group-hover:text-red-500", isBlocked && "text-red-500")} />
                           {isBlocking ? "..." : isBlocked ? "Unblock" : "Block"}
                        </button>
                        <button 
                          onClick={handleReport}
                          disabled={isReporting}
                          className="flex-1 h-8 md:h-9 rounded-lg font-medium text-[10px] md:text-xs bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-white/5 flex items-center justify-center gap-1 md:gap-1.5 transition-all"
                        >
                           <Flag className="w-3 h-3 md:w-3.5 md:h-3.5" />
                           {isReporting ? "..." : "Report"}
                        </button>
                     </div>
                   </div>
                 )}

                <div className="w-full h-px bg-white/5 mb-4 md:mb-6" />

                <div className="w-full space-y-3 md:space-y-4 text-xs md:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1.5 md:gap-2">
                      <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" /> Member Since
                    </span>
                    <span className="text-zinc-300 font-medium">{profile.memberSince}</span>
                  </div>

                  {isSeller && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 flex items-center gap-1.5 md:gap-2">
                          <Package className="w-3.5 h-3.5 md:w-4 md:h-4" /> {isFounderProfile ? "Transactions" : "Delivery"}
                        </span>
                        <span className="text-white font-bold text-[10px] md:text-sm">
                           {profile.deliveryRate}% <span className="text-zinc-500 font-normal ml-0.5 md:ml-1">({profile.totalLifetimeOrders.toLocaleString()})</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 flex items-center gap-1.5 md:gap-2">
                          <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" /> Response Time
                        </span>
                        <span className="text-zinc-300 font-medium">{profile.avgResponseTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 flex items-center gap-1.5 md:gap-2">
                          <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" /> Last 30 Days
                        </span>
                        <span className="text-emerald-400 font-bold">{profile.last30DaysScore}%</span>
                      </div>
                    </>
                  )}

                  {!isSeller && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1.5 md:gap-2">
                        <Package className="w-3.5 h-3.5 md:w-4 md:h-4" /> Purchases
                      </span>
                      <span className="text-zinc-300 font-bold">{profile.totalPurchases}</span>
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-white/5 my-4 md:my-6" />

                <div className="w-full text-left">
                  <h3 className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3 md:mb-4">
                    {isFounderProfile && isSeller ? "Escrow Status" : (isSeller ? "Seller Status" : "Buyer Status")}
                  </h3>

                  <div className="space-y-2 md:space-y-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-zinc-800 text-white">
                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-bold text-white">{isSeller ? profile.sellerRanking : profile.buyerRanking}</div>
                        <div className="text-[10px] md:text-xs text-zinc-500">Ranking</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-zinc-800 text-white">
                        <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-bold text-white">{isSeller ? profile.sellerProtection : profile.buyerProtection}</div>
                        <div className="text-[10px] md:text-xs text-zinc-500">Protection Level</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Squircle>
          </div>

          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-6 border-b border-white/10 pb-1">
                <button
                  onClick={() => setActiveTab("listings")}
                  className={cn(
                    "text-sm font-bold pb-3 border-b-2 transition-colors",
                    activeTab === "listings" ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300"
                  )}
                >
                  {isSeller ? "My Offers" : "What I Buy"}
                  <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded ml-1 text-zinc-400">
                    {isSeller ? profile.totalOffers : profile.totalPurchases}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={cn(
                    "text-sm font-bold pb-3 border-b-2 transition-colors",
                    activeTab === "reviews" ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300"
                  )}
                >
                  Reviews <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded ml-1 text-zinc-400">0</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTab === "listings" &&
                  isSeller &&
                  offerItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative bg-[#1C1C1E] hover:bg-[#252527] border border-white/5 rounded-2xl p-4 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-[#2C2C2E] rounded-xl flex items-center justify-center text-base font-bold">
                           {/* Placeholder icon since offers don't have images yet */}
                           <Package className="w-6 h-6 text-zinc-500" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-sm mb-1 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                            <span className={cn(
                              "font-medium",
                              item.status === "pending" ? "text-yellow-400" :
                              item.status === "accepted" ? "text-emerald-400" :
                              item.status === "rejected" ? "text-red-400" : "text-zinc-400"
                            )}>
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                            <span>-</span>
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-white font-bold">${item.price.toFixed(2)}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                {activeTab === "listings" &&
                  !isSeller &&
                  purchaseItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative bg-[#1C1C1E] hover:bg-[#252527] border border-white/5 rounded-2xl p-4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-white font-bold text-sm mb-1">{item.title}</h3>
                          <div className="text-xs text-zinc-500">Purchased {new Date(item.purchasedAt).toLocaleDateString()}</div>
                        </div>
                        <div className="text-white font-bold">${item.price.toFixed(2)}</div>
                      </div>
                    </motion.div>
                  ))}
              </div>

              {activeTab === "listings" && isSeller && offerItems.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#1C1C1E] p-5 text-sm text-zinc-400">
                  No active offers. Listings will appear here once they are created.
                </div>
              )}

              {activeTab === "listings" && !isSeller && purchaseItems.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#1C1C1E] p-5 text-sm text-zinc-400">No purchases yet. What you buy will appear here.</div>
              )}

              {activeTab === "reviews" && (
                <div className="rounded-2xl border border-white/10 bg-[#1C1C1E] p-5 text-sm text-zinc-400">
                  No reviews yet. Reviews will appear after completed purchases/sales when review data is available.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Modal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportReason("");
        }}
        title="Report User"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Please provide a reason for reporting this user. This information will be reviewed by our moderators.
          </p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Reason for reporting..."
            className="w-full h-32 bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all resize-none"
            autoFocus
          />
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setIsReportModalOpen(false);
                setReportReason("");
              }}
              className="flex-1 h-10 rounded-xl font-bold bg-zinc-800 text-white hover:bg-zinc-700 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              onClick={submitReport}
              disabled={isReporting || !reportReason.trim()}
              className="flex-1 h-10 rounded-xl font-bold bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white transition-all text-sm flex items-center justify-center gap-2"
            >
              {isReporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Reporting...
                </>
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onConfirm={confirmBlock}
        title="Block User"
        description={`Are you sure you want to block ${profile?.handle || 'this user'}? You won't be able to exchange messages anymore.`}
        confirmLabel="Block User"
        cancelLabel="Cancel"
        isDestructive={true}
      />
    </div>
  );
}

