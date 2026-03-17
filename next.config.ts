import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const supabaseHostname = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

const twicPicsHostname = (() => {
  const value = (process.env.NEXT_PUBLIC_TWICPICS_DOMAIN ?? "").trim();
  if (!value) return "";
  try {
    return value.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  } catch {
    return "";
  }
})();

const shouldDisablePwa = (() => {
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.DISABLE_PWA === "true") return true;
  if (process.env.NEXT_PUBLIC_DISABLE_PWA === "true") return true;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(appUrl);
})();

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
  },
  reactCompiler: true,
  productionBrowserSourceMaps: false,
  // Silence Turbopack error for webpack plugins (next-pwa)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  turbopack: {} as any,
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        port: "",
        pathname: "/**",
      },
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              port: "",
              pathname: "/**",
            },
          ]
        : []),
      ...(twicPicsHostname
        ? [
            {
              protocol: "https" as const,
              hostname: twicPicsHostname,
              port: "",
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*.(png|jpg|jpeg|gif|svg|ico|webp)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/fees",
        destination: "/fee-calculator",
        permanent: true,
      },
      {
        source: "/sellers",
        destination: "/sell",
        permanent: true,
      },
      {
        source: "/api-docs",
        destination: "/open-source",
        permanent: true,
      },
      {
        source: "/trust",
        destination: "/secure-transaction",
        permanent: true,
      },
      {
        source: "/favicon.ico",
        destination: "/images/ico/faviconbianco.ico",
        permanent: true,
      },
    ];
  },
};

const withPWAConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: shouldDisablePwa,
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWAConfig(nextConfig);
