"use client";

import Image from "next/image";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useAppKitWallet } from "@reown/appkit-wallet-button/react";
import { useChainId } from "wagmi";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { AppKitProvider } from "@/reown/AppKitProvider";

export const dynamic = "force-dynamic";
const carouselImages = ["/affiliate-bg.svg", "/framehero.svg", "/notifiche.svg"] as const;

const buttonBase =
  "relative w-full h-[52px] rounded-[14px] border border-[#3b3b3b] flex items-center justify-center text-[17px] font-[Inter] transition active:scale-[0.99] cursor-pointer";
const buttonBlue = `${buttonBase} bg-[#2761f3] text-white`;
const buttonWhite = `${buttonBase} bg-white text-black`;

type ProviderKey = "walletConnect" | "metamask" | "trust" | "google" | "apple";
type WalletProviderValue = "walletconnect" | "metamask" | "trustwallet" | "google" | "apple";
type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};

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

const providerValueMap: Record<ProviderKey, WalletProviderValue> = {
  walletConnect: "walletconnect",
  metamask: "metamask",
  trust: "trustwallet",
  google: "google",
  apple: "apple",
};

const providerLabelMap: Record<WalletProviderValue, string> = {
  walletconnect: "WalletConnect",
  metamask: "MetaMask",
  trustwallet: "Trust Wallet",
  google: "Google",
  apple: "Apple",
};

function normalizeNextPath(rawNext: string | null) {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return "/market";
  }

  if (
    rawNext === "/login" ||
    rawNext.startsWith("/login/") ||
    rawNext === "/auth" ||
    rawNext.startsWith("/auth/") ||
    rawNext === "/login" ||
    rawNext.startsWith("/login/")
  ) {
    return "/market";
  }

  return rawNext;
}

function toNameFromEmail(email: string | null | undefined) {
  if (!email) return null;

  const localPart = email.split("@")[0]?.trim();
  if (!localPart) return null;

  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return null;

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeChallengeChain(chainId: string | number | undefined | null) {
  if (typeof chainId === "number" && Number.isFinite(chainId)) {
    return `0x${chainId.toString(16)}`;
  }

  if (typeof chainId === "string") {
    const trimmed = chainId.trim().toLowerCase();
    if (!trimmed) return "0x1";

    if (trimmed.startsWith("0x")) {
      return trimmed;
    }

    if (/^\d+$/.test(trimmed)) {
      const parsed = Number.parseInt(trimmed, 10);
      if (Number.isFinite(parsed)) {
        return `0x${parsed.toString(16)}`;
      }
    }
  }

  return "0x1";
}

let telegramSdkLoadingPromise: Promise<void> | null = null;

async function signWithWalletProvider(params: {
  provider: Eip1193Provider;
  message: string;
  expectedAddress: string;
}) {
  const expectedLower = params.expectedAddress.toLowerCase();
  let signerAddress = params.expectedAddress;

  const resolveSignerAddress = async () => {
    const accountsRaw = await params.provider.request({
      method: "eth_accounts",
    });

    const accounts = Array.isArray(accountsRaw)
      ? accountsRaw.filter((value): value is string => typeof value === "string")
      : [];

    const matched = accounts.find((account) => account.toLowerCase() === expectedLower);
    signerAddress = matched || accounts[0] || params.expectedAddress;
  };

  await resolveSignerAddress();

  try {
    const signature = await params.provider.request({
      method: "personal_sign",
      params: [params.message, signerAddress],
    });
    if (typeof signature === "string") return signature;
  } catch {
    // Try eth_sign fallback for providers that reject personal_sign.
  }

  const ethSignSignature = await params.provider.request({
    method: "eth_sign",
    params: [signerAddress, params.message],
  });

  if (typeof ethSignSignature !== "string") {
    throw new Error("Invalid signature response.");
  }

  return ethSignSignature;
}

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

function WalletConnectIcon() {
  return (
    <svg className="h-6 w-6 shrink-0" viewBox="0 0 741 571" fill="none" aria-hidden="true">
      <g clipPath="url(#wc-clip)">
        <path
          d="M532.885 173.159L596.875 108.91C452.251 -36.3033 272.548 -36.3033 127.925 108.91L191.914 173.159C301.905 62.7192 422.968 62.7192 532.959 173.159H532.885Z"
          fill="white"
        />
        <path
          d="M511.608 322.855L362.376 173.016L213.144 322.855L63.9138 173.016L0 237.19L213.144 451.278L362.376 301.439L511.608 451.278L724.753 237.19L660.839 173.016L511.608 322.855Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="wc-clip">
          <rect width="741" height="571" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-6 w-6 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M30.0014 16.3109C30.0014 15.1598 29.9061 14.3198 29.6998 13.4487H16.2871V18.6442H24.1601C24.0014 19.9354 23.1442 21.8798 21.2394 23.1864L21.2127 23.3604L25.4536 26.58L25.7474 26.6087C28.4458 24.1665 30.0014 20.5731 30.0014 16.3109Z" fill="#4285F4" />
      <path d="M16.2863 29.9998C20.1434 29.9998 23.3814 28.7553 25.7466 26.6086L21.2386 23.1863C20.0323 24.0108 18.4132 24.5863 16.2863 24.5863C12.5086 24.5863 9.30225 22.1441 8.15929 18.7686L7.99176 18.7825L3.58208 22.127L3.52441 22.2841C5.87359 26.8574 10.699 29.9998 16.2863 29.9998Z" fill="#34A853" />
      <path d="M8.15964 18.769C7.85806 17.8979 7.68352 16.9645 7.68352 16.0001C7.68352 15.0356 7.85806 14.1023 8.14377 13.2312L8.13578 13.0456L3.67083 9.64746L3.52475 9.71556C2.55654 11.6134 2.00098 13.7445 2.00098 16.0001C2.00098 18.2556 2.55654 20.3867 3.52475 22.2845L8.15964 18.769Z" fill="#FBBC05" />
      <path d="M16.2864 7.4133C18.9689 7.4133 20.7784 8.54885 21.8102 9.4978L25.8419 5.64C23.3658 3.38445 20.1435 2 16.2864 2C10.699 2 5.8736 5.1422 3.52441 9.71549L8.14345 13.2311C9.30229 9.85555 12.5086 7.4133 16.2864 7.4133Z" fill="#EB4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-6 w-6 fill-current shrink-0" viewBox="0 0 788.1 1000" aria-hidden="true">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}

function MetaMaskMark() {
  return (
    <svg
      className="h-6 w-6 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 318.6 318.6"
      aria-hidden="true"
    >
      <path
        fill="#e2761b"
        stroke="#e2761b"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m274.1 35.5-99.5 73.9L193 65.8z"
      />
      <path
        fill="#e4761b"
        stroke="#e4761b"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m44.4 35.5 98.7 74.6-17.5-44.3zm193.9 171.3-26.5 40.6 56.7 15.6 16.3-55.3zm-204.4.9L50.1 263l56.7-15.6-26.5-40.6z"
      />
      <path
        fill="#e4761b"
        stroke="#e4761b"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m103.6 138.2-15.8 23.9 56.3 2.5-2-60.5zm111.3 0-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zm71.1-16.5 33.9 16.5-4.7-39.3z"
      />
      <path
        fill="#d7c1b3"
        stroke="#d7c1b3"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m211.8 247.4-33.9-16.5 2.7 22.1-.3 9.3zm-105 0 31.5 14.9-.2-9.3 2.5-22.1z"
      />
      <path
        fill="#233447"
        stroke="#233447"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m138.8 193.5-28.2-8.3 19.9-9.1zm40.9 0 8.3-17.4 20 9.1z"
      />
      <path
        fill="#cd6116"
        stroke="#cd6116"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m106.8 247.4 4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zm23.8-44.7-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zm-120.2 23.1 20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z"
      />
      <path
        fill="#e4751f"
        stroke="#e4751f"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m87.8 162.1 23.6 46-.8-22.9zm120.3 23.1-1 22.9 23.7-46zm-64-20.6-5.3 28.9 6.6 34.1 1.5-44.9zm30.5 0-2.7 18 1.2 45 6.7-34.1z"
      />
      <path
        fill="#f6851b"
        stroke="#f6851b"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m179.8 193.5-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zm-69.2-8.3.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z"
      />
      <path
        fill="#c0ad9e"
        stroke="#c0ad9e"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m180.3 262.3.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z"
      />
      <path
        fill="#161616"
        stroke="#161616"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m177.9 230.9-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z"
      />
      <path
        fill="#763d16"
        stroke="#763d16"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m278.3 114.2 8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z"
      />
      <path
        fill="#f6851b"
        stroke="#f6851b"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m267.2 153.5-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zm-163.6-15.3-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zm71 26.4 3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z"
      />
    </svg>
  );
}

function AnotherWalletMark() {
  return (
    <svg
      className="h-6 w-6 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 479 536"
      fill="none"
      aria-hidden="true"
    >
      <g clipPath="url(#trust-clip)">
        <path d="M0 77.4265L239.265 0V536C68.3591 464.527 0 327.55 0 250.14V77.4265Z" fill="#0500FF" />
        <path
          d="M478.548 77.4265L239.283 0V536C410.189 464.527 478.548 327.55 478.548 250.14V77.4265Z"
          fill="url(#trust-gradient)"
        />
      </g>
      <defs>
        <linearGradient id="trust-gradient" x1="414.992" y1="-37.5342" x2="235.7" y2="529.132" gradientUnits="userSpaceOnUse">
          <stop offset="0.02" stopColor="#0000FF" />
          <stop offset="0.08" stopColor="#0094FF" />
          <stop offset="0.16" stopColor="#48FF91" />
          <stop offset="0.42" stopColor="#0094FF" />
          <stop offset="0.68" stopColor="#0038FF" />
          <stop offset="0.9" stopColor="#0500FF" />
        </linearGradient>
        <clipPath id="trust-clip">
          <rect width="479" height="536" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function TelegramMark() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M41.4193 7.30899C41.4193 7.30899 45.3046 5.79399 44.9808 9.47328C44.8729 10.9883 43.9016 16.2908 43.1461 22.0262L40.5559 39.0159C40.5559 39.0159 40.3401 41.5048 38.3974 41.9377C36.4547 42.3705 33.5408 40.4227 33.0011 39.9898C32.5694 39.6652 24.9068 34.7955 22.2086 32.4148C21.4531 31.7655 20.5897 30.4669 22.3165 28.9519L33.6487 18.1305C34.9438 16.8319 36.2389 13.8019 30.8426 17.4812L15.7331 27.7616C15.7331 27.7616 14.0063 28.8437 10.7686 27.8698L3.75342 25.7055C3.75342 25.7055 1.16321 24.0823 5.58815 22.459C16.3807 17.3729 29.6555 12.1786 41.4193 7.30899Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function TestLoginContent() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [loadingProvider, setLoadingProvider] = useState<ProviderKey | "telegram" | null>(null);
  const [pendingProvider, setPendingProvider] = useState<ProviderKey | null>(null);
  const [showInviteBox, setShowInviteBox] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isInviteLoading, setIsInviteLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const fallbackChainId = useChainId();
  const { connect: connectAppKitWallet } = useAppKitWallet({
    namespace: "eip155",
  });
  const { walletProvider } = useAppKitProvider<Eip1193Provider | undefined>("eip155");
  const { address, allAccounts, embeddedWalletInfo } = useAppKitAccount({
    namespace: "eip155",
  });

  const dragStartX = useRef<number | null>(null);
  const authInFlightRef = useRef(false);
  const authTimeoutRef = useRef<number | null>(null);
  const dragThreshold = 60;

  const nextPath = useMemo(() => normalizeNextPath(searchParams.get("next")), [searchParams]);

  const connectedEip155Account = useMemo(() => {
    if (!allAccounts.length) return null;

    const normalizedAddress = address?.toLowerCase();
    return (
      allAccounts.find((account) => {
        if (account.namespace !== "eip155") return false;
        if (!normalizedAddress) return true;
        return account.address.toLowerCase() === normalizedAddress;
      }) || null
    );
  }, [address, allAccounts]);

  const resolvedWalletAddress = useMemo(() => {
    if (address) return address;
    if (connectedEip155Account?.address) return connectedEip155Account.address;
    return (
      allAccounts.find((account) => account.namespace === "eip155" && !!account.address)?.address ||
      null
    );
  }, [address, connectedEip155Account?.address, allAccounts]);

  const resolveProfileName = useCallback(
    (provider: WalletProviderValue, walletAddress: string) => {
      const embeddedUsername = embeddedWalletInfo?.user?.username?.trim() || null;
      const embeddedEmailName = toNameFromEmail(embeddedWalletInfo?.user?.email);
      const providerLabel = providerLabelMap[provider];

      if (provider === "google" || provider === "apple") {
        return embeddedUsername || embeddedEmailName || providerLabel;
      }

      return walletAddress;
    },
    [embeddedWalletInfo?.user?.email, embeddedWalletInfo?.user?.username]
  );

  const runWalletAuth = useCallback(
    async (providerKey: ProviderKey, walletAddress: string) => {
      const provider = providerValueMap[providerKey];
      const chain = normalizeChallengeChain(connectedEip155Account?.chainId ?? fallbackChainId);
      const profileName = resolveProfileName(provider, walletAddress);

      const challengeResponse = await fetch("/api/auth/external/wallet/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: walletAddress,
          chain,
          mode: "signin",
          next: nextPath,
          provider,
          displayName: profileName,
        }),
      });

      const challengePayload = (await challengeResponse.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!challengeResponse.ok || !challengePayload?.message) {
        throw new Error(challengePayload?.error || "Unable to create wallet challenge.");
      }

      if (!walletProvider?.request) {
        throw new Error("Wallet provider unavailable for signing.");
      }

      const signature = await signWithWalletProvider({
        provider: walletProvider,
        message: challengePayload.message,
        expectedAddress: walletAddress,
      });

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
        toast.success(`${providerLabelMap[provider]} authentication successful.`);
      }

      window.location.assign(verifyPayload.redirectTo);
    },
    [
      connectedEip155Account?.chainId,
      fallbackChainId,
      nextPath,
      resolveProfileName,
      walletProvider,
    ]
  );

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

  useEffect(() => {
    if (!pendingProvider) {
      if (authTimeoutRef.current) {
        window.clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      return;
    }

    authTimeoutRef.current = window.setTimeout(() => {
      if (authInFlightRef.current) return;
      setPendingProvider(null);
      setLoadingProvider(null);
      toast.error("Authentication timed out. Please try again.");
    }, 60_000);

    return () => {
      if (authTimeoutRef.current) {
        window.clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
    };
  }, [pendingProvider]);

  useEffect(() => {
    if (!pendingProvider || !resolvedWalletAddress || authInFlightRef.current) {
      return;
    }

    authInFlightRef.current = true;

    runWalletAuth(pendingProvider, resolvedWalletAddress)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Wallet authentication failed.");
        setPendingProvider(null);
        setLoadingProvider(null);
      })
      .finally(() => {
        authInFlightRef.current = false;
      });
  }, [pendingProvider, resolvedWalletAddress, runWalletAuth]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const previousHtmlScrollbarGutter = document.documentElement.style.scrollbarGutter;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehavior = "none";
    document.documentElement.style.scrollbarGutter = "auto";

    document.documentElement.classList.add("no-scrollbar");
    document.body.classList.add("no-scrollbar");

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
      document.documentElement.style.scrollbarGutter = previousHtmlScrollbarGutter;

      document.documentElement.classList.remove("no-scrollbar");
      document.body.classList.remove("no-scrollbar");
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselImages.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, []);

  const goToPreviousSlide = () => {
    setActiveSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const goToNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const handleSliderPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSliderPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;

    const deltaX = event.clientX - dragStartX.current;
    dragStartX.current = null;

    if (Math.abs(deltaX) < dragThreshold) return;

    if (deltaX > 0) {
      goToPreviousSlide();
      return;
    }

    goToNextSlide();
  };

  const handleSliderPointerCancel = () => {
    dragStartX.current = null;
  };

  const startProviderAuth = async (provider: ProviderKey) => {
    if (loadingProvider) return;

    setLoadingProvider(provider);
    setPendingProvider(provider);

    try {
      await connectAppKitWallet(provider);
    } catch (error) {
      setPendingProvider(null);
      setLoadingProvider(null);
      toast.error(error instanceof Error ? error.message : "Wallet connection failed.");
    }
  };

  const startTelegramAuth = async () => {
    if (loadingProvider) return;

    const botIdValue = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
    const botId = botIdValue ? Number(botIdValue) : Number.NaN;

    if (!Number.isFinite(botId)) {
      toast.error("Telegram auth is not configured.");
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
          mode: "signin",
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
      toast.error(error instanceof Error ? error.message : "Telegram authentication failed.");
    }
  };

  const submitInviteCode = async () => {
    if (isInviteLoading) return;
    const trimmedCode = inviteCode.trim();
    if (!trimmedCode) {
      toast.error("Inserisci un codice di invito.");
      return;
    }

    setIsInviteLoading(true);
    try {
      const response = await fetch("/api/auth/invite-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: trimmedCode,
          next: nextPath,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; redirectTo?: string; error?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.redirectTo) {
        throw new Error(payload?.error || "Codice invito non valido.");
      }

      toast.success("Accesso founder completato.");
      window.location.assign(payload.redirectTo);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Codice invito non valido.");
    } finally {
      setIsInviteLoading(false);
    }
  };

  const buttonLoadingClass = (provider: ProviderKey | "telegram") =>
    loadingProvider === provider ? "cursor-wait opacity-80" : "";

  return (
    <>
      <div
        className="grid h-full gap-0"
        style={{
          gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.2fr)",
          minWidth: "980px",
          alignItems: "stretch",
        }}
      >
            <section className="relative mr-auto flex h-full w-full max-w-[520px] flex-col rounded-[30px] pl-0 pr-6 pt-[6.25rem] pb-1 md:pl-0 md:pr-7 md:pt-[6.25rem] md:pb-1">
              <div className="absolute left-0 right-6 top-4 flex justify-center md:right-7">
                <Image src="/logowhite.svg" alt="Whatnot Market" width={96} height={42} priority />
              </div>

              <div className="w-full space-y-1.5">
                <h1 className="w-full max-w-full text-center font-[Inter] text-[42px] leading-[1.05] font-[800] text-white whitespace-nowrap">
                  Join WhatnotMarket
                </h1>
                <p className="w-full text-center font-[Inter] text-[18px] text-zinc-300 whitespace-nowrap">
                  The marketplace where you can find everything
                </p>
              </div>

              <div className="mt-5 w-full">
                {showInviteBox ? (
                  <div className="space-y-3 rounded-[16px] border border-[#2e2e2e] bg-[#141414] p-4">
                    <p className="text-center font-[Inter] text-[16px] text-white">
                      Inserisci il tuo codice di invito
                    </p>
                    <input
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={inviteCode}
                      onChange={(event) => setInviteCode(event.target.value)}
                      placeholder="Codice invito"
                      className="h-[52px] w-full rounded-[12px] border border-[#3b3b3b] bg-[#0f0f0f] px-4 font-[Inter] text-[16px] text-white outline-none transition focus:border-[#3b3b3b] focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => void submitInviteCode()}
                      disabled={isInviteLoading}
                      className={`${buttonBase} border-white bg-white px-4 text-black ${
                        isInviteLoading ? "cursor-wait opacity-80" : ""
                      }`}
                    >
                      <span className="font-[Inter] font-[800]">Continua</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInviteBox(false)}
                      disabled={isInviteLoading}
                      className={`${buttonBase} border-[#3b3b3b] bg-[#202020] px-4 text-white`}
                    >
                      Torna ai metodi di accesso
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                <button
                  className={`${buttonBase} ${buttonLoadingClass("walletConnect")} border-[#3B99FC] bg-[#3B99FC] px-4 text-white`}
                  onClick={() => void startProviderAuth("walletConnect")}
                  type="button"
                  disabled={Boolean(loadingProvider)}
                >
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <WalletConnectIcon />
                  </span>
                  <span className="font-medium">
                    Continua con <span className="font-bold">WalletConnect</span>
                  </span>
                </button>

                <button
                  className={`${buttonBase} ${buttonLoadingClass("metamask")} border-[#3b3b3b] bg-[#202020] px-4 text-white`}
                  onClick={() => void startProviderAuth("metamask")}
                  type="button"
                  disabled={Boolean(loadingProvider)}
                >
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <MetaMaskMark />
                  </span>
                  <span className="font-medium">
                    Continua con <span className="font-bold">Metamask</span>
                  </span>
                </button>

                <button
                  className={`${buttonBase} ${buttonLoadingClass("trust")} border-[#3b3b3b] bg-[#202020] px-4 text-white`}
                  onClick={() => void startProviderAuth("trust")}
                  type="button"
                  disabled={Boolean(loadingProvider)}
                >
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <AnotherWalletMark />
                  </span>
                  <span className="font-medium">
                    Continua con <span className="font-bold">TrustWallet</span>
                  </span>
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-zinc-500/60" />
                  <span className="font-[Inter] text-base text-zinc-300">or</span>
                  <div className="h-px flex-1 bg-zinc-500/60" />
                </div>

                <button
                  className={`${buttonBlue} ${buttonLoadingClass("telegram")} px-4`}
                  style={{ backgroundColor: "#2D9CD4" }}
                  onClick={startTelegramAuth}
                  type="button"
                  disabled={Boolean(loadingProvider)}
                >
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <TelegramMark />
                  </span>
                  <span className="font-medium">
                    Continua con <span className="font-bold">Telegram</span>
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    className={`${buttonWhite} ${buttonLoadingClass("google")} px-3`}
                    onClick={() => void startProviderAuth("google")}
                    type="button"
                    disabled={Boolean(loadingProvider)}
                  >
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">
                      <GoogleIcon />
                    </span>
                    <span className="font-bold truncate px-7">Google</span>
                  </button>
                  <button
                    className={`${buttonBase} ${buttonLoadingClass("apple")} border-0 bg-black px-3 text-white`}
                    onClick={() => void startProviderAuth("apple")}
                    type="button"
                    disabled={Boolean(loadingProvider)}
                  >
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">
                      <AppleIcon />
                    </span>
                    <span className="font-bold truncate px-7">Apple</span>
                  </button>
                </div>
                <p className="w-full whitespace-nowrap pt-2 text-center font-[Inter] text-sm text-zinc-200">
                  Do you have an invite code?{" "}
                  <button
                    type="button"
                    onClick={() => setShowInviteBox(true)}
                    className="font-black underline underline-offset-2"
                  >
                    Click here
                  </button>
                </p>
                  </div>
                )}
              </div>
            </section>

            <section className="-ml-12 h-full w-[calc(100%+3rem)] rounded-[36px] p-1">
              <div
                className="relative h-full min-h-0 select-none rounded-[32px] bg-[#0a0b0d]"
                style={{ touchAction: "pan-y" }}
                onPointerDown={handleSliderPointerDown}
                onPointerUp={handleSliderPointerUp}
                onPointerCancel={handleSliderPointerCancel}
              >
                {carouselImages.map((src, index) => (
                  <div
                    key={src}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      index === activeSlide ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Image
                      src={src}
                      alt={`Slide ${index + 1}`}
                      fill
                      className="rounded-[32px] object-cover object-center"
                      sizes="50vw"
                      priority={index === 0}
                      draggable={false}
                    />
                  </div>
                ))}

                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2">
                  {carouselImages.map((_, index) => (
                    <button
                      key={`indicator-${index}`}
                      type="button"
                      aria-label={`Vai alla slide ${index + 1}`}
                      onClick={() => setActiveSlide(index)}
                      className={`h-1.5 w-10 rounded-full transition-colors ${
                        index === activeSlide ? "bg-white" : "bg-white/35 hover:bg-white/55"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </section>
      </div>

    </>
  );
}

function LoginPageContent() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#000000] p-3 md:p-4">
      <div className="h-full w-full rounded-[34px] bg-[#101010] p-4 md:p-5">
        <AppKitProvider cookies={null}>
          <TestLoginContent />
        </AppKitProvider>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen overflow-hidden bg-[#000000]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
