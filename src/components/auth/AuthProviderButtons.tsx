"use client";

import { Apple, Chrome, Loader2, Mail, Send, Wallet } from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/Button";

export type AuthButtonProvider = "email" | "google" | "apple" | "wallet" | "telegram";

type Props = {
  mode: "signin" | "signup";
  loadingProvider: AuthButtonProvider | null;
  onSelect: (provider: AuthButtonProvider) => void;
  emailLabel: string;
};

const providerRows: Array<{
  id: AuthButtonProvider;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: "email", label: "Continue with Email", icon: Mail },
  { id: "google", label: "Continue with Google", icon: Chrome },
  { id: "apple", label: "Continue with Apple", icon: Apple },
  { id: "wallet", label: "Continue with Wallet Connect", icon: Wallet },
  { id: "telegram", label: "Continue with Telegram", icon: Send },
];

export function AuthProviderButtons({
  mode,
  loadingProvider,
  onSelect,
  emailLabel,
}: Props) {
  return (
    <div className="space-y-3">
      {providerRows.map((provider) => {
        const isLoading = loadingProvider === provider.id;
        const Icon = provider.icon;

        return (
          <Button
            key={`${mode}-${provider.id}`}
            type="button"
            variant="outline"
            onClick={() => onSelect(provider.id)}
            disabled={!!loadingProvider}
            className="h-11 w-full justify-start border-zinc-800 bg-zinc-900/50 text-zinc-200 hover:bg-zinc-800/60"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icon className="mr-2 h-4 w-4" />
            )}
            {provider.id === "email" ? emailLabel : provider.label}
          </Button>
        );
      })}
    </div>
  );
}
