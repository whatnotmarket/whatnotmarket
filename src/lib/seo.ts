import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-config";

export const DEFAULT_SEO_DESCRIPTION =
  "OpenlyMarket is a secure marketplace for buyers and sellers with escrow-style transaction flows, trusted profiles, and crypto-friendly commerce.";

export const NOINDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      "max-image-preview": "none",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

type IndexableMetadataInput = {
  title: string;
  description: string;
  path?: string;
};

export function buildIndexableMetadata({
  title,
  description,
  path,
}: IndexableMetadataInput): Metadata {
  const canonicalPath = path
    ? path.startsWith("/")
      ? path
      : `/${path}`
    : undefined;
  const url = canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined;

  return {
    title,
    description,
    alternates: canonicalPath
      ? {
          canonical: canonicalPath,
        }
      : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "OpenlyMarket",
      images: [
        {
          url: "/images/ico/faviconbianco.ico",
          alt: "OpenlyMarket",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/ico/faviconbianco.ico"],
    },
  };
}
