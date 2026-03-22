"use client";

// OpenlyDev Signature: OpenlyMarket Maintenance Theme
import { useEffect,useState } from "react";

type MaintenanceTheme = "light" | "dark";

const STORAGE_KEY = "maintenance-theme";
const ROOT_THEME_ATTR = "data-maintenance-theme";

function getSystemTheme(): MaintenanceTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: "15px", height: "15px", display: "block" }}>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
        d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6zm0-3.7v1.6m0 11.8v1.6m-7.4-7.4h1.6m11.8 0h1.6M6.7 6.7l1.1 1.1m8.4 8.4l1.1 1.1m0-10.6l-1.1 1.1m-8.4 8.4l-1.1 1.1"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: "15px", height: "15px", display: "block" }}>
      <path
        d="M20.9582 15.3253C21.1622 14.8387 20.5793 14.4252 20.0897 14.6411C19.1145 15.0696 18.0576 15.2903 16.9888 15.2888C12.8038 15.2888 9.41155 11.9648 9.41155 7.86415C9.41155 6.42892 9.82714 5.08906 10.5464 3.95367C10.8297 3.50648 10.4887 2.88567 9.96935 3.01817C5.95922 4.04105 3 7.61286 3 11.862C3 16.909 7.17509 21 12.3259 21C16.2253 21 19.5657 18.655 20.9582 15.3253Z"
        fill="currentColor"
      />
      <path
        d="M15.6111 3.10252C15.0812 2.74918 14.4491 3.38064 14.8025 3.91122L15.4327 4.85637C15.6882 5.2395 15.8245 5.68969 15.8245 6.15018C15.8245 6.61067 15.6882 7.06085 15.4327 7.44399L14.8025 8.38913C14.4491 8.91913 15.0812 9.55117 15.6117 9.19725L16.5562 8.56755C16.9394 8.31209 17.3895 8.17577 17.85 8.17577C18.3105 8.17577 18.7606 8.31209 19.1438 8.56755L20.0889 9.19725C20.6189 9.55117 21.2509 8.91913 20.897 8.38855L20.2673 7.44399C20.0118 7.06085 19.8755 6.61067 19.8755 6.15018C19.8755 5.68969 20.0118 5.2395 20.2673 4.85637L20.8975 3.91122C21.2509 3.38122 20.6189 2.74918 20.0883 3.1031L19.1438 3.73281C18.7606 3.98826 18.3105 4.12458 17.85 4.12458C17.3895 4.12458 16.9394 3.98826 16.5562 3.73281L15.6111 3.10252Z"
        fill="currentColor"
      />
    </svg>
  );
}

function isTheme(value: string | null): value is MaintenanceTheme {
  return value === "light" || value === "dark";
}

export default function OpenlyMarketThemeToggle() {
  const [theme, setTheme] = useState<MaintenanceTheme>("light");
  const [tooltipTheme, setTooltipTheme] = useState<MaintenanceTheme | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasExplicitPreference, setHasExplicitPreference] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const rootTheme = root.getAttribute(ROOT_THEME_ATTR);
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);

    const explicit = isTheme(savedTheme);
    const resolvedTheme = isTheme(rootTheme) ? rootTheme : explicit ? savedTheme : getSystemTheme();

    const raf = window.requestAnimationFrame(() => {
      setTheme(resolvedTheme);
      setHasExplicitPreference(explicit);
      root.setAttribute(ROOT_THEME_ATTR, resolvedTheme);
      setIsReady(true);
    });

    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const root = document.documentElement;
    root.setAttribute(ROOT_THEME_ATTR, theme);

    if (hasExplicitPreference) {
      window.localStorage.setItem(STORAGE_KEY, theme);
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }, [theme, isReady, hasExplicitPreference]);

  useEffect(() => {
    if (!isReady || hasExplicitPreference) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? "dark" : "light");
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleThemeChange);
      return () => mediaQuery.removeEventListener("change", handleThemeChange);
    }

    mediaQuery.addListener(handleThemeChange);
    return () => mediaQuery.removeListener(handleThemeChange);
  }, [isReady, hasExplicitPreference]);

  useEffect(() => {
    if (!isReady) return;

    let tooltipTimer: number | undefined;

    const onGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        !!target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");
      if (isTypingTarget) return;

      const key = event.key.toLowerCase();
      if (key !== "d" && key !== "l") return;

      event.preventDefault();

      const nextTheme: MaintenanceTheme = key === "d" ? "dark" : "light";
      setHasExplicitPreference(true);
      setTheme(nextTheme);
      setTooltipTheme(nextTheme);

      if (tooltipTimer) window.clearTimeout(tooltipTimer);
      tooltipTimer = window.setTimeout(() => setTooltipTheme(null), 900);
    };

    window.addEventListener("keydown", onGlobalKeyDown);
    return () => {
      if (tooltipTimer) window.clearTimeout(tooltipTimer);
      window.removeEventListener("keydown", onGlobalKeyDown);
    };
  }, [isReady]);

  const handleThemeSelect = (nextTheme: MaintenanceTheme) => {
    setHasExplicitPreference(true);
    setTheme(nextTheme);
  };

  const baseButtonStyle = {
    width: "31px",
    height: "31px",
    borderRadius: "999px",
    appearance: "none" as const,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 120ms ease, color 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
  };

  return (
    <div
      className="maintenance-theme-toggle-widget openlymarket-theme-toggle-widget"
      data-openlymarket-component="openlymarket-theme-toggle-widget"
      style={{
        position: "absolute",
        top: "18px",
        right: "18px",
        zIndex: 3,
        width: "fit-content",
      }}
    >
      <div
        className="maintenance-theme-toggle-group openlymarket-theme-toggle-group"
        role="group"
        aria-label="Theme switch"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "3px",
          padding: "5px",
          borderRadius: "999px",
          background: "rgba(57, 61, 69, 0.76)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(12px) saturate(125%)",
          WebkitBackdropFilter: "blur(12px) saturate(125%)",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 10px 24px rgba(0, 0, 0, 0.34)",
        }}
      >
        <button
          className="maintenance-theme-toggle-button openlymarket-theme-toggle-button"
          type="button"
          aria-label="Dark mode"
          aria-pressed={theme === "dark"}
          onClick={() => handleThemeSelect("dark")}
          onMouseEnter={() => setTooltipTheme("dark")}
          onMouseLeave={() => setTooltipTheme(null)}
          onFocus={() => setTooltipTheme("dark")}
          onBlur={() => setTooltipTheme(null)}
          style={{
            ...baseButtonStyle,
            border: theme === "dark" ? "1px solid rgba(255, 255, 255, 0.24)" : "1px solid transparent",
            color: theme === "dark" ? "#f8fbff" : "rgba(236, 240, 246, 0.86)",
            background:
              theme === "dark"
                ? "linear-gradient(170deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08))"
                : "transparent",
            boxShadow:
              theme === "dark"
                ? "inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 4px 10px rgba(0, 0, 0, 0.24)"
                : "none",
          }}
        >
          <MoonIcon />
        </button>
        <button
          className="maintenance-theme-toggle-button openlymarket-theme-toggle-button"
          type="button"
          aria-label="Light mode"
          aria-pressed={theme === "light"}
          onClick={() => handleThemeSelect("light")}
          onMouseEnter={() => setTooltipTheme("light")}
          onMouseLeave={() => setTooltipTheme(null)}
          onFocus={() => setTooltipTheme("light")}
          onBlur={() => setTooltipTheme(null)}
          style={{
            ...baseButtonStyle,
            border: theme === "light" ? "1px solid rgba(255, 255, 255, 0.24)" : "1px solid transparent",
            color: theme === "light" ? "#f8fbff" : "rgba(236, 240, 246, 0.86)",
            background:
              theme === "light"
                ? "linear-gradient(170deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08))"
                : "transparent",
            boxShadow:
              theme === "light"
                ? "inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 4px 10px rgba(0, 0, 0, 0.24)"
                : "none",
          }}
        >
          <SunIcon />
        </button>
      </div>
      {tooltipTheme && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            transform: "none",
            background: "rgba(36, 39, 46, 0.92)",
            color: "#f5f5f7",
                borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "0.9rem",
            lineHeight: 1,
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 10px 24px rgba(0, 0, 0, 0.35)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <span>{tooltipTheme === "dark" ? "Dark mode" : "Light mode"}</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "8px",
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
              {tooltipTheme === "dark" ? "D" : "L"}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

OpenlyMarketThemeToggle.displayName = "openlymarket-theme-toggle";
