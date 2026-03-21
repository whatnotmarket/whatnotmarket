"use client";

import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import logoBlack from "./logosvgblack.svg";
import logoWhite from "./logosvgwhite.svg";

const LOGO_CONTEXT_MENU_BRAND_RESOURCES_URL = "https://drive.google.com/drive/folders/1F63uMJY6kY5kCpiVBXhhAZo1C8AJQn4J?usp=sharing";
const LOGO_CONTEXT_MENU_WIDTH = 214;
const LOGO_CONTEXT_MENU_HEIGHT = 92;
const LOGO_CONTEXT_MENU_GAP = 12;
const LOGO_CONTEXT_MENU_VIEWPORT_PADDING = 8;

type LogoContextMenuState = {
  open: boolean;
  x: number;
  y: number;
};

export default function MaintenanceLogoContextMenu() {
  const [logoContextMenu, setLogoContextMenu] = useState<LogoContextMenuState>({
    open: false,
    x: 0,
    y: 0,
  });
  const logoButtonRef = useRef<HTMLButtonElement | null>(null);
  const logoContextMenuRef = useRef<HTMLDivElement | null>(null);

  const closeLogoContextMenu = useCallback(() => {
    setLogoContextMenu((current) => (current.open ? { ...current, open: false } : current));
  }, []);

  const getAnchoredPosition = useCallback(() => {
    const buttonRect = logoButtonRef.current?.getBoundingClientRect();
    if (!buttonRect) return null;

    const centeredLeft = buttonRect.left + buttonRect.width / 2;
    const minLeft = LOGO_CONTEXT_MENU_VIEWPORT_PADDING + LOGO_CONTEXT_MENU_WIDTH / 2;
    const maxLeft = window.innerWidth - LOGO_CONTEXT_MENU_VIEWPORT_PADDING - LOGO_CONTEXT_MENU_WIDTH / 2;
    const clampedLeft = Math.max(minLeft, Math.min(maxLeft, centeredLeft));

    const preferredBottom = buttonRect.top - LOGO_CONTEXT_MENU_GAP;
    const minBottom = LOGO_CONTEXT_MENU_HEIGHT + LOGO_CONTEXT_MENU_VIEWPORT_PADDING;
    const clampedBottom = Math.max(minBottom, preferredBottom);

    return {
      x: clampedLeft,
      y: clampedBottom,
    };
  }, []);

  const openLogoContextMenu = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const nextPosition = getAnchoredPosition();
    if (!nextPosition) return;

    setLogoContextMenu({
      open: true,
      x: nextPosition.x,
      y: nextPosition.y,
    });
  }, [getAnchoredPosition]);

  const downloadFile = useCallback((assetUrl: string, fileName: string) => {
    const anchor = document.createElement("a");
    anchor.href = assetUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    closeLogoContextMenu();
  }, [closeLogoContextMenu]);

  const downloadCurrentThemeLogo = useCallback(() => {
    const theme = document.documentElement.getAttribute("data-maintenance-theme");
    const useDarkLogo = theme === "dark";
    downloadFile(useDarkLogo ? logoWhite.src : logoBlack.src, useDarkLogo ? "openly-logo-white.svg" : "openly-logo-black.svg");
  }, [downloadFile]);

  const openBrandResources = useCallback(() => {
    window.open(LOGO_CONTEXT_MENU_BRAND_RESOURCES_URL, "_blank", "noopener,noreferrer");
    closeLogoContextMenu();
  }, [closeLogoContextMenu]);

  useEffect(() => {
    if (!logoContextMenu.open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (logoContextMenuRef.current?.contains(target)) return;
      closeLogoContextMenu();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLogoContextMenu();
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [closeLogoContextMenu, logoContextMenu.open]);

  useEffect(() => {
    if (!logoContextMenu.open) return;

    const repositionMenu = () => {
      const nextPosition = getAnchoredPosition();
      if (!nextPosition) return;
      setLogoContextMenu((current) => (current.open ? { ...current, x: nextPosition.x, y: nextPosition.y } : current));
    };

    window.addEventListener("resize", repositionMenu);
    window.addEventListener("scroll", repositionMenu, true);

    return () => {
      window.removeEventListener("resize", repositionMenu);
      window.removeEventListener("scroll", repositionMenu, true);
    };
  }, [getAnchoredPosition, logoContextMenu.open]);

  return (
    <>
      <button
        ref={logoButtonRef}
        type="button"
        aria-label="OpenlyMarket logo"
        onContextMenu={openLogoContextMenu}
        style={{
          margin: "0 0 35px",
          padding: 0,
          border: 0,
          background: "transparent",
          cursor: "default",
          lineHeight: 0,
        }}
      >
        <Image
          src={logoBlack}
          alt="OpenlyMarketBlack"
          priority
          className="maintenance-logo maintenance-logo-light"
          style={{ width: "clamp(200px, 31vw, 500px)", height: "auto" }}
        />
        <Image
          src={logoWhite}
          alt="OpenlyMarketWhite"
          priority
          className="maintenance-logo maintenance-logo-dark"
          style={{ width: "clamp(200px, 31vw, 500px)", height: "auto" }}
        />
      </button>

      {logoContextMenu.open ? (
        <div
          ref={logoContextMenuRef}
          data-logo-context-menu="true"
          role="menu"
          aria-label="Logo actions"
          className="w-[214px] overflow-hidden p-1.5"
          style={{
            position: "fixed",
            zIndex: 9999,
            left: `${logoContextMenu.x}px`,
            top: `${logoContextMenu.y}px`,
            transform: "translate(-50%, -100%)",
            borderRadius: "18px",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            background: "var(--maintenance-logo-menu-bg)",
            backdropFilter: "blur(12px) saturate(125%)",
            WebkitBackdropFilter: "blur(12px) saturate(125%)",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 4px 10px rgba(0, 0, 0, 0.24)",
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={downloadCurrentThemeLogo}
            className="flex h-9 w-full items-center rounded-xl px-3 text-left text-[14px] font-semibold text-zinc-100 transition-colors duration-150 hover:bg-white/10"
          >
            Download logo SVG
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={openBrandResources}
            className="flex h-9 w-full items-center rounded-xl px-3 text-left text-[14px] font-semibold text-zinc-100 transition-colors duration-150 hover:bg-white/10"
          >
            Brand Resources
          </button>
        </div>
      ) : null}
    </>
  );
}
