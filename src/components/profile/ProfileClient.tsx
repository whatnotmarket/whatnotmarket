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
  Edit2,
  Camera,
  X,
  Save,
  Move,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  isOnline: boolean;
  successfulDeliveries: number;
  sellerRanking: string;
  sellerProtection: string;
  avgResponseTime: string;
  buyerRanking: string;
  buyerProtection: string;
  totalPurchases: number;
  bannerPosition: number;
};

type PurchaseItem = {
  id: string;
  title: string;
  price: number;
  purchasedAt: string;
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
    bannerPosition: 50,
  };
}

function FounderMark() {
  return (
    <span className="group relative inline-flex items-center">
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
      <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[9999] -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        Founder of WhatnotMarket
      </span>
    </span>
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
  const [bannerObjectFit, setBannerObjectFit] = useState<"cover" | "fill">("cover");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    handle: "",
    avatar: "",
    banner: "",
    description: "",
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

  const isSeller = profileRole === "seller";
  const [profile, setProfile] = useState<ProfileState>(() => getBaseProfile(isSeller));
  const isFounderProfile =
    normalizeHandle(profile.handle) === "whatnotmarket" ||
    normalizeHandle(profile.name) === "whatnotmarket";
  const isOwnProfile = !!currentUserId && !!resolvedTargetId && currentUserId === resolvedTargetId;
  const displayBannerSrc = isEditing ? editForm.banner || profile.banner : profile.banner;

  useEffect(() => {
    let active = true;
    setIsProfileLoading(true);
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
          .select("full_name,username,avatar_url,banner_url,bio,created_at,role_preference")
          .eq("id", targetId)
          .maybeSingle(),
        supabase
          .from("profile_follows")
          .select("following_id", { count: "exact", head: true })
          .eq("following_id", targetId),
        supabase
          .from("profile_follows")
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
          setIsFollowing(false);
          setIsProfileLoading(false);
          return;
        }

        setProfileRole(resolvedRole);
        setProfile(getBaseProfile(resolvedRole === "seller"));
        setResolvedTargetId(null);
        setPurchaseItems([]);
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

      const totalActivity = totalPurchases + successfulDeliveries;

      setProfile({
        ...getBaseProfile(resolvedRole === "seller"),
        name: dbProfile?.full_name || defaults.name,
        handle: toDisplayHandle(dbProfile?.username),
        avatar: dbProfile?.avatar_url || defaults.avatar,
        banner: dbProfile?.banner_url || defaults.banner,
        description: dbProfile?.bio || "",
        memberSince: formatMemberSince(dbProfile?.created_at),
        followers,
        following,
        totalPurchases,
        successfulDeliveries,
        buyerRanking: getBuyerRanking(totalPurchases),
        sellerRanking: getSellerRanking(successfulDeliveries),
        level: Math.max(1, Math.floor(totalActivity / 5) + 1),
      });

      setPurchaseItems(purchases);

      if (viewerId && viewerId !== targetId) {
        const { data: followRow, error: followError } = await supabase
          .from("profile_follows")
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

  const handleEditClick = () => {
    if (!isOwnProfile) return;
    setEditForm({
      name: profile.name,
      handle: profile.handle,
      avatar: profile.avatar,
      banner: profile.banner,
      description: profile.description,
      bannerPosition: profile.bannerPosition,
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

    setIsSaving(true);

    try {
      let nextAvatar = editForm.avatar || profile.avatar;
      let nextBanner = editForm.banner || profile.banner;

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
        })
        .eq("id", currentUserId);

      if (updateError) {
        if (updateError.code === "23505") {
          toast.error("Handle already used. Choose another one.");
          return;
        }
        throw updateError;
      }

      setProfile((prev) => ({
        ...prev,
        name: normalizedName,
        handle: `@${normalizedHandle}`,
        avatar: nextAvatar,
        banner: nextBanner,
        description: editForm.description,
        bannerPosition: editForm.bannerPosition,
      }));

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
        const { error } = await supabase
          .from("profile_follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetId);

        if (error) throw error;

        setIsFollowing(false);
        setProfile((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
      } else {
        const { error } = await supabase.from("profile_follows").insert({
          follower_id: currentUserId,
          following_id: targetId,
        });

        if (error) throw error;

        setIsFollowing(true);
        setProfile((prev) => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error) {
      console.error("Follow toggle error:", error);
      toast.error("Failed to update follow status.");
    } finally {
      setIsFollowLoading(false);
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

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-black text-white pb-20">
        <Navbar />
        <div className="h-64 md:h-80 w-full bg-zinc-900 animate-pulse" />
        <main className="container mx-auto px-4 sm:px-6 relative z-20 -mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
            <div className="rounded-3xl border border-white/10 bg-[#1C1C1E] p-6">
              <div className="mx-auto mb-4 h-32 w-32 rounded-full bg-zinc-800 animate-pulse" />
              <div className="mx-auto mb-3 h-6 w-40 rounded bg-zinc-800 animate-pulse" />
              <div className="mx-auto mb-6 h-4 w-28 rounded bg-zinc-800 animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 rounded-xl bg-zinc-800 animate-pulse" />
                <div className="h-16 rounded-xl bg-zinc-800 animate-pulse" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-44 rounded-3xl bg-[#1C1C1E] border border-white/10 animate-pulse" />
              <div className="h-60 rounded-3xl bg-[#1C1C1E] border border-white/10 animate-pulse" />
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
          "relative h-64 md:h-80 w-full overflow-hidden group select-none",
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

        {isEditing && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 w-full max-w-md px-4 pointer-events-auto">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-sm font-bold text-white flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md border border-white/10 shadow-lg">
                  <Camera className="w-4 h-4" />
                  Change
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "banner")} />
                </label>
                <div className="px-4 py-2 bg-black/50 text-white text-xs font-bold rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
                  <Move className="w-3 h-3" /> Drag to reposition
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="container mx-auto px-4 sm:px-6 relative z-20 -mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
          <div className="space-y-6">
            <Squircle
              radius={32}
              smoothing={1}
              className="w-full drop-shadow-2xl"
              innerClassName="bg-[#1C1C1E] border border-white/10 overflow-hidden p-6"
            >
              <div className="flex flex-col items-center text-center relative">
                {!isEditing && isOwnProfile ? (
                  <button
                    onClick={handleEditClick}
                    className="absolute top-0 right-0 p-2 text-zinc-500 hover:text-white transition-colors"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : isEditing && isOwnProfile ? (
                  <div className="absolute top-0 right-0 flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="p-2 text-emerald-500 hover:text-emerald-400 transition-colors"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}

                <div className="relative mb-4 group">
                  <div className="w-32 h-32 rounded-full border-4 border-[#1C1C1E] overflow-hidden relative z-10 bg-zinc-800">
                    <Image
                      src={isEditing ? editForm.avatar || profile.avatar : profile.avatar}
                      alt={profile.name}
                      fill
                      className="object-fill"
                    />

                    {isEditing && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors z-20">
                        <label className="cursor-pointer w-full h-full flex items-center justify-center">
                          <Camera className="w-8 h-8 text-white/80" />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "avatar")} />
                        </label>
                      </div>
                    )}
                  </div>

                  {!isEditing && profile.isOnline && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-[#1C1C1E] rounded-full z-20" title="Online" />
                  )}

                  {!isEditing && (
                    <div className="absolute -top-2 -right-2 bg-white/10 text-white text-xs font-bold px-2 py-1 rounded-full border border-white/25 z-20 backdrop-blur-sm">
                      Lvl {profile.level}
                    </div>
                  )}
                </div>

                {isEditing ? (
          <div className="mb-6 w-full max-w-xs space-y-3">
            <div>
              <label className="text-xs uppercase text-zinc-500 tracking-wider">Display Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                placeholder="Use your username"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-zinc-500 tracking-wider">Handle</label>
              <input
                value={editForm.handle}
                onChange={(e) => setEditForm((prev) => ({ ...prev, handle: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                placeholder="@"
              />
            </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2 mt-2">
                      {profile.name}
                      {isFounderProfile ? (
                        <FounderMark />
                      ) : (
                        isSeller && <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      )}
                    </h1>
                    <p className="text-zinc-500 text-sm mb-6">{profile.handle}</p>
                  </>
                )}

                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                  <div className="bg-[#2C2C2E] rounded-xl p-3 flex flex-col items-center justify-center border border-white/5">
                    <span className="text-lg font-bold text-white">{profile.followers}</span>
                    <span className="text-xs text-zinc-500">Followers</span>
                  </div>
                  <div className="bg-[#2C2C2E] rounded-xl p-3 flex flex-col items-center justify-center border border-white/5">
                    <span className="text-lg font-bold text-white">{profile.following}</span>
                    <span className="text-xs text-zinc-500">Following</span>
                  </div>
                </div>

                {!isEditing && resolvedTargetId && !isOwnProfile && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    className={cn(
                      "w-full h-10 rounded-xl font-bold mb-6 transition-all",
                      isFollowing
                        ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        : "bg-white text-black hover:bg-zinc-200",
                      isFollowLoading && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {isFollowLoading ? "Updating..." : isFollowing ? "Following" : "Follow"}
                  </button>
                )}

                <div className="w-full h-px bg-white/5 mb-6" />

                <div className="w-full space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Member Since
                    </span>
                    <span className="text-zinc-300 font-medium">{profile.memberSince}</span>
                  </div>

                  {isSeller && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 flex items-center gap-2">
                          <Package className="w-4 h-4" /> Deliveries
                        </span>
                        <span className="text-emerald-400 font-bold">{profile.successfulDeliveries.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 flex items-center gap-2">
                          <Clock className="w-4 h-4" /> Response Time
                        </span>
                        <span className="text-zinc-300 font-medium">{profile.avgResponseTime}</span>
                      </div>
                    </>
                  )}

                  {!isSeller && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Purchases
                      </span>
                      <span className="text-zinc-300 font-bold">{profile.totalPurchases}</span>
                    </div>
                  )}
                </div>
              </div>
            </Squircle>

            <Squircle
              radius={24}
              smoothing={1}
              className="w-full"
              innerClassName="bg-[#1C1C1E] border border-white/10 p-5"
            >
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                {isSeller ? "Seller Status" : "Buyer Status"}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br",
                      isSeller ? "from-emerald-500/20 to-teal-500/20 text-emerald-400" : "from-blue-500/20 to-indigo-500/20 text-blue-400"
                    )}
                  >
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{isSeller ? profile.sellerRanking : profile.buyerRanking}</div>
                    <div className="text-xs text-zinc-500">Ranking</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br",
                      isSeller ? "from-amber-500/20 to-yellow-500/20 text-amber-400" : "from-purple-500/20 to-pink-500/20 text-purple-400"
                    )}
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{isSeller ? profile.sellerProtection : profile.buyerProtection}</div>
                    <div className="text-xs text-zinc-500">Protection Level</div>
                  </div>
                </div>
              </div>
            </Squircle>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">About</h2>
                {isEditing && <span className="text-xs text-emerald-400 font-medium animate-pulse">Editing mode active</span>}
              </div>

              {isEditing ? (
                <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-emerald-500/30 ring-1 ring-emerald-500/20">
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full min-h-[120px] bg-transparent border-none text-white placeholder:text-zinc-500 focus:ring-0 resize-none text-sm md:text-base leading-relaxed"
                    placeholder="Write your bio..."
                  />
                </div>
              ) : (
                <p className="text-zinc-400 leading-relaxed text-sm md:text-base bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 whitespace-pre-wrap">
                  {profile.description || "No bio yet."}
                </p>
              )}
            </div>

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
                  MOCK_LISTINGS.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative bg-[#1C1C1E] hover:bg-[#252527] border border-white/5 rounded-2xl p-4 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-[#2C2C2E] rounded-xl flex items-center justify-center text-base font-bold">{item.image}</div>
                        <div>
                          <h3 className="text-white font-bold text-sm mb-1 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                            <span>{item.sold} sold</span>
                            <span>-</span>
                            <span className="text-emerald-400 font-medium">Instant Delivery</span>
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
    </div>
  );
}
