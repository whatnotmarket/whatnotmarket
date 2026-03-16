"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { NewHomeCommandSearch } from "./NewHomeCommandSearch";
import { getBloccoCentraleLeftSpace, getBloccoCentraleModifyStyle } from "./bloccocentrale-modify";
import {
  getActionsToSearchGapWhenChatClosed,
  getAuthButtonsShellStyle,
  getChatGlobalButtonActiveStyle,
  getChatGlobalButtonIconSize,
  getChatGlobalButtonPinnedGap,
  getChatGlobalButtonSize,
  getChatGlobalButtonStyle,
  getLogInButtonLabelStyle,
  getLogInButtonStyle,
  getRightActionGroupWidth,
  getSignUpButtonGap,
  getSignUpButtonLabelStyle,
  getSignUpButtonStyle,
} from "./chatglobalbutton-modify";
import {
  chatGlobalClassModify,
  getChatGlobalCentralBlockOpenTopRightRadius,
  getChatGlobalCenterRightInset,
  getChatGlobalContainerStyle,
  getChatGlobalMotionSpec,
} from "./chatglobal-modify";
import { NewHomeGlobalChatPanel } from "./NewHomeGlobalChatPanel";
import { getSearchbarModifyVars } from "./searchbar-modify";
import {
  getSidebarContainerStyle,
  getSidebarLeftSpace,
  getSidebarProfileSheetModify,
  getSidebarThemeModify,
  sidebarBehaviorModify,
  sidebarClassModify,
} from "./sidebar-modify";
import SidebarTestClient from "../sidebar-test/SidebarTestClient";

const NEW_HOME_GLOBAL_CHAT_OPEN_STORAGE_KEY = "new_home_global_chat_open";
const NEW_HOME_GLOBAL_CHAT_OPEN_STORAGE_EVENT = "new_home_global_chat_open_change";
const NEW_HOME_SIDEBAR_COMPACT_EXPANDED_STORAGE_KEY = "new_home_sidebar_compact_expanded";

function readNewHomeGlobalChatOpenSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(NEW_HOME_GLOBAL_CHAT_OPEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function readNewHomeSidebarCompactExpandedSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(NEW_HOME_SIDEBAR_COMPACT_EXPANDED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeNewHomeGlobalChatOpen(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === NEW_HOME_GLOBAL_CHAT_OPEN_STORAGE_KEY) {
      onStoreChange();
    }
  };

  const onCustom = () => {
    onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(NEW_HOME_GLOBAL_CHAT_OPEN_STORAGE_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(NEW_HOME_GLOBAL_CHAT_OPEN_STORAGE_EVENT, onCustom);
  };
}

function writeNewHomeGlobalChatOpen(nextOpen: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NEW_HOME_GLOBAL_CHAT_OPEN_STORAGE_KEY, nextOpen ? "1" : "0");
    window.dispatchEvent(new Event(NEW_HOME_GLOBAL_CHAT_OPEN_STORAGE_EVENT));
  } catch {}
}

export function NewHomePageClient() {
  const { user, isLoading } = useUser();
  const isUserLoggedIn = Boolean(user?.id);
  const showAuthButtons = !isLoading && !isUserLoggedIn;
  const sidebarClosedRailWidthPx = 92;
  const sidebarMaxExpandedWidthPx = 336 + 366;
  const sideSpace = "clamp(22px, 4vw, 72px)";
  const panelTop = sideSpace;
  const searchHeight = "40px";
  const searchTop = `max(8px, calc((${panelTop} - ${searchHeight}) / 2))`;
  const searchMaxWidth = "clamp(360px, 38vw, 720px)";
  const searchActionStyle = getChatGlobalButtonStyle();
  const searchActionActiveStyle = getChatGlobalButtonActiveStyle();
  const searchActionIconSize = getChatGlobalButtonIconSize();
  const searchActionPinnedGap = getChatGlobalButtonPinnedGap();
  const authButtonsShellStyle = getAuthButtonsShellStyle();
  const logInButtonStyle = getLogInButtonStyle();
  const logInButtonLabelStyle = getLogInButtonLabelStyle();
  const signUpButtonStyle = getSignUpButtonStyle();
  const signUpButtonLabelStyle = getSignUpButtonLabelStyle();
  const signUpButtonGap = getSignUpButtonGap();
  const actionsToSearchGapWhenChatClosed = getActionsToSearchGapWhenChatClosed();
  const rightActionGroupWidth = showAuthButtons
    ? getRightActionGroupWidth()
    : getChatGlobalButtonSize();
  const chatContainerStyle = getChatGlobalContainerStyle(searchTop);
  const chatMotionSpec = getChatGlobalMotionSpec();
  const centralBlockOpenTopRightRadius = getChatGlobalCentralBlockOpenTopRightRadius();
  const searchbarVars = getSearchbarModifyVars();
  const bloccoCentraleStyle = getBloccoCentraleModifyStyle();
  const bloccoCentraleLeftSpace = getBloccoCentraleLeftSpace();
  const sidebarLeftSpace = getSidebarLeftSpace(bloccoCentraleLeftSpace);
  const sidebarContainerStyle = getSidebarContainerStyle(panelTop, sidebarLeftSpace);
  const sidebarTheme = getSidebarThemeModify();
  const sidebarProfileSheetLayout = getSidebarProfileSheetModify();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [sidebarActiveWidthPx, setSidebarActiveWidthPx] = useState(sidebarClosedRailWidthPx);
  const [isInitialRestoreMotionLocked, setIsInitialRestoreMotionLocked] = useState(true);
  const [shouldLockRestoreMotionForOpenState, setShouldLockRestoreMotionForOpenState] = useState(false);
  const storedGlobalChatOpen = useSyncExternalStore(
    subscribeNewHomeGlobalChatOpen,
    readNewHomeGlobalChatOpenSnapshot,
    () => false
  );
  const isGlobalChatOpen = hasHydrated ? storedGlobalChatOpen : false;
  const setGlobalChatOpen = useCallback((next: boolean | ((previous: boolean) => boolean)) => {
    const current = readNewHomeGlobalChatOpenSnapshot();
    const resolved = typeof next === "function" ? next(current) : next;
    writeNewHomeGlobalChatOpen(resolved);
  }, []);
  const isPinnedChatAction = isGlobalChatOpen;
  const sidebarExtraWidthPx = Math.max(0, sidebarActiveWidthPx - sidebarClosedRailWidthPx);
  const isSidebarExpanded = sidebarActiveWidthPx > sidebarClosedRailWidthPx;
  const adaptiveCentralLeft = `calc(${sidebarLeftSpace} + ${sidebarExtraWidthPx}px)`;
  const isSidebarAtMaxExpandedWidth = sidebarActiveWidthPx >= sidebarMaxExpandedWidthPx;
  const shouldAlignSearchToCentral = isSidebarAtMaxExpandedWidth || isGlobalChatOpen;
  const shouldAlignSearchToCentralStart = isGlobalChatOpen && isSidebarExpanded;
  const searchWrapperLeft = shouldAlignSearchToCentral ? adaptiveCentralLeft : "0px";
  const searchWrapperJustifyClass = shouldAlignSearchToCentralStart ? "justify-start" : "justify-center";
  const searchWrapperPaddingLeft = shouldAlignSearchToCentralStart ? "0px" : sideSpace;
  const rightInsetWhenChatOpen = getChatGlobalCenterRightInset();
  const adaptiveRightInset = isGlobalChatOpen ? rightInsetWhenChatOpen : "0px";
  const searchContentMaxWidthWhenPinnedAndSidebarExpanded = `min(${searchMaxWidth}, max(220px, calc(100% - ${rightActionGroupWidth} - ${searchActionPinnedGap} - ${sideSpace})))`;
  const searchContentMaxWidth = shouldAlignSearchToCentralStart
    ? searchContentMaxWidthWhenPinnedAndSidebarExpanded
    : searchMaxWidth;
  const topRightActionGroupRightWhenChatClosed = `max(${sideSpace}, calc(50vw - (${searchMaxWidth} / 2) - ${rightActionGroupWidth} - ${actionsToSearchGapWhenChatClosed}))`;
  const topRightActionGroupRight = isPinnedChatAction
    ? `calc(${adaptiveRightInset} + ${searchActionPinnedGap})`
    : topRightActionGroupRightWhenChatClosed;
  const chatToggleTooltipClassName =
    "pointer-events-none absolute left-1/2 top-full z-[999] mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#11161a] px-2 py-1 text-[11px] font-medium text-white/95 opacity-0 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-opacity duration-150 group-hover:opacity-100";
  const centralBlockRef = useRef<HTMLElement | null>(null);
  const leftSidebarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const hydrationTimeoutId = window.setTimeout(() => {
      setHasHydrated(true);
    }, 0);

    return () => {
      window.clearTimeout(hydrationTimeoutId);
    };
  }, []);

  useEffect(() => {
    const shouldLockInitialRestoreMotion =
      readNewHomeGlobalChatOpenSnapshot() && readNewHomeSidebarCompactExpandedSnapshot();

    const timeoutId = window.setTimeout(() => {
      setShouldLockRestoreMotionForOpenState(shouldLockInitialRestoreMotion);
      if (!shouldLockInitialRestoreMotion) {
        setIsInitialRestoreMotionLocked(false);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!shouldLockRestoreMotionForOpenState) return;
    if (!hasHydrated) return;
    if (!isGlobalChatOpen) return;
    if (sidebarActiveWidthPx <= sidebarClosedRailWidthPx) return;

    const timeoutId = window.setTimeout(() => {
      setIsInitialRestoreMotionLocked(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    hasHydrated,
    isGlobalChatOpen,
    shouldLockRestoreMotionForOpenState,
    sidebarActiveWidthPx,
    sidebarClosedRailWidthPx,
  ]);

  const layoutTransition = !hasHydrated || isInitialRestoreMotionLocked
    ? "none"
    : "left 280ms cubic-bezier(0.22,1,0.36,1), right 280ms cubic-bezier(0.22,1,0.36,1)";
  const shouldSkipInitialChatEnterAnimation =
    hasHydrated && isInitialRestoreMotionLocked && isGlobalChatOpen;
  const chatPanelInitial = shouldSkipInitialChatEnterAnimation
    ? chatMotionSpec.animate
    : chatMotionSpec.initial;
  const chatPanelTransition = shouldSkipInitialChatEnterAnimation
    ? ({ duration: 0 } as const)
    : chatMotionSpec.transition;

  useEffect(() => {
    const forwardWheelToCentralBlock = (event: WheelEvent) => {
      const block = centralBlockRef.current;
      if (!block) return;

      // Do not interfere with browser zoom gesture.
      if (event.ctrlKey || event.metaKey) return;

      const target = event.target;
      if (target instanceof Node && block.contains(target)) {
        return;
      }
      if (target instanceof Element && target.closest('[data-sidebar-keep-open="true"]')) {
        return;
      }
      if (
        sidebarBehaviorModify.stopWheelForwardWhenHover &&
        target instanceof Node &&
        leftSidebarRef.current?.contains(target)
      ) {
        return;
      }

      const canScrollY = block.scrollHeight > block.clientHeight;
      const canScrollX = block.scrollWidth > block.clientWidth;
      if (!canScrollY && !canScrollX) return;

      event.preventDefault();
      block.scrollBy({
        top: event.deltaY,
        left: event.deltaX,
        behavior: "auto",
      });
    };

    window.addEventListener("wheel", forwardWheelToCentralBlock, { passive: false });
    return () => {
      window.removeEventListener("wheel", forwardWheelToCentralBlock);
    };
  }, []);

  return (
    <main
      className="h-dvh w-full overflow-hidden"
      style={{
        backgroundColor: "#15191D",
        paddingLeft: sideSpace,
        paddingRight: sideSpace,
        paddingTop: panelTop,
      }}
    >
      <div
        className={`fixed z-40 flex ${searchWrapperJustifyClass}`}
        style={{
          left: searchWrapperLeft,
          right: adaptiveRightInset,
          top: searchTop,
          paddingLeft: searchWrapperPaddingLeft,
          paddingRight: sideSpace,
          pointerEvents: "none",
          transition: layoutTransition,
        }}
      >
        <div
          className="flex w-full items-center"
          style={
            {
              maxWidth: searchContentMaxWidth,
              pointerEvents: "auto",
              ...searchbarVars,
            } as CSSProperties
          }
        >
          <div className="min-w-0 flex-1">
            <NewHomeCommandSearch className="w-full max-w-none" />
          </div>
        </div>
      </div>

      <div
        className="fixed z-40 flex items-center"
        style={
          {
            top: searchTop,
            right: topRightActionGroupRight,
            gap: signUpButtonGap,
            transition: layoutTransition,
          } as CSSProperties
        }
      >
        {showAuthButtons ? (
          <div style={authButtonsShellStyle}>
            <Link
              href="/auth?next=%2Fnew-home"
              className="group inline-flex items-center justify-center text-center tracking-[0.01em] transition-[filter,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:brightness-105 active:translate-y-px"
              style={logInButtonStyle}
            >
              <span className="relative inline-block leading-none" style={logInButtonLabelStyle}>
                Log in
              </span>
            </Link>
            <Link
              href="/auth?next=%2Fnew-home"
              className="new-home-signup-cta-press group inline-flex items-center justify-center text-center tracking-[0.01em] transition-[filter,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:brightness-105 active:translate-y-px"
              style={signUpButtonStyle}
            >
              <span
                className="relative inline-block leading-none after:pointer-events-none after:absolute after:left-0 after:-bottom-[3px] after:h-[2px] after:w-0 after:bg-current after:transition-[width] after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:after:w-full"
                style={signUpButtonLabelStyle}
              >
                Sign up
              </span>
            </Link>
          </div>
        ) : null}
        <div className="group relative grid place-items-center">
          <button
            type="button"
            aria-label="Toggle global chat"
            aria-pressed={isGlobalChatOpen}
            data-sidebar-keep-open="true"
            onClick={() => setGlobalChatOpen((prev) => !prev)}
            className="grid place-items-center transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={
              isGlobalChatOpen
                ? ({ ...searchActionStyle, ...searchActionActiveStyle } as CSSProperties)
                : searchActionStyle
            }
          >
            <MessageCircle style={{ width: searchActionIconSize, height: searchActionIconSize }} />
          </button>
          <span className={chatToggleTooltipClassName}>Global Chat</span>
        </div>
      </div>

      <section
        ref={leftSidebarRef}
        className={sidebarClassModify.container}
        style={sidebarContainerStyle}
      >
        <div className={sidebarClassModify.inner}>
          <SidebarTestClient
            embedded={sidebarBehaviorModify.embedded}
            forceVisible={sidebarBehaviorModify.forceVisible}
            theme={sidebarTheme}
            profileSheetLayout={sidebarProfileSheetLayout}
            compactExpandedPersistenceKey={NEW_HOME_SIDEBAR_COMPACT_EXPANDED_STORAGE_KEY}
            onWidthChange={(width) => {
              setSidebarActiveWidthPx((current) => (current === width ? current : width));
            }}
            className={sidebarClassModify.client}
          />
        </div>
      </section>

      <AnimatePresence initial={false}>
        {isGlobalChatOpen ? (
          <motion.aside
            key="new-home-global-chat-panel"
            initial={chatPanelInitial}
            animate={chatMotionSpec.animate}
            exit={chatMotionSpec.exit}
            transition={chatPanelTransition}
            data-sidebar-keep-open="true"
            className={chatGlobalClassModify.container}
            style={chatContainerStyle}
          >
            <NewHomeGlobalChatPanel
              open={isGlobalChatOpen}
              onClose={() => setGlobalChatOpen(false)}
            />
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <section
        ref={centralBlockRef}
        className="new-home-custom-scrollbar z-10 overflow-x-hidden overflow-y-auto"
        style={{
          position: "fixed",
          top: panelTop,
          left: adaptiveCentralLeft,
          right: adaptiveRightInset,
          bottom: "calc(env(safe-area-inset-bottom, 0px) * -1)",
          transition: layoutTransition,
          ...bloccoCentraleStyle,
          borderTopRightRadius: isGlobalChatOpen
            ? centralBlockOpenTopRightRadius
            : bloccoCentraleStyle.borderTopRightRadius,
        }}
      >
        <div
          className="flex items-end"
          style={{
            minHeight: "260dvh",
            paddingLeft: adaptiveCentralLeft,
            paddingRight: sideSpace,
            paddingBottom: "32px",
          }}
        >
          <p className="text-sm font-medium text-white/80">
            Test scroll in fondo al blocco centrale: se leggi questa riga, lo scroll interno funziona.
          </p>
        </div>
      </section>
    </main>
  );
}
