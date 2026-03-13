import type { Metadata, Viewport } from "next";
import { Geist, Inter } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FaviconAttention } from "@/components/FaviconAttention";
import { PrivacyCardWrapper } from "@/components/PrivacyCardWrapper";
import { SeoInternalLinks } from "@/components/SeoInternalLinks";
import Providers from "@/components/providers";
import AckeeTracker from "@/components/providers/AckeeTracker";
import { ConsentTrackingScripts } from "@/components/providers/ConsentTrackingScripts";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import "./globals.css";
import { SITE_URL } from "@/lib/site-config";
import { DEFAULT_SEO_DESCRIPTION } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/i18n/config";

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
  title: {
    default: "OpenlyMarket | Secure Crypto Marketplace for Buyers and Sellers",
    template: "%s | OpenlyMarket",
  },
  description: DEFAULT_SEO_DESCRIPTION,
  creator: "openlymarket.xyz",
  publisher: "openlymarket.xyz",
  metadataBase: new URL(SITE_URL),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "OpenlyMarket | Secure Crypto Marketplace for Buyers and Sellers",
    description: DEFAULT_SEO_DESCRIPTION,
    url: SITE_URL,
    siteName: "OpenlyMarket",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logowhite.svg",
        alt: "OpenlyMarket",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenlyMarket | Secure Crypto Marketplace for Buyers and Sellers",
    description: DEFAULT_SEO_DESCRIPTION,
    images: ["/logowhite.svg"],
  },
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const htmlLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? null);

  return (
    <html
      lang={htmlLocale}
      translate="no"
      className={cn("dark notranslate overflow-x-hidden overflow-y-auto", "font-sans", geist.variable)}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} ${inter.className} notranslate overflow-x-hidden overflow-y-auto antialiased bg-black text-white`}
        suppressHydrationWarning
      >
        <Script
          type="application/ld+json"
          id="schema-jsonld"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <ConsentTrackingScripts />

        <PostHogProvider>
          <Providers>
            <div id="app-root-shell" className="bg-black overflow-visible">
              <Suspense fallback={null}>
                <AckeeTracker />
              </Suspense>
              {children}
              <SeoInternalLinks />
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
