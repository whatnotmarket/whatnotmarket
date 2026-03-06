"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase";
import {
  AuthProviderButtons,
  type AuthButtonProvider,
} from "@/components/auth/AuthProviderButtons";
import { useWallet } from "@/contexts/WalletContext";

type AuthTab = "login" | "signup";
type AuthMode = "signin" | "signup";

type TelegramWindow = Window & {
  Telegram?: {
    Login?: {
      auth: (
        options: { bot_id: number; request_access?: boolean },
        callback: (user: Record<string, unknown> | false) => void
      ) => void;
    };
  };
};

function normalizeNextPath(rawNext: string | null) {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return "/market";
  }
  return rawNext;
}

function modeForTab(tab: AuthTab): AuthMode {
  return tab === "signup" ? "signup" : "signin";
}

function buildTelegramFallbackUrl(params: {
  mode: AuthMode;
  nextPath: string;
  inviteCode: string | null;
}) {
  const query = new URLSearchParams({
    mode: params.mode,
    next: params.nextPath,
  });

  if (params.mode === "signup" && params.inviteCode) {
    query.set("inviteCode", params.inviteCode);
  }

  return `/api/auth/external/telegram/start?${query.toString()}`;
}

let telegramSdkLoadingPromise: Promise<void> | null = null;

function ensureTelegramSdkLoaded() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const typedWindow = window as TelegramWindow;
  if (typedWindow.Telegram?.Login?.auth) {
    return Promise.resolve();
  }

  if (telegramSdkLoadingPromise) {
    return telegramSdkLoadingPromise;
  }

  telegramSdkLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-telegram-login-sdk="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Telegram SDK failed to load")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.defer = true;
    script.dataset.telegramLoginSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Telegram SDK failed to load"));
    document.head.appendChild(script);
  });

  return telegramSdkLoadingPromise;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const wallet = useWallet();

  const nextPath = normalizeNextPath(searchParams.get("next"));

  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [hasInviteCode, setHasInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [loadingProvider, setLoadingProvider] = useState<AuthButtonProvider | null>(null);

  useEffect(() => {
    const authStatus = searchParams.get("auth_status");
    const authMessage = searchParams.get("auth_message");
    if (!authStatus) return;

    if (authStatus === "cancelled") {
      toast.info(authMessage || "Authentication cancelled.");
    } else if (authStatus === "success") {
      toast.success(authMessage || "Authentication successful.");
    } else if (authStatus === "error") {
      toast.error(authMessage || "Authentication failed.");
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth_status");
    params.delete("auth_message");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/login?${nextQuery}` : "/login");
  }, [router, searchParams]);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted || !session) return;
      router.replace(nextPath);
    };

    checkSession();
    return () => {
      mounted = false;
    };
  }, [nextPath, router, supabase.auth]);

  const startAuth0 = async (
    provider: AuthButtonProvider,
    opts?: { silentFallback?: boolean }
  ) => {
    const mode = modeForTab(activeTab);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedInvite = inviteCode.trim().toUpperCase();

    if (provider === "email" && !normalizedEmail) {
      toast.error("Email is required.");
      return false;
    }

    if (mode === "signup" && hasInviteCode && !normalizedInvite) {
      toast.error("Invite code is required when enabled.");
      return false;
    }

    setLoadingProvider(provider);

    try {
      const response = await fetch("/api/auth/auth0/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          mode,
          next: nextPath,
          email: normalizedEmail || undefined,
          inviteCode: mode === "signup" && hasInviteCode ? normalizedInvite : "",
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { redirectUrl?: string; error?: string }
        | null;

      if (!response.ok || !payload?.redirectUrl) {
        if (opts?.silentFallback) {
          setLoadingProvider(null);
          return false;
        }
        throw new Error(payload?.error || "Unable to start authentication.");
      }

      window.location.assign(payload.redirectUrl);
      return true;
    } catch (error) {
      setLoadingProvider(null);
      if (!opts?.silentFallback) {
        toast.error(error instanceof Error ? error.message : "Unable to start authentication.");
      }
      return false;
    }
  };

  const startWalletAuth = async () => {
    const mode = modeForTab(activeTab);
    const normalizedInvite = inviteCode.trim().toUpperCase();

    if (mode === "signup" && hasInviteCode && !normalizedInvite) {
      toast.error("Invite code is required when enabled.");
      return;
    }

    setLoadingProvider("wallet");

    try {
      const connected =
        wallet.status === "connected" && wallet.address && wallet.chainId
          ? { address: wallet.address, chainId: wallet.chainId }
          : await wallet.connect("walletconnect");

      const challengeResponse = await fetch("/api/auth/external/wallet/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: connected.address,
          chain: connected.chainId,
          mode,
          inviteCode: mode === "signup" && hasInviteCode ? normalizedInvite : "",
          next: nextPath,
        }),
      });

      const challengePayload = (await challengeResponse.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!challengeResponse.ok || !challengePayload?.message) {
        throw new Error(challengePayload?.error || "Unable to create wallet challenge.");
      }

      const signature = await wallet.signMessage(challengePayload.message);
      const verifyResponse = await fetch("/api/auth/external/wallet/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signature }),
      });

      const verifyPayload = (await verifyResponse.json().catch(() => null)) as
        | { ok?: boolean; redirectTo?: string; roleMessage?: string | null; error?: string }
        | null;

      if (!verifyResponse.ok || !verifyPayload?.ok || !verifyPayload.redirectTo) {
        throw new Error(verifyPayload?.error || "Wallet authentication failed.");
      }

      if (verifyPayload.roleMessage) {
        toast.info(verifyPayload.roleMessage);
      } else {
        toast.success("Wallet authentication successful.");
      }

      window.location.assign(verifyPayload.redirectTo);
    } catch (error) {
      setLoadingProvider(null);
      toast.error(error instanceof Error ? error.message : "Wallet authentication failed.");
    }
  };

  const startTelegramAuth = async () => {
    const mode = modeForTab(activeTab);
    const normalizedInvite = inviteCode.trim().toUpperCase();
    const botIdValue = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
    const botId = botIdValue ? Number(botIdValue) : NaN;

    if (!Number.isFinite(botId)) {
      toast.error("Telegram auth is not configured.");
      return;
    }

    if (mode === "signup" && hasInviteCode && !normalizedInvite) {
      toast.error("Invite code is required when enabled.");
      return;
    }

    setLoadingProvider("telegram");

    try {
      await ensureTelegramSdkLoaded();
      const telegramWindow = window as TelegramWindow;

      const userPayload = await new Promise<Record<string, unknown>>((resolve, reject) => {
        telegramWindow.Telegram?.Login?.auth(
          { bot_id: botId, request_access: true },
          (result) => {
            if (!result) {
              reject(new Error("Telegram login cancelled."));
              return;
            }
            resolve(result);
          }
        );
      });

      const response = await fetch("/api/auth/external/telegram/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegramAuth: userPayload,
          mode,
          inviteCode: mode === "signup" && hasInviteCode ? normalizedInvite : "",
          next: nextPath,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; redirectTo?: string; roleMessage?: string | null; error?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.redirectTo) {
        throw new Error(payload?.error || "Telegram authentication failed.");
      }

      if (payload.roleMessage) {
        toast.info(payload.roleMessage);
      } else {
        toast.success("Telegram authentication successful.");
      }

      window.location.assign(payload.redirectTo);
    } catch (error) {
      setLoadingProvider(null);
      toast.error(
        error instanceof Error
          ? `${error.message} You can use Telegram fallback login.`
          : "Telegram authentication failed. You can use Telegram fallback login."
      );
    }
  };

  const startTelegramFallback = () => {
    const mode = modeForTab(activeTab);
    const normalizedInvite = inviteCode.trim().toUpperCase();

    if (mode === "signup" && hasInviteCode && !normalizedInvite) {
      toast.error("Invite code is required when enabled.");
      return;
    }

    const fallbackUrl = buildTelegramFallbackUrl({
      mode,
      nextPath,
      inviteCode: mode === "signup" && hasInviteCode ? normalizedInvite : null,
    });

    window.location.assign(fallbackUrl);
  };

  const handleProviderSelect = async (provider: AuthButtonProvider) => {
    if (provider === "wallet") {
      const redirected = await startAuth0("wallet", { silentFallback: true });
      if (redirected) return;
      await startWalletAuth();
      return;
    }

    if (provider === "telegram") {
      const redirected = await startAuth0("telegram", { silentFallback: true });
      if (redirected) return;
      await startTelegramAuth();
      return;
    }

    await startAuth0(provider);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center px-6">
          <Link href="/market" className="inline-flex items-center gap-2">
            <Image
              src="/logowhite.svg"
              alt="Whatnot Market"
              width={96}
              height={32}
              className="h-7 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      <main className="relative flex min-h-[calc(100vh-56px)] items-center justify-center overflow-hidden px-6 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black" />

        <div className="z-10 w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              {activeTab === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-zinc-400">
              {activeTab === "login"
                ? "Sign in with Auth0-native and external providers"
                : "Sign up with invite-aware role assignment"}
            </p>
          </div>

          <div className="relative flex w-full rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
            {(["login", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="loginTab"
                    className="absolute inset-0 -z-10 rounded-md bg-zinc-800"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                {tab === "login" ? "Sign-in" : "Signup"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Email
              </label>
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-zinc-800 bg-zinc-900/50 focus:border-white/20"
              />
            </div>

            <AnimatePresence>
              {activeTab === "signup" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                      Do you have an invite code?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setHasInviteCode(true)}
                        className={`h-10 rounded-md border text-sm transition-colors ${
                          hasInviteCode
                            ? "border-white/30 bg-white/10 text-white"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasInviteCode(false)}
                        className={`h-10 rounded-md border text-sm transition-colors ${
                          !hasInviteCode
                            ? "border-white/30 bg-white/10 text-white"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {hasInviteCode && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Invite code
                      </label>
                      <Input
                        type="text"
                        required
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="SELLER-XXXXXX or BUYER-XXXXXX"
                        className="h-11 border-zinc-800 bg-zinc-900/50 font-mono tracking-wide focus:border-white/20"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AuthProviderButtons
              mode={modeForTab(activeTab)}
              loadingProvider={loadingProvider}
              onSelect={handleProviderSelect}
              emailLabel={
                activeTab === "login" ? "Continue with Email Passwordless" : "Signup with Email Passwordless"
              }
            />

            <button
              type="button"
              onClick={startTelegramFallback}
              className="w-full text-center text-xs text-zinc-400 underline decoration-zinc-600 underline-offset-4 transition-colors hover:text-zinc-200"
            >
              Telegram popup stuck? Use Telegram fallback login
            </button>
          </div>

          {wallet.status === "connected" && wallet.address && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
              Wallet connected: <span className="font-mono">{wallet.address}</span>
            </div>
          )}

          {wallet.status === "error" && wallet.error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              Wallet error: {wallet.error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
