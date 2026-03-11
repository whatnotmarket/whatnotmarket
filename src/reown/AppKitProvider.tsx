"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { wagmiAdapter, wagmiConfig, projectId, networks } from "@/reown/appkitConfig";

const queryClient = new QueryClient();

if (!projectId) {
  throw new Error("NEXT_PUBLIC_APPKIT_PROJECT_ID is not defined");
}

const metadata = {
  name: "openlymarket-appkit-test",
  description: "OpenlyMarket AppKit test",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  icons: ["/logowhite.svg"],
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: networks as [typeof networks[number], ...typeof networks[number][]],
  defaultNetwork: networks[0],
  metadata,
  features: {
    analytics: false,
    email: true,
    socials: ["google", "apple"],
  },
});

export function AppKitProvider({
  cookies,
  children,
}: {
  cookies: string | null;
  children: React.ReactNode;
}) {
  const initialState = cookieToInitialState(wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

