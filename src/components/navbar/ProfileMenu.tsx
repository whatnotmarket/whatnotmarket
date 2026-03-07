"use client";

import { useEffect, useMemo, useState } from "react";
import { User, CreditCard, LogOut, Phone, Ticket, PlusCircle, MessageSquare } from "lucide-react";
import { NavPopup } from "./NavPopup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { createClient } from "@/lib/supabase";

function toDisplayNameFromEmail(email: string | null | undefined) {
  const localPart = String(email || "")
    .split("@")[0]
    ?.trim();
  if (!localPart) return null;
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function walletNameFromBridgeSubject(rawSubject: string | null | undefined) {
  const subject = String(rawSubject || "");
  const parts = subject.split(":");
  const address = parts.length >= 3 ? parts[2] : "";
  if (!address.startsWith("0x") || address.length < 10) return null;
  return address;
}

function walletAddressFromText(raw: string | null | undefined) {
  const value = String(raw || "").trim().toLowerCase();
  if (/^0x[a-f0-9]{40}$/.test(value)) {
    return value;
  }
  return null;
}

function normalizeHandle(raw: string | null | undefined) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._-]/g, "");
}

const CustomUserIcon = ({ className }: { className?: string }) => (
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M15 8.5C15 10.433 13.433 12 11.5 12C9.567 12 8 10.433 8 8.5C8 6.567 9.567 5 11.5 5C13.433 5 15 6.567 15 8.5Z" fill="currentColor"/>
        <path d="M17.6305 20H5.94623C5.54449 20 5.31716 19.559 5.56788 19.2451C6.68379 17.8479 9.29072 15 12 15C14.7275 15 17.0627 17.8864 18.0272 19.2731C18.2474 19.5897 18.0161 20 17.6305 20Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export function ProfileMenu() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileHref, setProfileHref] = useState("/profile");
  const { role, logout } = useUser();

  useEffect(() => {
    let active = true;
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;

    const resolveProfileHref = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      if (!user) {
        setProfileHref("/profile");
        return;
      }

      const userMetadata = (user.user_metadata || {}) as Record<string, unknown>;
      const bridgeProvider = String(userMetadata.bridge_provider || "")
        .trim()
        .toLowerCase();
      const isWalletProvider =
        bridgeProvider === "wallet" ||
        bridgeProvider === "walletconnect" ||
        bridgeProvider === "metamask" ||
        bridgeProvider === "trustwallet" ||
        bridgeProvider === "google" ||
        bridgeProvider === "apple";
      const metadataFullName = String(userMetadata.full_name || "").trim();
      const walletDisplayName = walletNameFromBridgeSubject(String(userMetadata.bridge_subject || ""));
      const defaultFullName =
        metadataFullName ||
        (isWalletProvider ? walletDisplayName : null) ||
        toDisplayNameFromEmail(user.email) ||
        (isWalletProvider ? user.email || null : null);

      const { data, error } = await supabase
        .from("profiles")
        .select("username,role_preference,email,full_name")
        .eq("id", user.id)
        .maybeSingle();
      let profile = data;

      if (!active) return;
      if (error) {
        console.error("Profile fetch error:", error);
        setProfileHref("/profile");
        return;
      }

      if (!profile) {
        const { error: bootstrapProfileError } = await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email ?? null,
            full_name: defaultFullName,
            role_preference: "buyer",
            onboarding_status: "completed",
          },
          { onConflict: "id" }
        );

        if (bootstrapProfileError) {
          console.error("Profile bootstrap error:", bootstrapProfileError);
          setProfileHref("/profile");
          return;
        }

        const { data: bootstrapProfile, error: bootstrapFetchError } = await supabase
          .from("profiles")
          .select("username,role_preference,email,full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (bootstrapFetchError || !bootstrapProfile) {
          if (bootstrapFetchError) {
            console.error("Profile bootstrap fetch error:", bootstrapFetchError);
          }
          setProfileHref("/profile");
          return;
        }

        profile = bootstrapProfile;
      }

      if (!profile.full_name && defaultFullName) {
        const { error: fullNameUpdateError } = await supabase
          .from("profiles")
          .update({ full_name: defaultFullName })
          .eq("id", user.id);
        if (fullNameUpdateError) {
          console.error("Full name bootstrap error:", fullNameUpdateError);
        }
      }

      if (!profile.role_preference) {
        const { error: roleUpdateError } = await supabase
          .from("profiles")
          .update({ role_preference: "buyer" })
          .eq("id", user.id);
        if (roleUpdateError) {
          console.error("Role bootstrap error:", roleUpdateError);
        }
      }

      if (!active) return;
      const normalizedUsername = normalizeHandle(profile.username);
      const walletAddressSlug =
        walletDisplayName?.toLowerCase() || walletAddressFromText(profile.full_name);
      if (normalizedUsername) {
        setProfileHref(`/profile/${normalizedUsername}`);
        return;
      }

      if (isWalletProvider && walletAddressSlug) {
        setProfileHref(`/profile/${walletAddressSlug}`);
        return;
      }

      setProfileHref("/profile");
    };

    const setup = async () => {
      await resolveProfileHref();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      profileChannel = supabase
        .channel(`profile-menu-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
          () => {
            resolveProfileHref();
          }
        )
        .subscribe();
    };

    setup();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      resolveProfileHref();
    });

    return () => {
      active = false;
      profileChannel?.unsubscribe();
      subscription.unsubscribe();
    };
  }, [isOpen, supabase]);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { redirectTo?: string }
        | null;
      const auth0LogoutUrl = response.headers.get("x-auth0-logout-url");

      if (auth0LogoutUrl) {
        window.location.assign(auth0LogoutUrl);
        return;
      }

      await supabase.auth.signOut();

      const redirectTo = payload?.redirectTo || "/login";
      logout();
      setIsOpen(false);
      router.replace(redirectTo);
      router.refresh();
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 0);
      return;
    } catch (error) {
      console.error("Sign out failed:", error);
    }

    logout();
    setIsOpen(false);
      router.replace("/login");
    router.refresh();
    setTimeout(() => {
      window.location.href = "/login";
    }, 0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm font-bold text-zinc-300 hover:text-white transition-all px-4 py-2 rounded-lg hover:bg-white/5 cursor-pointer"
      >
        <CustomUserIcon className="h-6 w-6" />
      </button>

      <NavPopup isOpen={isOpen} onClose={() => setIsOpen(false)} align="center" className="w-[320px]" title="Profile">
        <div className="bg-[#1C1C1E] rounded-[16px] p-2">
            <div className="space-y-1">
                <Link href={profileHref} className="w-full flex items-center gap-3 px-3 h-[50px] rounded-lg hover:bg-white/5 transition-colors group">
                    <User className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                    <span className="text-[15px] font-medium text-zinc-300 group-hover:text-white">Profile</span>
                </Link>

                {role === "seller" ? (
                  <>
                    <Link href="/sell" className="w-full flex items-center gap-3 px-3 h-[50px] rounded-lg hover:bg-white/5 transition-colors group">
                        <PlusCircle className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                        <span className="text-[15px] font-medium text-zinc-300 group-hover:text-white">Create Listing</span>
                    </Link>
                    <Link href="/my-deals" className="w-full flex items-center gap-3 px-3 h-[50px] rounded-lg hover:bg-white/5 transition-colors group">
                        <CreditCard className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                        <span className="text-[15px] font-medium text-zinc-300 group-hover:text-white">My Deals</span>
                    </Link>
                    <Link href="/inbox" className="w-full flex items-center gap-3 px-3 h-[50px] rounded-lg hover:bg-white/5 transition-colors group">
                        <MessageSquare className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                        <span className="text-[15px] font-medium text-zinc-300 group-hover:text-white">Inbox</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/my-deals" className="w-full flex items-center gap-3 px-3 h-[50px] rounded-lg hover:bg-white/5 transition-colors group">
                        <CreditCard className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                        <span className="text-[15px] font-medium text-zinc-300 group-hover:text-white">My Deals</span>
                    </Link>
                    <Link href="/requests" className="w-full flex items-center gap-3 px-3 h-[50px] rounded-lg hover:bg-white/5 transition-colors group">
                        <Phone className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                        <span className="text-[15px] font-medium text-zinc-300 group-hover:text-white">Active Requests</span>
                    </Link>
                    <Link href="/redeem" className="w-full flex items-center gap-3 px-3 h-[50px] rounded-lg hover:bg-white/5 transition-colors group">
                        <Ticket className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                        <span className="text-[15px] font-medium text-zinc-300 group-hover:text-white">Redeem Code</span>
                    </Link>
                  </>
                )}

                <div className="h-px bg-zinc-700/50 my-2 mx-3" />
                <button 
                    onClick={handleLogout}
                    disabled={isSigningOut}
                    className="w-full flex items-center gap-3 px-3 h-[50px] rounded-lg hover:bg-white/5 transition-colors group text-red-400 hover:text-red-300"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="text-[15px] font-medium">{isSigningOut ? "Signing out..." : "Sign out"}</span>
                </button>
            </div>
        </div>
      </NavPopup>
    </div>
  );
}
