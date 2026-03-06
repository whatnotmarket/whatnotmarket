"use client";

import { useMemo, useState } from "react";
import { User, CreditCard, LogOut, Phone, Ticket, PlusCircle, MessageSquare } from "lucide-react";
import { NavPopup } from "./NavPopup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { createClient } from "@/lib/supabase";

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
  const { role, logout } = useUser();

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }

    logout();
    setIsOpen(false);
    router.replace("/auth");
    router.refresh();
    setTimeout(() => {
      window.location.href = "/auth";
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
                <Link href="/profile" className="w-full flex items-center gap-3 px-3 h-[50px] rounded-lg hover:bg-white/5 transition-colors group">
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
