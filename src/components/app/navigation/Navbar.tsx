"use client";

import { AnnouncementBar } from "@/components/app/layout/AnnouncementBar";
import { Button } from "@/components/shared/ui/button";
import { Squircle } from "@/components/shared/ui/Squircle";
import { useUser } from "@/contexts/UserContext";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CryptoSelector } from "./navbar/CryptoSelector";
import { LanguageSelector } from "./navbar/LanguageSelector";
import { MarketplaceMenu } from "./navbar/MarketplaceMenu";
import { MoreMenu } from "./navbar/MoreMenu";
import { NotificationsMenu } from "./navbar/NotificationsMenu";
import { ProfileMenu } from "./navbar/ProfileMenu";

export function Navbar() {
  const { role, isFounder } = useUser();

  return (
    <div className="sticky top-0 z-50 flex w-full flex-col">
      {!isFounder && <AnnouncementBar />}

      <div className="relative z-50 w-full">
        <Squircle
          as="div"
          radius={24}
          smoothing={1}
          corners="bottom"
          borderWidth={1}
          borderColor="rgba(39, 39, 42, 1)"
          className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-2xl"
          innerClassName="bg-[#1C1C1E]"
        />

        <div className="relative z-10 mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6 font-sans font-bold">
          <div className="flex items-center gap-8">
            <Link href="/market" className="group flex cursor-pointer items-center gap-2">
              <Image
                src="/images/ico/faviconbianco.ico"
                alt="OpenlyMarket"
                width={80}
                height={40}
                className="h-7 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                priority
              />
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              <MarketplaceMenu />

              <Link
                href="/broker"
                className="group flex cursor-pointer items-center gap-1 rounded-lg px-4 py-2 text-sm font-bold text-zinc-300 transition-all hover:bg-white/5 hover:text-white"
              >
                For Business <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
              </Link>

              <MoreMenu />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {!isFounder && (
              <div className="hidden items-center gap-1 pr-1 md:flex">
                <CryptoSelector />
                <LanguageSelector />
              </div>
            )}

            {!isFounder && role === "buyer" && (
              <Button
                asChild
                size="sm"
                className="h-8 rounded-lg bg-zinc-200 px-4 text-xs font-bold text-black transition-all hover:bg-white"
              >
                <Link href="/requests/new">Create request</Link>
              </Button>
            )}

            {!isFounder && role === "seller" && (
              <Button
                asChild
                size="sm"
                className="h-8 rounded-lg bg-emerald-500 px-4 text-xs font-bold text-black transition-all hover:bg-emerald-400"
              >
                <Link href="/sell">Sell something</Link>
              </Button>
            )}

            {isFounder && (
              <Button
                asChild
                size="sm"
                className="h-8 rounded-lg bg-zinc-200 px-4 text-xs font-bold text-black transition-all hover:bg-white"
              >
                <Link href="/admin">Founder Panel</Link>
              </Button>
            )}

            <div className="mx-0.5 h-4 w-px bg-zinc-700/50" />

            <div className="flex items-center gap-2">
              <Link
                href="/inbox"
                className="flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-zinc-300 transition-all hover:bg-white/5 hover:text-white"
                aria-label="Open inbox"
              >
                <Image
                  src="/images/png/openly-chat.png"
                  alt="Chat"
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                  priority
                  style={{ width: "auto", height: "auto" }}
                />
              </Link>
              <NotificationsMenu />
              <ProfileMenu />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

