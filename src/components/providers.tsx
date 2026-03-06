"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ReactNode, useState } from "react";
import { Toaster } from "sonner";
import { CartProvider } from "@/contexts/CartContext";
import { CryptoProvider } from "@/contexts/CryptoContext";
import { UserProvider } from "@/contexts/UserContext";
import { WalletProvider } from "@/contexts/WalletContext";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <WalletProvider>
          <CryptoProvider>
            <CartProvider>
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
                {children}
                <Toaster position="top-center" richColors theme="dark" />
              </ThemeProvider>
            </CartProvider>
          </CryptoProvider>
        </WalletProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}
