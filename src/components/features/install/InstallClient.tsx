"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  CheckCircle2,
  Chrome,
  Download,
  ExternalLink,
  QrCode,
  Share2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { StepList } from "@/components/features/install/StepList";
import { cn } from "@/lib/core/utils/utils";
import { detectInstallPlatform, isStandaloneDisplayMode, type InstallPlatformInfo } from "@/lib/core/utils/device";

type InstallPromptOutcome = "idle" | "accepted" | "dismissed" | "error";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const IOS_STEPS = [
  "Tocca il pulsante Condividi in Safari.",
  "Scorri e seleziona â€œAggiungi a Homeâ€.",
  "Conferma per installare lâ€™app sulla schermata Home.",
];

const ANDROID_STEPS = [
  "Apri il menu del browser (tre puntini).",
  "Tocca â€œInstalla appâ€ o â€œAggiungi a schermata Homeâ€.",
  "Conferma per completare lâ€™installazione.",
];

const FALLBACK_STEPS = [
  "Apri questa pagina dal browser del telefono.",
  "Cerca nel menu del browser la voce per aggiungere alla Home.",
  "Conferma per avere lâ€™app sempre disponibile.",
];

export function InstallClient() {
  const stepsRef = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [platformInfo, setPlatformInfo] = useState<InstallPlatformInfo>({
    platform: "unknown",
    isMobile: false,
    needsSafari: false,
    needsChrome: false,
  });
  const [installUrl, setInstallUrl] = useState("");
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installOutcome, setInstallOutcome] = useState<InstallPromptOutcome>("idle");
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    setInstallUrl(`${window.location.origin}/install`);
    setPlatformInfo(
      detectInstallPlatform({
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
      })
    );
    setIsInstalled(isStandaloneDisplayMode());

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallOutcome("accepted");
    };

    const handleDisplayModeChange = () => {
      setIsInstalled(isStandaloneDisplayMode());
    };

    const displayModeMedia = window.matchMedia("(display-mode: standalone)");
    const legacyDisplayModeMedia = displayModeMedia as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);
    if ("addEventListener" in displayModeMedia) {
      displayModeMedia.addEventListener("change", handleDisplayModeChange);
    } else if (legacyDisplayModeMedia.addListener) {
      legacyDisplayModeMedia.addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if ("removeEventListener" in displayModeMedia) {
        displayModeMedia.removeEventListener("change", handleDisplayModeChange);
      } else if (legacyDisplayModeMedia.removeListener) {
        legacyDisplayModeMedia.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  const isDesktopView = useMemo(() => {
    if (!mounted) return false;
    return platformInfo.platform === "desktop" || (!platformInfo.isMobile && platformInfo.platform !== "unknown-mobile");
  }, [mounted, platformInfo]);

  const canUseNativeAndroidInstall = useMemo(() => {
    return (
      (platformInfo.platform === "android-chrome" || platformInfo.platform === "android-browser") &&
      deferredPrompt !== null &&
      !isInstalled
    );
  }, [deferredPrompt, isInstalled, platformInfo.platform]);

  const installFeedback = useMemo(() => {
    if (installOutcome === "accepted") return "Installazione completata con successo.";
    if (installOutcome === "dismissed") return "Installazione annullata. Puoi riprovare quando vuoi.";
    if (installOutcome === "error") return "Non siamo riusciti ad avviare lâ€™installazione. Usa i passaggi manuali.";
    if (canUseNativeAndroidInstall) return "Installazione rapida disponibile su questo dispositivo.";
    return null;
  }, [canUseNativeAndroidInstall, installOutcome]);

  const handleAndroidInstall = useCallback(async () => {
    if (!deferredPrompt || isPrompting) return;
    setIsPrompting(true);
    setInstallOutcome("idle");

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setInstallOutcome(choice.outcome === "accepted" ? "accepted" : "dismissed");
      setDeferredPrompt(null);
    } catch {
      setInstallOutcome("error");
    } finally {
      setIsPrompting(false);
    }
  }, [deferredPrompt, isPrompting]);

  const scrollToSteps = useCallback(() => {
    stepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1024] px-6 text-white">
        <div className="w-full max-w-sm animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="h-5 w-40 rounded bg-white/10" />
          <div className="mt-4 h-4 w-full rounded bg-white/10" />
          <div className="mt-2 h-4 w-5/6 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (isDesktopView) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1024] px-6 py-12 text-white">
        <div className="w-full max-w-xl rounded-3xl border border-[#3f3a74]/65 bg-[#171736] p-8 text-center shadow-[0_30px_80px_rgba(5,4,24,0.55)]">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#5c56a6]/50 bg-[#26235a]">
            <QrCode className="h-7 w-7 text-[#ddd8ff]" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Installa lâ€™app dal tuo telefono</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#c2bddf]">
            Questa procedura Ã¨ ottimizzata per mobile. Scansiona il QR code con il tuo telefono per installare lâ€™app.
          </p>

          <div className="mx-auto mt-7 w-fit rounded-3xl border border-white/10 bg-white p-4">
            <QRCode value={installUrl || "https://example.com/install"} size={240} />
          </div>

          <p className="mt-5 text-xs font-medium uppercase tracking-[0.1em] text-[#b7b1d8]">
            Scansiona con il tuo telefono per installare lâ€™app
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1024] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-full max-w-[600px] -translate-x-1/2 bg-gradient-to-b from-[#4e46a8]/35 to-transparent blur-[90px]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 py-7">
        <header className="rounded-3xl border border-[#4a4488]/60 bg-[#19183b]/85 p-6 shadow-[0_20px_50px_rgba(5,4,20,0.45)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#5c56a6]/55 bg-[#27245d]">
            <Smartphone className="h-6 w-6 text-[#e9e6ff]" />
          </div>
          <h1 className="text-2xl font-extrabold leading-tight">Installa lâ€™app sul tuo telefono</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#ccc7e8]">
            Accedi piÃ¹ velocemente direttamente dalla schermata Home, con unâ€™esperienza piÃ¹ fluida e immediata.
          </p>
        </header>

        {isInstalled ? (
          <section className="rounded-3xl border border-emerald-400/35 bg-emerald-500/10 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
              <div>
                <h2 className="text-base font-bold text-emerald-100">Lâ€™app Ã¨ giÃ  installata</h2>
                <p className="mt-1 text-sm leading-relaxed text-emerald-100/85">
                  Perfetto, puoi continuare subito nellâ€™app senza passare dal browser.
                </p>
              </div>
            </div>
            <Link
              href="/market"
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-emerald-300/50 bg-emerald-400/20 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/30"
            >
              Continua
            </Link>
          </section>
        ) : null}

        {!isInstalled && platformInfo.platform === "ios-safari" ? (
          <>
            <section className="rounded-3xl border border-[#4a4488]/60 bg-[#171735] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#b7b1d8]">iPhone + Safari</p>
              <p className="mt-2 text-sm leading-relaxed text-[#d6d1ee]">
                Su iPhone: apri questa pagina in Safari e tocca Condividi per aggiungere lâ€™app alla schermata Home.
              </p>
              <button
                type="button"
                onClick={scrollToSteps}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#7e74ce]/55 bg-[#312b69] text-sm font-bold text-white transition hover:bg-[#3c3579]"
              >
                <Share2 className="h-4 w-4" />
                Segui i passaggi
              </button>
            </section>
            <div ref={stepsRef}>
              <StepList title="Installazione su iPhone (Safari)" steps={IOS_STEPS} />
            </div>
          </>
        ) : null}

        {!isInstalled && platformInfo.platform === "ios-other" ? (
          <>
            <section className="rounded-3xl border border-amber-300/35 bg-amber-400/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-amber-100">Browser non compatibile</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-100/90">
                Per installare su iPhone, apri questa pagina in Safari. Gli altri browser iOS non supportano
                correttamente lâ€™installazione PWA.
              </p>
            </section>
            <StepList title="Poi fai cosÃ¬ in Safari" steps={IOS_STEPS} />
          </>
        ) : null}

        {!isInstalled &&
        (platformInfo.platform === "android-chrome" || platformInfo.platform === "android-browser") ? (
          <>
            <section className="rounded-3xl border border-[#4a4488]/60 bg-[#171735] p-5">
              <div className="flex items-start gap-3">
                <Chrome className="mt-0.5 h-5 w-5 text-[#d8d2ff]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#b7b1d8]">Android</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#d6d1ee]">
                    Su Android: tocca Installa app per aggiungerla subito alla schermata Home.
                  </p>
                </div>
              </div>

              {canUseNativeAndroidInstall ? (
                <button
                  type="button"
                  onClick={handleAndroidInstall}
                  disabled={isPrompting}
                  className={cn(
                    "mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#7e74ce]/55 bg-[#312b69] text-sm font-bold text-white transition",
                    isPrompting ? "opacity-80" : "hover:bg-[#3c3579]"
                  )}
                >
                  <Download className="h-4 w-4" />
                  {isPrompting ? "Apertura installazione..." : "Installa ora"}
                </button>
              ) : (
                <div className="mt-4 rounded-xl border border-[#4a4488]/45 bg-[#13122d] p-3">
                  <p className="text-xs font-medium text-[#bcb6df]">
                    Prompt nativo non disponibile. Usa i passaggi manuali qui sotto.
                  </p>
                </div>
              )}

              {installFeedback ? (
                <p className="mt-3 text-xs font-medium text-[#cbc6e8]">{installFeedback}</p>
              ) : null}
            </section>
            <StepList title="Installazione manuale su Android" steps={ANDROID_STEPS} />
          </>
        ) : null}

        {!isInstalled &&
        (platformInfo.platform === "unknown-mobile" || platformInfo.platform === "unknown") ? (
          <>
            <section className="rounded-3xl border border-[#4a4488]/60 bg-[#171735] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-[#d8d2ff]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#b7b1d8]">CompatibilitÃ </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#d6d1ee]">
                    Non riusciamo a identificare il browser con precisione. Apri questa pagina in Safari (iPhone) o
                    Chrome (Android) per una procedura piÃ¹ rapida.
                  </p>
                </div>
              </div>
            </section>
            <StepList title="Installazione manuale" steps={FALLBACK_STEPS} />
          </>
        ) : null}

        <footer className="mt-auto pb-1 pt-2 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#a8a2cb]">
            Esperienza dedicata solo allâ€™installazione PWA
          </p>
          <Link
            href="/market"
            className="mt-3 inline-flex items-center justify-center gap-1 text-xs font-semibold text-[#cec8f3] transition hover:text-white"
          >
            Salta e apri il sito
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </main>
    </div>
  );
}


