import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { ORIGINAL_LANGUAGE } from "@/lib/language-policy";
import { FaviconAttention } from "@/components/FaviconAttention";

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
  description: "Secure buyer/seller marketplace.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/favicons/favicon-base-32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicons/favicon-base-16.png",
        sizes: "16x16",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicons/favicon-alert-32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicons/favicon-alert-16.png",
        sizes: "16x16",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [{ url: "/pwa-assets/pwa-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: ["/favicons/favicon-base-32.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Whatnot Market",
  },
  other: {
    google: "notranslate",
  },
};

// Trigger Vercel build
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang={ORIGINAL_LANGUAGE.code} 
      translate="no" 
      className={cn("dark notranslate", "font-sans", geist.variable)}
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
        <SpeedInsights />
        <FaviconAttention />
      </body>
    </html>
  );
}
