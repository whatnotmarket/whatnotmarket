import type { Metadata } from "next";
import Grainient from "@/components/shared/visual/Grainient";
import OpenlyMarketThemeToggle from "./MaintenanceThemeToggle";
import OpenlyMarketEarlyAccessForm from "./MaintenanceEarlyAccessForm";
import OpenlyMarketFeedbackWidget from "./MaintenanceFeedbackWidget";
import OpenlyMarketSocialShortcuts from "./MaintenanceSocialShortcuts";
import OpenlyMarketLogoContextMenu from "./MaintenanceLogoContextMenu";

// OpenlyDev Signature: OpenlyMarket Maintenance Page

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
  title: "Development Mode",
  description: "Openly it's in Development Mode, We'll be soon online",
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
    <svg aria-hidden="true" viewBox="0 0 16 16" style={{ width: "20px", height: "20px", display: "block" }}>
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.67 0 8.2c0 3.63 2.29 6.7 5.47 7.79.4.08.55-.18.55-.4 0-.2-.01-.86-.01-1.56-2.01.38-2.53-.5-2.69-.96-.09-.24-.48-.96-.82-1.15-.28-.15-.68-.54-.01-.55.63-.01 1.08.59 1.23.84.72 1.25 1.87.9 2.33.68.07-.54.28-.9.51-1.11-1.78-.21-3.64-.92-3.64-4.06 0-.9.31-1.64.82-2.22-.08-.21-.36-1.05.08-2.18 0 0 .67-.22 2.2.85a7.38 7.38 0 0 1 4 0c1.53-1.07 2.2-.85 2.2-.85.44 1.13.16 1.97.08 2.18.51.58.82 1.31.82 2.22 0 3.15-1.87 3.84-3.65 4.06.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .22.14.49.55.4A8.24 8.24 0 0 0 16 8.2C16 3.67 12.42 0 8 0z"
      />
    </svg>
  );
}

type SocialLinkProps = {
  href: string;
  label: string;
  shortcut: string;
  children: React.ReactNode;
};

function SocialLink({ href, label, shortcut, children }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      className="maintenance-social-link"
    >
      {children}
      <span className="maintenance-social-tooltip" role="tooltip">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <span>{label}</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              background: "linear-gradient(170deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08))",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 4px 10px rgba(0, 0, 0, 0.24)",
              color: "#f8fbff",
              fontSize: "0.75rem",
              fontWeight: 700,
              lineHeight: 1,
              padding: 0,
            }}
          >
            {shortcut}
          </span>
        </span>
      </span>
    </a>
  );
}

export default function OpenlyMarketMaintenancePage() {
  return (
    <>
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: MAINTENANCE_THEME_BOOTSTRAP }} />
      <main
        className="maintenance-main openlymarket-maintenance-main"
        data-openlymarket-component="openlymarket-maintenance-main"
        aria-labelledby="maintenance-title"
        style={{
          position: "relative",
          height: "100svh",
          minHeight: "100svh",
          overflowX: "hidden",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          padding: "clamp(10px, 2vw, 28px)",
          background: "var(--maintenance-bg)",
          color: "var(--maintenance-fg)",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
        }}
      >
        <div
          className="maintenance-shell openlymarket-maintenance-shell"
          style={{
            width: "min(1720px, 100%)",
            height: "100%",
            borderTopLeftRadius: "clamp(24px, 2.8vw, 34px)",
            borderTopRightRadius: "clamp(24px, 2.8vw, 34px)",
            borderBottomLeftRadius: "clamp(24px, 2.8vw, 34px)",
            borderBottomRightRadius: "clamp(24px, 2.8vw, 34px)",
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
          <OpenlyMarketSocialShortcuts />
          <OpenlyMarketFeedbackWidget />
          <OpenlyMarketThemeToggle />
          <div
            aria-hidden="true"
            className="maintenance-grain-wrap openlymarket-maintenance-grain-wrap"
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
            className="maintenance-content-wrap openlymarket-maintenance-content-wrap"
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
              className="maintenance-card openlymarket-maintenance-card"
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
              <div className="maintenance-logo-wrap openlymarket-logo-wrap">
                <OpenlyMarketLogoContextMenu />
              </div>

              <h1
                id="maintenance-title"
                className="maintenance-title openlymarket-maintenance-title"
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
                className="maintenance-copy openlymarket-maintenance-copy"
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
                  className="maintenance-copy-primary openlymarket-maintenance-copy-primary"
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
                  className="maintenance-copy-updates openlymarket-maintenance-copy-updates"
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
                      className="maintenance-x-link openlymarket-maintenance-x-link"
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

              <OpenlyMarketEarlyAccessForm />
            </article>

            <p
              className="maintenance-email openlymarket-maintenance-email"
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

            <div className="maintenance-social-row openlymarket-maintenance-social-row" style={{ marginTop: "12px" }}>
              <SocialLink href="https://x.com/openlymarket" label="X" shortcut="X">
                <SocialXIcon />
              </SocialLink>
              <SocialLink href="https://github.com/openlymarket" label="GitHub" shortcut="G">
                <SocialGithubIcon />
              </SocialLink>
              <SocialLink href="https://www.reddit.com/" label="Reddit" shortcut="R">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://mintlify.s3.us-west-1.amazonaws.com/mattiavizzi/icons/reddit.svg"
                  alt=""
                  width={20}
                  height={20}
                  style={{ display: "block" }}
                />
              </SocialLink>
              <SocialLink href="https://paragraph.xyz/" label="Paragraph" shortcut="P">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://mintlify.s3.us-west-1.amazonaws.com/mattiavizzi/icons/paragraph.png"
                  alt=""
                  width={20}
                  height={20}
                  style={{ display: "block" }}
                />
              </SocialLink>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

OpenlyMarketMaintenancePage.displayName = "openlymarket-maintenance-page";

