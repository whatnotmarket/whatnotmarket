import type { NextConfig } from "next";

const posthogLiteEntry = "posthog-js/dist/module.js";

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

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
  },
  turbopack: {
    resolveAlias: {
      "posthog-js/lite": posthogLiteEntry,
    },
  },
  reactCompiler: true,
  productionBrowserSourceMaps: false,
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "posthog-js/lite": posthogLiteEntry,
    };
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
    ];
  },
};
export default nextConfig;
