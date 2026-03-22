import { Squircle } from "@/components/shared/ui/Squircle";
import type { Metadata } from "next";
import Image from "next/image";
import cieloImage from "./cielo.png";
import openlyLogo from "./openlylogo.svg";

export const metadata: Metadata = {
  title: "Landing Page",
  description: "Minimal landing page with centered rounded blue block.",
};

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4 sm:p-6 md:p-8">
      <Squircle
        radius={55}
        smoothing={1}
        className="h-[calc(100vh-2rem)] max-h-[900px] w-full sm:h-[calc(100vh-3rem)] md:h-[calc(100vh-4rem)]"
        innerClassName="relative h-full w-full p-4 sm:p-6 md:p-8"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${cieloImage.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        <div className="landing-header-slide-in sticky top-4 z-20 w-full sm:top-6 md:top-8">
          <a href="#" className="absolute left-1 top-1/2 -translate-y-1/2 sm:left-2 md:left-3">
            <Image
              src={openlyLogo}
              alt="Openly"
              priority
              className="landing-logo-slide-in h-10 w-auto sm:h-12"
            />
          </a>

          <header className="mx-auto w-fit max-w-full">
            <Squircle
              radius={999}
              smoothing={1}
              borderWidth={1}
              borderColor="rgba(255, 255, 255, 0.62)"
              className="mx-auto w-fit max-w-full"
              innerClassName="w-fit max-w-full bg-white/12 px-3 py-2.5 backdrop-blur-[10px] sm:px-4"
            >
              <div className="flex w-full items-center justify-center">
                <nav
                  aria-label="Primary"
                  className="font-[family-name:var(--font-sans)] flex items-center gap-5 overflow-x-auto whitespace-nowrap text-sm font-medium text-white sm:gap-6 sm:text-base"
                >
                  <a href="#" className="opacity-95 transition-opacity hover:opacity-100">
                    Dashboard
                  </a>
                  <a href="#" className="opacity-95 transition-opacity hover:opacity-100">
                    Invest
                  </a>
                  <a href="#" className="opacity-95 transition-opacity hover:opacity-100">
                    Prices
                  </a>
                  <a href="#" className="opacity-95 transition-opacity hover:opacity-100">
                    Help
                  </a>
                  <a href="#" className="opacity-95 transition-opacity hover:opacity-100">
                    Blog
                  </a>
                  <a
                    href="#"
                    className="ml-2 inline-flex h-11 shrink-0 items-center rounded-full bg-white px-5 text-sm font-semibold leading-none text-black outline-none sm:text-base"
                    style={{
                      boxShadow: "inset 0 -4px 0 rgba(8, 60, 100, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.55)",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <span className="leading-none">Get Started</span>
                  </a>
                </nav>
              </div>
            </Squircle>
          </header>
        </div>
      </Squircle>
    </main>
  );
}

