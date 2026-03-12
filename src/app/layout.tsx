import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { ORIGINAL_LANGUAGE } from "@/lib/language-policy";
import { FaviconAttention } from "@/components/FaviconAttention";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "OpenlyMarket",
  description: "Secure buyer/seller marketplace.",
  creator: "openlymarket.xyz",
  publisher: "openlymarket.xyz",
  metadataBase: new URL("https://openlymarket.xyz"),
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

// Trigger Vercel build
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { PrivacyCard } from "@/components/global-chat/PrivacyCard";
import AckeeTracker from "@/components/providers/AckeeTracker";
import { Suspense } from "react";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://openlymarket.xyz/#organization",
      "name": "Openly Market",
      "url": "https://openlymarket.xyz",
      "email": "support@openlymarket.xyz",
      "description": "Openly Market is a Web3 platform for blockchain-enabled marketplace activity and decentralized-native commerce.",
      "sameAs": [
        "https://x.com/openlymarket"
      ],
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "email": "support@openlymarket.xyz"
        }
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://openlymarket.xyz/#website",
      "url": "https://openlymarket.xyz",
      "name": "Openly Market",
      "publisher": {
        "@id": "https://openlymarket.xyz/#organization"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://openlymarket.xyz/#application",
      "name": "Openly Market",
      "url": "https://openlymarket.xyz",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "A Web3 marketplace application for blockchain-enabled commerce, decentralized discovery, and digital asset oriented user flows.",
      "provider": {
        "@id": "https://openlymarket.xyz/#organization"
      }
    }
  ]
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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || "G-6VVJS4Z32J"}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || "G-6VVJS4Z32J"}');
          `}
        </Script>
        <Script id="x-pixel" strategy="afterInteractive">
          {`
            !function(e,t,n,s,u,a){
              e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},
              s.version='1.1',
              s.queue=[],
              u=t.createElement(n),
              u.async=!0,
              u.src='https://static.ads-twitter.com/uwt.js',
              a=t.getElementsByTagName(n)[0],
              a.parentNode.insertBefore(u,a))
            }(window,document,'script');
            twq('config','pl5u0');
            twq('track','PageView');
          `}
        </Script>
        <PostHogProvider>
          <Providers>
            <div className="flex-1 bg-black">
              <Suspense fallback={null}>
                <AckeeTracker />
              </Suspense>
              {children}
            </div>
            <Footer />
            <PrivacyCard />
          </Providers>
        </PostHogProvider>
        <Analytics />
        <SpeedInsights />
        <FaviconAttention />
      </body>
    </html>
  );
}

