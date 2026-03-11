"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useAppKitWallet } from "@reown/appkit-wallet-button/react";
import { useChainId } from "wagmi";
import {
  Suspense,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { analytics } from "@/lib/analytics";
import { authToast as toast } from "@/lib/notifications";
import { getRedirectPath } from "@/lib/redirects";
import { createClient } from "@/lib/supabase";
import { AppKitProvider } from "@/reown/AppKitProvider";
import BlurText from "@/components/ui/blur-text";
import ShinyText from "@/components/ui/shiny-text";
import TiltedCard from "@/components/ui/tilted-card";

export const dynamic = "force-dynamic";
const carouselImages = ["/affiliate-bg.svg", "/framehero.svg", "/notifiche.svg"] as const;
const carouselDragThreshold = 60;

const buttonBase =
  "relative flex h-[50px] w-full cursor-pointer items-center justify-center rounded-[14px] border border-[#3b3b3b] font-[Inter] text-[16px] transition-[background-color,opacity,transform] duration-150 active:scale-[0.99] motion-reduce:transition-none sm:h-[52px] sm:text-[17px]";
const buttonBlue = `${buttonBase} border-[#2D9CD4] bg-[#2D9CD4] text-white hover:bg-[#43A9DC]`;
const buttonWhite = `${buttonBase} bg-white text-black`;

type ProviderKey = "walletConnect" | "metamask" | "trust" | "google" | "apple";
type WalletProviderValue = "walletconnect" | "metamask" | "trustwallet" | "google" | "apple";
type MobilePlatform = "ios" | "android" | "other";
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

function detectMobilePlatform(): MobilePlatform {
  if (typeof window === "undefined") return "other";

  const ua = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const maxTouchPoints = window.navigator.maxTouchPoints ?? 0;

  const isAndroid = /android/i.test(ua);
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (platform === "MacIntel" && maxTouchPoints > 1);

  if (isAndroid) return "android";
  if (isIOS) return "ios";
  return "other";
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

type AuthIconProps = {
  src: string;
  className: string;
};

const AuthIcon = memo(function AuthIcon({ src, className }: AuthIconProps) {
  return (
    // Native img keeps tiny local SVG icons as cheap as possible in runtime/rendering.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={className}
      decoding="async"
      draggable={false}
    />
  );
});

type LoginCarouselProps = {
  isDesktopViewport: boolean;
  isTabletUpViewport: boolean;
};

const LoginCarousel = memo(function LoginCarousel({
  isDesktopViewport,
  isTabletUpViewport,
}: LoginCarouselProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const dragStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!isTabletUpViewport) return;

    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselImages.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [isTabletUpViewport]);

  const goToPreviousSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  }, []);

  const goToNextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % carouselImages.length);
  }, []);

  const handleSliderPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Safari can throw if pointer capture is unavailable.
    }
  }, []);

  const handleSliderPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (dragStartX.current === null) return;

      const deltaX = event.clientX - dragStartX.current;
      dragStartX.current = null;

      if (Math.abs(deltaX) < carouselDragThreshold) return;

      if (deltaX > 0) {
        goToPreviousSlide();
        return;
      }

      goToNextSlide();
    },
    [goToNextSlide, goToPreviousSlide]
  );

  const handleSliderPointerCancel = useCallback(() => {
    dragStartX.current = null;
  }, []);

  return (
    <>
      <section className="hidden w-full px-6 pb-1 md:block lg:hidden">
        <div
          className="relative mx-auto aspect-[16/9] w-full max-w-[760px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0b0d]"
          style={{ touchAction: "pan-y" }}
          onPointerDown={handleSliderPointerDown}
          onPointerUp={handleSliderPointerUp}
          onPointerCancel={handleSliderPointerCancel}
        >
          {carouselImages.map((src, index) => (
            <div
              key={`tablet-${src}`}
              className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
                index === activeSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={src}
                alt={`Slide ${index + 1}`}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1023px) 90vw, 0px"
                priority={index === 0 && isTabletUpViewport && !isDesktopViewport}
                draggable={false}
              />
            </div>
          ))}

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {carouselImages.map((_, index) => (
              <button
                key={`tablet-indicator-${index}`}
                type="button"
                aria-label={`Vai alla slide ${index + 1}`}
                onClick={() => setActiveSlide(index)}
                className={`h-1.5 w-8 rounded-full transition-colors motion-reduce:transition-none ${
                  index === activeSlide ? "bg-white" : "bg-white/35 hover:bg-white/55"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="hidden h-full w-full rounded-[36px] p-1 lg:block lg:max-w-[560px] lg:justify-self-end xl:-ml-12 xl:max-w-none xl:w-[calc(100%+3rem)]">
        <TiltedCard
          containerHeight="100%"
          containerWidth="100%"
          imageHeight="100%"
          imageWidth="100%"
          rotateAmplitude={8}
          scaleOnHover={1.02}
          showMobileWarning={false}
          showTooltip={false}
          displayOverlayContent={false}
          className="h-full w-full select-none rounded-[32px]"
          innerClassName="h-full w-full rounded-[32px]"
        >
          <div
            className="relative h-full min-h-0 overflow-hidden rounded-[32px] bg-[#0a0b0d]"
            style={{ touchAction: "pan-y" }}
            onPointerDown={handleSliderPointerDown}
            onPointerUp={handleSliderPointerUp}
            onPointerCancel={handleSliderPointerCancel}
          >
            {carouselImages.map((src, index) => (
              <div
                key={src}
                className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
                  index === activeSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={src}
                  alt={`Slide ${index + 1}`}
                  fill
                  className="rounded-[32px] object-cover object-center"
                  sizes="(max-width: 1023px) 0px, 50vw"
                  priority={index === 0 && isDesktopViewport}
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
                  className={`h-1.5 w-10 rounded-full transition-colors motion-reduce:transition-none ${
                    index === activeSlide ? "bg-white" : "bg-white/35 hover:bg-white/55"
                  }`}
                />
              ))}
            </div>
          </div>
        </TiltedCard>
      </section>
    </>
  );
});

function TestLoginContent() {
  const [loadingProvider, setLoadingProvider] = useState<ProviderKey | "telegram" | null>(null);
  const [pendingProvider, setPendingProvider] = useState<ProviderKey | null>(null);
  const [showInviteBox, setShowInviteBox] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [isTabletUpViewport, setIsTabletUpViewport] = useState(false);
  const [mobilePlatform, setMobilePlatform] = useState<MobilePlatform>("other");

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

  const authInFlightRef = useRef(false);
  const authTimeoutRef = useRef<number | null>(null);

  const nextPath = useMemo(() => getRedirectPath(searchParams), [searchParams]);
  const showGoogleOption = mobilePlatform !== "ios";
  const showAppleOption = mobilePlatform !== "android";

  useEffect(() => {
    analytics.page("login_viewed", { nextPath });
  }, [nextPath]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const desktopMediaQuery = window.matchMedia("(min-width: 1024px)");
    const tabletUpMediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = () => {
      setIsDesktopViewport(desktopMediaQuery.matches);
      setIsTabletUpViewport(tabletUpMediaQuery.matches);
    };

    handleChange();
    setMobilePlatform(detectMobilePlatform());

    if (
      typeof desktopMediaQuery.addEventListener === "function" &&
      typeof tabletUpMediaQuery.addEventListener === "function"
    ) {
      desktopMediaQuery.addEventListener("change", handleChange);
      tabletUpMediaQuery.addEventListener("change", handleChange);
      return () => {
        desktopMediaQuery.removeEventListener("change", handleChange);
        tabletUpMediaQuery.removeEventListener("change", handleChange);
      };
    }

    desktopMediaQuery.addListener(handleChange);
    tabletUpMediaQuery.addListener(handleChange);
    return () => {
      desktopMediaQuery.removeListener(handleChange);
      tabletUpMediaQuery.removeListener(handleChange);
    };
  }, []);

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
      analytics.track("login_cancelled", { message: authMessage });
    } else if (authStatus === "success") {
      toast.success(authMessage || "Authentication successful.");
      analytics.track("login_succeeded", { message: authMessage });
    } else if (authStatus === "error") {
      toast.error(authMessage || "Authentication failed.");
      analytics.track("login_failed", { message: authMessage });
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
    if (!isDesktopViewport) {
      document.documentElement.classList.remove("no-scrollbar");
      document.body.classList.remove("no-scrollbar");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.overscrollBehavior = "";
      document.documentElement.style.overscrollBehavior = "";
      document.documentElement.style.scrollbarGutter = "";
      return;
    }

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
  }, [isDesktopViewport]);

  const startProviderAuth = async (provider: ProviderKey) => {
    if (loadingProvider) return;

    analytics.track("login_started", { provider });
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

    analytics.track("login_started", { provider: "telegram" });
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
        analytics.track("login_succeeded", { provider: "telegram" });
      }

      window.location.assign(payload.redirectTo);
    } catch (error) {
      setLoadingProvider(null);
      toast.error(error instanceof Error ? error.message : "Telegram authentication failed.");
      analytics.track("login_failed", { provider: "telegram", error: String(error) });
    }
  };

  const submitInviteCode = async () => {
    if (isInviteLoading) return;
    const trimmedCode = inviteCode.trim();
    if (!trimmedCode) {
      toast.error("Inserisci un codice di invito.");
      return;
    }

    const provider = "invite_code";
    const endpoints = ["/api/auth/invite-buyer", "/api/auth/invite-admin"];

    analytics.track("login_started", { provider });
    setIsInviteLoading(true);
    try {
      let payload: { ok?: boolean; redirectTo?: string; error?: string } | null = null;
      let success = false;
      let lastError = "Codice invito non valido.";

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: trimmedCode,
            next: nextPath,
          }),
        });

        payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; redirectTo?: string; error?: string }
          | null;

        if (response.ok && payload?.ok && payload.redirectTo) {
          success = true;
          break;
        }

        lastError = payload?.error || lastError;
      }

      if (!success || !payload?.redirectTo) {
        throw new Error(lastError);
      }

      toast.success("Accesso con codice invito completato.");
      analytics.track("login_succeeded", { provider });
      window.location.assign(payload.redirectTo);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Codice invito non valido.");
      analytics.track("login_failed", { provider, error: String(error) });
    } finally {
      setIsInviteLoading(false);
    }
  };

  const buttonLoadingClass = (provider: ProviderKey | "telegram") =>
    loadingProvider === provider ? "cursor-wait opacity-80" : "";

  return (
    <>
      <div className="grid h-full grid-cols-1 items-stretch gap-3 md:gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-0 xl:min-w-[980px] xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="relative mx-auto flex h-full w-full max-w-[520px] flex-col rounded-[30px] px-2 pb-1 pt-[5.75rem] sm:px-3 sm:pt-[6.25rem] md:max-w-[760px] md:px-6 lg:mr-auto lg:max-w-[520px] lg:px-0 lg:pr-7 lg:pt-[6.25rem]">
          <div className="absolute left-0 right-0 top-4 flex justify-center lg:right-7">
            <Image src="/logowhite.svg" alt="SwaprMarket" width={96} height={42} priority />
          </div>

          <div className="w-full space-y-1.5">
            <h1 className="w-full max-w-full text-center font-[Inter] text-[34px] leading-[1.05] font-[800] text-white whitespace-normal sm:text-[42px] xl:whitespace-nowrap">
              <BlurText
                text="Join SwaprMarket"
                delay={100}
                animateBy="words"
                direction="bottom"
                className="w-full justify-center"
              />
            </h1>
            <p className="w-full text-center font-[Inter] text-[16px] text-zinc-300 whitespace-normal sm:text-[18px] xl:whitespace-nowrap">
              <ShinyText
                text="The #1 Marketplace Where You Can Find Anything You Want"
                speed={2.1}
                delay={0}
                color="#b5b5b5"
                shineColor="#ffffff"
                spread={120}
                direction="left"
                yoyo
                pauseOnHover
                disabled={false}
              />
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void submitInviteCode();
                    }
                  }}
                  placeholder="Codice invito"
                  className="h-[50px] w-full rounded-[12px] border border-[#3b3b3b] bg-[#0f0f0f] px-4 font-[Inter] text-[16px] text-white outline-none transition focus:border-[#3b3b3b] focus:outline-none focus:ring-0 sm:h-[52px]"
                />
                <button
                  type="button"
                  onClick={() => void submitInviteCode()}
                  disabled={isInviteLoading}
                  className={`${buttonBase} border-white bg-white px-4 text-black ${
                    isInviteLoading ? "cursor-wait opacity-80" : "hover:bg-white/90"
                  }`}
                >
                  <span className="font-[Inter] font-[800]">Continua</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteBox(false)}
                  disabled={isInviteLoading}
                  className={`${buttonBase} border-[#3b3b3b] bg-[#202020] px-4 text-white hover:bg-[#181818]`}
                >
                  Torna ai metodi di accesso
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  className={`${buttonBase} ${buttonLoadingClass("walletConnect")} border-[#3B99FC] bg-[#3B99FC] px-4 text-white hover:bg-[#58ABFD]`}
                  onClick={() => void startProviderAuth("walletConnect")}
                  type="button"
                  disabled={Boolean(loadingProvider)}
                >
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <AuthIcon src="/auth-assets/walletconnect.svg" className="h-6 w-6 shrink-0" />
                  </span>
                  <span className="font-medium">
                    Continua con <span className="font-bold">WalletConnect</span>
                  </span>
                </button>

                <button
                  className={`${buttonBase} ${buttonLoadingClass("metamask")} border-[#3b3b3b] bg-[#202020] px-4 text-white hover:bg-[#181818]`}
                  onClick={() => void startProviderAuth("metamask")}
                  type="button"
                  disabled={Boolean(loadingProvider)}
                >
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <AuthIcon src="/auth-assets/metamask.svg" className="h-6 w-6 shrink-0" />
                  </span>
                  <span className="font-medium">
                    Continua con <span className="font-bold">Metamask</span>
                  </span>
                </button>

                <button
                  className={`${buttonBase} ${buttonLoadingClass("trust")} border-[#3b3b3b] bg-[#202020] px-4 text-white hover:bg-[#181818]`}
                  onClick={() => void startProviderAuth("trust")}
                  type="button"
                  disabled={Boolean(loadingProvider)}
                >
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <AuthIcon src="/auth-assets/trustwallet.svg" className="h-6 w-6 shrink-0" />
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
                  onClick={startTelegramAuth}
                  type="button"
                  disabled={Boolean(loadingProvider)}
                >
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <AuthIcon src="/auth-assets/telegram.svg" className="h-5 w-5 shrink-0" />
                  </span>
                  <span className="font-medium">
                    Continua con <span className="font-bold">Telegram</span>
                  </span>
                </button>

                <div
                  className={`grid gap-2.5 ${
                    showGoogleOption && showAppleOption ? "grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {showGoogleOption ? (
                    <button
                      className={`${buttonWhite} ${buttonLoadingClass("google")} px-3 hover:bg-white/90`}
                      onClick={() => void startProviderAuth("google")}
                      type="button"
                      disabled={Boolean(loadingProvider)}
                    >
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">
                        <AuthIcon src="/auth-assets/google.svg" className="h-6 w-6 shrink-0" />
                      </span>
                      <span className="truncate px-7 font-bold">Google</span>
                    </button>
                  ) : null}

                  {showAppleOption ? (
                    <button
                      className={`${buttonBase} ${buttonLoadingClass("apple")} border-0 bg-black px-3 text-white hover:opacity-90`}
                      onClick={() => void startProviderAuth("apple")}
                      type="button"
                      disabled={Boolean(loadingProvider)}
                    >
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">
                        <AuthIcon src="/auth-assets/apple.svg" className="h-6 w-6 shrink-0" />
                      </span>
                      <span className="truncate px-7 font-bold">Apple</span>
                    </button>
                  ) : null}
                </div>
                <p className="w-full pt-2 text-center font-[Inter] text-sm text-zinc-200 sm:whitespace-nowrap">
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

        <LoginCarousel
          isDesktopViewport={isDesktopViewport}
          isTabletUpViewport={isTabletUpViewport}
        />
      </div>
    </>
  );
}

function LoginPageContent() {
  return (
    <div className="min-h-screen min-h-[100svh] min-h-[100dvh] w-screen overflow-x-hidden overflow-y-auto bg-[#000000] p-3 md:p-4 lg:h-screen lg:overflow-hidden">
      <div className="min-h-[calc(100vh-1.5rem)] min-h-[calc(100svh-1.5rem)] min-h-[calc(100dvh-1.5rem)] w-full rounded-[34px] bg-[#101010] p-4 md:min-h-[calc(100vh-2rem)] md:min-h-[calc(100svh-2rem)] md:min-h-[calc(100dvh-2rem)] md:p-5 lg:h-full lg:min-h-0">
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

