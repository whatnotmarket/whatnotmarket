"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";
import { ReactNode, useEffect, useState } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { CryptoProvider } from "@/contexts/CryptoContext";
import { UserProvider } from "@/contexts/UserContext";
import { WalletProvider } from "@/contexts/WalletContext";

const NotificationToasters = dynamic(() => import("@/components/notification-toasters"), {
  ssr: false,
  loading: () => null,
});

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [showToasters, setShowToasters] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowToasters(true);
    }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <WalletProvider>
          <CryptoProvider>
            <CartProvider>
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="openlymarket-theme">
                {children}
                {showToasters ? <NotificationToasters /> : null}
              </ThemeProvider>
            </CartProvider>
          </CryptoProvider>
        </WalletProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}
