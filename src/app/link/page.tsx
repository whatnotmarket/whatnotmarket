import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import pumpFunLogo from "@/pumpfunlogo/pump.fun.png";
import profileImage from "@/pumpfunlogo/NFT-OPNLY.png";
import { ArrowRight } from "lucide-react";
import * as motion from "framer-motion/client";
import { cn } from "@/lib/utils";
import { buildIndexableMetadata } from "@/lib/seo";

export const metadata: Metadata = buildIndexableMetadata({
  title: "Official OpenlyMarket Links, Community, and Resources",
  description:
    "Access all official OpenlyMarket links, community channels, marketplace resources, and support pages from a single verified destination.",
  path: "/link",
});

type LinkItem = {
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
  priority?: boolean;
  external?: boolean;
};

const LINKS: LinkItem[] = [
  {
    title: "Marketplace",
    description: "Browse verified listings & services",
    href: "/market",
    priority: true,
  },
  {
    title: "Become a Seller",
    description: "Start selling in minutes",
    href: "/become-seller",
  },
  {
    title: "Escrow Protection",
    description: "How our smart contracts keep you safe",
    href: "/secure-transaction",
  },
  {
    title: "Official Telegram",
    description: "Join our community",
    href: "https://t.me/openlymarket",
    external: true,
  },
  {
    title: "Check on Pump.fun",
    description: "View our token",
    href: "https://pump.fun/board", // Placeholder, user might want to update this
    external: true,
    icon: (
      <Image
        src={pumpFunLogo}
        alt="Pump.fun"
        width={24}
        height={24}
        className="w-6 h-6 object-contain"
      />
    ),
  },
  {
    title: "Support / FAQ",
    description: "Get help & answers",
    href: "/faq",
  },
];

type SocialItem = {
  icon: React.ReactNode;
  href: string;
  label: string;
  color?: string; // Colore specifico per hover/bg
};

const SOCIALS: SocialItem[] = [
  {
    icon: (
      <svg
        viewBox="0 0 300 300.251"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 fill-current"
      >
        <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"/>
      </svg>
    ),
    href: "https://x.com/openlymarket",
    label: "Twitter",
    color: "hover:text-white hover:bg-zinc-800", // Default white/zinc for X
  },
  {
    icon: (
      <svg
        viewBox="0 0 1024 1024"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 fill-current"
      >
        <path fillRule="evenodd" clipRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z" transform="scale(64)" />
      </svg>
    ),
    href: "https://github.com/openlydev",
    label: "GitHub",
    color: "hover:text-white hover:bg-[#24292e]/80", // GitHub dark
  },
];

export default function LinkPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-12">
        
        {/* Header Profile */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-500 to-white/20 rounded-full opacity-30 blur group-hover:opacity-50 transition duration-500"></div>
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-zinc-900 flex items-center justify-center shadow-2xl shadow-black/50">
               <Image 
                 src={profileImage} 
                 alt="OpenlyMarket Profile"
                 fill
                 className="object-cover"
                 priority
               />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm flex items-center justify-center gap-2">
              OpenlyMarket
              <svg
                viewBox="0 0 56 56"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 fill-white"
              >
                <path d="M 23.6641 52.3985 C 26.6172 55.375 29.3594 55.3516 32.3126 52.3985 L 35.9219 48.8125 C 36.2969 48.4610 36.6250 48.3203 37.1172 48.3203 L 42.1797 48.3203 C 46.3749 48.3203 48.3204 46.3985 48.3204 42.1797 L 48.3204 37.1172 C 48.3204 36.625 48.4610 36.2969 48.8124 35.9219 L 52.3749 32.3125 C 55.3749 29.3594 55.3514 26.6172 52.3749 23.6641 L 48.8124 20.0547 C 48.4610 19.7031 48.3204 19.3516 48.3204 18.8829 L 48.3204 13.7969 C 48.3204 9.625 46.3985 7.6563 42.1797 7.6563 L 37.1172 7.6563 C 36.6250 7.6563 36.2969 7.5391 35.9219 7.1875 L 32.3126 3.6016 C 29.3594 .6250 26.6172 .6485 23.6641 3.6016 L 20.0547 7.1875 C 19.7032 7.5391 19.3516 7.6563 18.8828 7.6563 L 13.7969 7.6563 C 9.6016 7.6563 7.6563 9.5782 7.6563 13.7969 L 7.6563 18.8829 C 7.6563 19.3516 7.5391 19.7031 7.1876 20.0547 L 3.6016 23.6641 C .6251 26.6172 .6485 29.3594 3.6016 32.3125 L 7.1876 35.9219 C 7.5391 36.2969 7.6563 36.625 7.6563 37.1172 L 7.6563 42.1797 C 7.6563 46.3750 9.6016 48.3203 13.7969 48.3203 L 18.8828 48.3203 C 19.3516 48.3203 19.7032 48.4610 20.0547 48.8125 Z M 24.0391 39.7891 C 23.3126 39.7891 22.8438 39.5547 22.4923 39.1563 L 14.6641 30.4609 C 14.3360 30.0860 14.1485 29.6172 14.1485 29.125 C 14.1485 28.0234 14.9923 27.2031 16.1876 27.2031 C 16.8204 27.2031 17.2891 27.4141 17.7110 27.8594 L 23.9219 34.7266 L 35.9923 17.7344 C 36.4610 17.0547 36.9297 16.7734 37.7501 16.7734 C 38.8985 16.7734 39.7188 17.6172 39.7188 18.7188 C 39.7188 19.1172 39.5547 19.5860 39.2969 19.9609 L 25.6328 39.0625 C 25.2813 39.5078 24.7423 39.7891 24.0391 39.7891 Z" />
              </svg>
            </h1>
            <p className="text-sm text-zinc-400 font-medium tracking-wide">The Decentralized Marketplace on Solana</p>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4 pt-2">
            {SOCIALS.map((social, idx) => (
              <a
                key={idx}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "p-3 rounded-full border border-white/5 transition-all duration-300",
                  social.color || "text-zinc-400 hover:text-white hover:bg-zinc-800 hover:scale-110 hover:border-white/20"
                )}
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Links List */}
        <div className="space-y-4">
            <LinkList />
        </div>

      </div>
    </div>
  );
}

function LinkList() {
    return (
        <>
          {LINKS.map((link, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <LinkCard link={link} />
            </motion.div>
          ))}
        </>
    )
}

function LinkCard({ link }: { link: LinkItem }) {
  const isExternal = link.external;

  const card = (
    <div
      className={cn(
        "relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 w-full",
        "bg-zinc-900/40 border-white/5 backdrop-blur-md",
        "hover:bg-zinc-800/60 hover:border-white/10 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-black/20",
        link.priority && "border-white/10 bg-zinc-900/60 shadow-lg shadow-black/10"
      )}
    >
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2">
          {link.icon && (
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              {link.icon}
            </div>
          )}
          <span className="text-base font-bold text-zinc-100 group-hover:text-white tracking-tight">
            {link.title}
          </span>
        </div>
        <span
          className={cn(
            "text-xs text-zinc-500 group-hover:text-zinc-400 font-medium",
            link.icon && "pl-8"
          )}
        >
          {link.description}
        </span>
      </div>

      <div className="pl-4 text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
        <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100" />
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className="block group w-full">
        {card}
      </a>
    );
  }

  return (
    <Link href={link.href} className="block group w-full">
      {card}
    </Link>
  );
}
