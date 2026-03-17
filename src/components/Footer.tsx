"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/primitives/container";
import { Squircle } from "@/components/ui/Squircle";
import { Send } from "lucide-react";

import { CurrencyIcon } from "@/components/market/CurrencyIcon";

export function Footer() {
  const pathname = usePathname();
  if (
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/admintest" ||
    pathname.startsWith("/admintest/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
    || pathname === "/"
    || pathname === "/install"
    || pathname.startsWith("/install/")
  ) {
    return null;
  }

  return (
    <footer className="relative pt-16 pb-8 text-sm">
      <Squircle 
        as="div" 
        radius={24} 
        smoothing={1} 
        corners="top"
        borderWidth={1}
        borderColor="rgba(39, 39, 42, 1)"
        className="absolute inset-0 w-full h-full pointer-events-none"
        innerClassName="bg-[#1C1C1E]"
      />
      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-1 space-y-8">
            <Link href="/" className="block">
              <div className="relative w-40 h-10">
                <Image 
                  src="/images/svg/openly-logowhite.svg" 
                  alt="OpenlyMarket" 
                  fill 
                  className="object-contain object-left" 
                  priority
                />
              </div>
            </Link>

            <div className="relative w-32 h-10">
                <Image 
                  src="/images/webp/openly-swiss_made.webp" 
                  alt="Swiss Made" 
                  fill 
                  className="object-contain object-left" 
                />
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            
            {/* Column 1 */}
            <div className="space-y-4">
              <h4 className="font-bold text-white">About OpenlyMarket</h4>
              <ul className="space-y-2 text-zinc-400">
                <li><Link href="/about" className="hover:text-white transition-colors">What is OpenlyMarket?</Link></li>
                <li><Link href="/install" className="hover:text-white transition-colors">Download App</Link></li>
                <li><Link href="/redeem" className="hover:text-white transition-colors">Loyalty Program</Link></li>
                <li><Link href="/roadmap" className="hover:text-white transition-colors">Newsroom</Link></li>
                <li><Link href="/requests" className="hover:text-white transition-colors">Reviews</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <h4 className="font-bold text-white">Popular Categories</h4>
              <ul className="space-y-2 text-zinc-400">
                <li><Link href="/category/electronics" className="hover:text-white transition-colors">Electronics</Link></li>
                <li><Link href="/category/fashion" className="hover:text-white transition-colors">Fashion</Link></li>
                <li><Link href="/category/home-garden" className="hover:text-white transition-colors">Home &amp; Garden</Link></li>
                <li><Link href="/category/collectibles" className="hover:text-white transition-colors">Collectibles</Link></li>
                <li><Link href="/category/services" className="hover:text-white transition-colors">Services</Link></li>
                <li><Link href="/requests" className="hover:text-white transition-colors">Buyer Requests</Link></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              <h4 className="font-bold text-white">Help & Support</h4>
              <ul className="space-y-2 text-zinc-400">
                <li><Link href="/faq" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">Compatible Devices</Link></li>
                <li><Link href="/fee-calculator" className="hover:text-white transition-colors">Fee Calculator</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Support 24/7</Link></li>
                <li><Link href="/secure-transaction" className="hover:text-white transition-colors">Payment Methods</Link></li>
                <li><Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div className="space-y-4">
              <h4 className="font-bold text-white">For Partners</h4>
              <ul className="space-y-2 text-zinc-400">
                <li><Link href="/business" className="hover:text-white transition-colors">Trusted Partners</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">Media Kit</Link></li>
                <li><Link href="/broker" className="hover:text-white transition-colors">OpenlyMarket for Business</Link></li>
                <li><Link href="/promote-listings" className="hover:text-white transition-colors">Referral Program</Link></li>
                <li><Link href="/become-seller" className="hover:text-white transition-colors">Affiliate Program</Link></li>
                <li><Link href="/open-source" className="hover:text-white transition-colors">API Integration</Link></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            
            {/* Payment Methods */}
            <div className="flex flex-wrap items-center gap-3 opacity-80">
                {["BTC", "ETH", "USDT", "USDC", "SOL", "LTC", "TRX"].map((currency) => (
                    <div key={currency} className="hover:scale-110 transition-transform">
                        <CurrencyIcon currency={currency} />
                    </div>
                ))}
            </div>

            {/* Socials */}
            <div className="flex items-center gap-4">
                <Link href="#" className="p-2 bg-[#229ED9] rounded-full hover:bg-[#1e8cc2] transition-colors">
                    <Send className="w-5 h-5 text-white fill-current ml-0.5" />
                </Link>
                <Link
                  href="https://x.com/openlymarket"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white transition-colors"
                >
                  x.com/openlymarket
                </Link>
            </div>
        </div>

        {/* Copyright & Legal */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
            <div className="flex flex-wrap justify-center gap-6">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
                <span>Â© 2026 OpenlyMarket</span>
                <span>openly.market</span>
            </div>
            <div className="text-center md:text-right">
                OpenlyMarket Ltd; 123 Blockchain Ave, Crypto City; REG NO: WM-2026-X
            </div>
        </div>
      </Container>
    </footer>
  );
}

