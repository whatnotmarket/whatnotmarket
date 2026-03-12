import type { Metadata, Viewport } from "next";
import { Geist, Inter } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FaviconAttention } from "@/components/FaviconAttention";
import { PrivacyCardWrapper } from "@/components/PrivacyCardWrapper";
import Providers from "@/components/providers";
import AckeeTracker from "@/components/providers/AckeeTracker";
import { ConsentTrackingScripts } from "@/components/providers/ConsentTrackingScripts";
import { FeaturebaseMessenger } from "@/components/providers/FeaturebaseMessenger";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import "./globals.css";
import { ORIGINAL_LANGUAGE } from "@/lib/language-policy";
import { SITE_URL } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "OpenlyMarket",
  description: "Secure buyer/seller marketplace.",
  creator: "openlymarket.xyz",
  publisher: "openlymarket.xyz",
  metadataBase: new URL(SITE_URL),
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
    title: "OpenlyMarket",
  },
  other: {
    google: "notranslate",
    "profile:x": "https://x.com/openlymarket",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Openly Market",
      url: SITE_URL,
      email: "support@openlymarket.xyz",
      description:
        "Openly Market is a Web3 platform for blockchain-enabled marketplace activity and decentralized-native commerce.",
      sameAs: ["https://x.com/openlymarket"],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "support@openlymarket.xyz",
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Openly Market",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#application`,
      name: "Openly Market",
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "A Web3 marketplace application for blockchain-enabled commerce, decentralized discovery, and digital asset oriented user flows.",
      provider: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
  ],
};

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
        <Script
          type="application/ld+json"
          id="schema-jsonld"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <ConsentTrackingScripts />
        <FeaturebaseMessenger />

        <PostHogProvider>
          <Providers>
            <div className="flex-1 bg-black">
              <Suspense fallback={null}>
                <AckeeTracker />
              </Suspense>
              {children}
            </div>
            <PrivacyCardWrapper />
          </Providers>
        </PostHogProvider>
        <Analytics />
        <SpeedInsights />
        <FaviconAttention />
      </body>
    </html>
  );
}
