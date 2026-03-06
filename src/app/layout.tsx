import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { ORIGINAL_LANGUAGE } from "@/lib/language-policy";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Whatnot Market",
  description: "Private, invitation-only marketplace.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Whatnot Market",
  },
  other: {
    google: "notranslate",
  },
};

import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang={ORIGINAL_LANGUAGE.code} 
      translate="no" 
      className="dark notranslate"
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} ${inter.className} notranslate antialiased bg-black text-white min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="relative z-10 flex-1 bg-black">
            {children}
          </div>
          <div className="sticky bottom-0 z-0">
            <Footer />
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
