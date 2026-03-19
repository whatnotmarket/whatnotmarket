import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Grainient from "@/components/Grainient";
import MaintenanceThemeToggle from "./MaintenanceThemeToggle";
import logoBlack from "./logosvgblack.svg";
import logoWhite from "./logosvgwhite.svg";

const MAINTENANCE_THEME_BOOTSTRAP = `(() => {
  try {
    const key = "maintenance-theme";
    const attr = "data-maintenance-theme";
    const root = document.documentElement;
    const saved = window.localStorage.getItem(key);
    const theme =
      saved === "dark" || saved === "light"
        ? saved
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.setAttribute(attr, theme);
  } catch {
    // Ignore bootstrap theme errors.
  }
})();`;

export const metadata: Metadata = {
  title: "Openly - Development Mode",
  description: "Sito temporaneamente non disponibile per manutenzione programmata.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": 0,
      "max-image-preview": "none",
      "max-video-preview": 0,
    },
  },
};

export const dynamic = "force-static";

function XStatusIcon() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "1.25em",
        height: "1.25em",
        lineHeight: 1,
        flexShrink: 0,
        transform: "translateY(-0.05em)",
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style={{ width: "100%", height: "100%", display: "block" }}>
      <path
        fill="currentColor"
        d="M453.2 112L523.8 112L369.6 288.2L551 528L409 528L297.7 382.6L170.5 528L99.8 528L264.7 339.5L90.8 112L236.4 112L336.9 244.9L453.2 112zM428.4 485.8L467.5 485.8L215.1 152L173.1 152L428.4 485.8z"
      />
      </svg>
    </span>
  );
}

function SocialXIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 640 640" style={{ width: "16px", height: "16px", display: "block" }}>
      <path
        fill="currentColor"
        d="M453.2 112L523.8 112L369.6 288.2L551 528L409 528L297.7 382.6L170.5 528L99.8 528L264.7 339.5L90.8 112L236.4 112L336.9 244.9L453.2 112zM428.4 485.8L467.5 485.8L215.1 152L173.1 152L428.4 485.8z"
      />
    </svg>
  );
}

function SocialGithubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" style={{ width: "16px", height: "16px", display: "block" }}>
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.67 0 8.2c0 3.63 2.29 6.7 5.47 7.79.4.08.55-.18.55-.4 0-.2-.01-.86-.01-1.56-2.01.38-2.53-.5-2.69-.96-.09-.24-.48-.96-.82-1.15-.28-.15-.68-.54-.01-.55.63-.01 1.08.59 1.23.84.72 1.25 1.87.9 2.33.68.07-.54.28-.9.51-1.11-1.78-.21-3.64-.92-3.64-4.06 0-.9.31-1.64.82-2.22-.08-.21-.36-1.05.08-2.18 0 0 .67-.22 2.2.85a7.38 7.38 0 0 1 4 0c1.53-1.07 2.2-.85 2.2-.85.44 1.13.16 1.97.08 2.18.51.58.82 1.31.82 2.22 0 3.15-1.87 3.84-3.65 4.06.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .22.14.49.55.4A8.24 8.24 0 0 0 16 8.2C16 3.67 12.42 0 8 0z"
      />
    </svg>
  );
}

export default function MaintenancePage() {
  return (
    <>
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: MAINTENANCE_THEME_BOOTSTRAP }} />
      <main
        aria-labelledby="maintenance-title"
        style={{
          position: "relative",
          height: "100dvh",
          minHeight: "100dvh",
          overflow: "hidden",
          padding: "clamp(10px, 2vw, 28px) clamp(12px, 2.2vw, 30px) 0",
          background: "var(--maintenance-bg)",
          color: "var(--maintenance-fg)",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
        }}
      >
        <div
          className="maintenance-shell"
          style={{
            width: "min(1720px, 100%)",
            height: "100%",
            borderTopLeftRadius: "clamp(24px, 2.8vw, 34px)",
            borderTopRightRadius: "clamp(24px, 2.8vw, 34px)",
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            border: "1px solid var(--maintenance-panel-border)",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(56px, 8vw, 104px) clamp(20px, 4vw, 46px)",
            boxShadow: "0 24px 72px rgba(0, 0, 0, 0.14)",
          }}
        >
          <MaintenanceThemeToggle />
          <div
            aria-hidden="true"
            className="maintenance-grain-wrap"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            <Grainient
              color1="#127ab5"
              color2="#4c95be"
              color3="#bee2ec"
              timeSpeed={2.85}
              colorBalance={-0.28}
              warpStrength={1.6}
              warpFrequency={2.6}
              warpSpeed={2}
              warpAmplitude={50}
              blendAngle={0}
              blendSoftness={0.05}
              rotationAmount={500}
              noiseScale={2}
              grainAmount={0.05}
              grainScale={0.2}
              grainAnimated={false}
              contrast={1.5}
              gamma={1}
              saturation={1}
              centerX={0}
              centerY={0}
              zoom={0.9}
            />
          </div>

          <div
            className="maintenance-content-wrap"
            style={{
              position: "relative",
              zIndex: 1,
              width: "min(820px, 100%)",
              marginInline: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <article
              className="maintenance-card"
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "clamp(30px, 4vw, 54px) clamp(22px, 4vw, 46px)",
                borderRadius: "28px",
                border: "1px solid var(--maintenance-panel-border)",
                background: "var(--maintenance-panel-bg)",
                boxShadow:
                  "inset 0 1px 0 var(--maintenance-panel-shine), 0 18px 46px rgba(0, 0, 0, 0.18)",
                backdropFilter: "blur(18px) saturate(130%)",
                WebkitBackdropFilter: "blur(18px) saturate(130%)",
              }}
            >
              <div className="maintenance-logo-wrap" style={{ margin: "0 0 44px" }}>
                <Image
                  src={logoBlack}
                  alt="Pixblok"
                  priority
                  className="maintenance-logo maintenance-logo-light"
                  style={{ width: "clamp(200px, 31vw, 300px)", height: "auto" }}
                />
                <Image
                  src={logoWhite}
                  alt="Pixblok"
                  priority
                  className="maintenance-logo maintenance-logo-dark"
                  style={{ width: "clamp(200px, 31vw, 300px)", height: "auto" }}
                />
              </div>

              <h1
                id="maintenance-title"
                className="maintenance-title"
                style={{
                  margin: 0,
                  fontSize: "clamp(0.95rem, 4vw, 2.35rem)",
                  lineHeight: 1.1,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  whiteSpace: "nowrap",
                }}
              >
                Sorry! We&apos;re under development!
              </h1>

              <div
                className="maintenance-copy"
                style={{
                  margin: "20px auto 0",
                  fontSize: "1.05rem",
                  lineHeight: 1.65,
                  color: "var(--maintenance-muted)",
                  textAlign: "center",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <p
                  className="maintenance-copy-primary"
                  style={{
                    margin: 0,
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  Our website is currently undergoing scheduled development, We&apos;ll be online soon!
                </p>
                <p
                  className="maintenance-copy-updates"
                  style={{
                    margin: "4px 0 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25em",
                    whiteSpace: "nowrap",
                    width: "100%",
                  }}
                >
                  <span>For updates,</span>
                  <strong>
                    <a
                      className="maintenance-x-link"
                      href="https://x.com/openlymarket"
                      target="_blank"
                      rel="noreferrer noopener"
                      style={{
                      color: "var(--maintenance-fg)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      flexWrap: "nowrap",
                      gap: "0.3em",
                      whiteSpace: "nowrap",
                      lineHeight: 1,
                    }}
                  >
                    <span>Check our</span>
                      <XStatusIcon />
                      <span>status.</span>
                    </a>
                  </strong>
                </p>
              </div>

              <Link
                href="https://docs.openlymarket.xyz/"
              style={{
                marginTop: "22px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 18px",
                borderRadius: "999px",
                border: "1px solid var(--maintenance-docs-border)",
                background: "var(--maintenance-docs-bg)",
                color: "var(--maintenance-toggle-active-icon)",
                  textDecoration: "none",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  backdropFilter: "var(--maintenance-docs-filter)",
                  WebkitBackdropFilter: "var(--maintenance-docs-filter)",
                boxShadow: "var(--maintenance-docs-shadow)",
                transition: "transform 120ms ease, opacity 120ms ease",
              }}
            >
              Openly Docs
            </Link>
            </article>

            <p
              className="maintenance-email"
              style={{
                margin: "16px 0 0",
                width: "100%",
                textAlign: "center",
              }}
            >
              <strong>
                <a
                  href="mailto:support@openlymarket.xyz"
                  style={{
                    color: "var(--maintenance-fg)",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                    fontSize: "clamp(1rem, 1.6vw, 1.08rem)",
                  }}
                >
                  support@openlymarket.xyz
                </a>
              </strong>
            </p>

            <div
              style={{
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <a
                href="https://x.com/openlymarket"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="X"
                style={{
                  color: "var(--maintenance-fg)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                }}
              >
                <SocialXIcon />
              </a>
              <a
                href="https://github.com/openlymarket"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="GitHub"
                style={{
                  color: "var(--maintenance-fg)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                }}
              >
                <SocialGithubIcon />
              </a>
              <a
                href="https://www.reddit.com/"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Reddit"
                style={{
                  color: "var(--maintenance-fg)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://mintlify.s3.us-west-1.amazonaws.com/mattiavizzi/icons/reddit.svg"
                  alt=""
                  width={16}
                  height={16}
                  style={{ display: "block" }}
                />
              </a>
              <a
                href="https://paragraph.xyz/"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Paragraph"
                style={{
                  color: "var(--maintenance-fg)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://mintlify.s3.us-west-1.amazonaws.com/mattiavizzi/icons/paragraph.png"
                  alt=""
                  width={16}
                  height={16}
                  style={{ display: "block" }}
                />
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
