import type { CSSProperties } from "react";
import type { SidebarProfileSheetLayout, SidebarTestTheme } from "../sidebar-test/SidebarTestClient";

const sidebarLeftPx = 0;
const sidebarPaddingLeftPx = 15;
const sidebarPaddingRightPx = 6;
const sidebarPaddingBottomPx = 0;

export const sidebarLayoutConfig = {
  minRailWidth: "92px",
  left: `${sidebarLeftPx}px`,
  bottom: "calc(env(safe-area-inset-bottom, 0px) * -1)",
  paddingLeft: `${sidebarPaddingLeftPx}px`,
  paddingRight: `${sidebarPaddingRightPx}px`,
  paddingBottom: `${sidebarPaddingBottomPx}px`,
} as const;

export const sidebarClassNames = {
  container: "fixed z-[80] block overflow-visible",
  inner: "h-full min-h-0",
  client: "h-full min-h-0 w-full",
} as const;

export const sidebarBehavior = {
  stopWheelForwardWhenHover: true,
  embedded: true,
  forceVisible: true,
} as const;

export const sidebarProfileSheetLayoutOverrides: Partial<SidebarProfileSheetLayout> = {
  leftTop: "-1px",
  leftBottom: "86px",
  leftLeft: "0px",
  leftRight: "0px",
  fullTop: "8px",
  fullBottom: "86px",
  fullLeft: "8px",
  fullRight: "8px",
  zIndex: 220,
  duplicateToggleLeft: "24px",
  duplicateToggleBottom: "16px",
  duplicateToggleZIndex: 240,
};

export const sidebarThemeOverrides: Partial<SidebarTestTheme> = {
  shellBackground: "#1e2428aa",
  shellBorderColor: "#1e242849",
  shellBorderWidth: "0px",
  shellRadius: "20px",
  shellRadiusBottom: "0px",
  shellShadow: "inset 0 2px 0 rgba(255,255,255,0.02)",
  focusRingColor: "rgba(228, 237, 247, 0.40)",
  hoverBackground: "rgba(255, 255, 255, 0.10)",
  hoverTextColor: "#ffffff",
  iconMutedColor: "rgba(228, 237, 247, 0.78)",
  primaryTextColor: "rgba(239, 245, 251, 0.96)",
  secondaryTextColor: "rgba(227, 236, 245, 0.90)",
  tertiaryTextColor: "rgba(220, 231, 242, 0.82)",
  dividerColor: "rgba(255, 255, 255, 0.09)",
  leftPanelDividerColor: "rgba(255, 255, 255, 0.12)",
  secondaryButtonBackground: "rgba(255, 255, 255, 0.13)",
  secondaryButtonTextColor: "rgba(229, 238, 247, 0.90)",
  railTextColor: "rgba(232, 240, 247, 0.86)",
  railActiveBackground: "rgba(255, 255, 255, 0.16)",
  railHoverBackground: "rgba(255, 255, 255, 0.10)",
  logoBorderColor: "rgba(255, 255, 255, 0.60)",
  logoTextColor: "rgba(255, 255, 255, 0.94)",
  profileTriggerBackground: "#ecdfcf",
  profileTriggerActiveBackground: "#dcccb8",
  profileTriggerTextColor: "#1a2128",
  profileTriggerDuplicateBackground: "#ecdfcf",
  profileTriggerDuplicateTextColor: "#1a2128",
  userMenuBackground: "#15191D",
  userMenuBorderColor: "#15191D",
  userMenuItemTextColor: "rgba(255, 255, 255, 0.90)",
  userMenuItemHoverBackground: "rgba(255, 255, 255, 0.09)",
  userMenuItemHoverTextColor: "#ffffff",
  profileSheetBackground: "rgba(30, 36, 40, 1)",
  profileSheetInnerBackground: "#15191D",
  profileBadgeSecondaryBackground: "rgba(255, 255, 255, 0.14)",
  profileBadgeSecondaryTextColor: "rgba(239, 245, 251, 0.96)",
  profileAvatarBackground: "#d8d2c7",
  profileAvatarTextColor: "#1a2128",
  profileNameColor: "rgba(239, 245, 251, 0.96)",
  profileEmailColor: "rgba(213, 226, 238, 0.62)",
  profileItemTextColor: "rgba(232, 240, 247, 0.94)",
  profileItemIconColor: "rgba(224, 234, 244, 0.86)",
  profileItemHoverBackground: "rgba(255, 255, 255, 0.07)",
  profileCloseColor: "rgba(232, 240, 247, 0.76)",
  profileCloseHoverBackground: "rgba(255, 255, 255, 0.10)",
  profileCloseHoverColor: "#ffffff",
  panelCtaBackground: "rgba(255, 255, 255, 0.14)",
  panelCtaTextColor: "rgba(232, 240, 247, 0.92)",
  toggleBackground: "#1e2428aa",
  toggleHint: "rgba(255, 255, 255, 0.8)",
};

export function getSidebarLeftSpace(centralLeftSpace: string): string {
  return `max(${sidebarLayoutConfig.minRailWidth}, ${centralLeftSpace})`;
}

export function getSidebarContainerStyle(panelTop: string, sidebarLeftSpace: string): CSSProperties {
  return {
    top: panelTop,
    left: sidebarLayoutConfig.left,
    bottom: sidebarLayoutConfig.bottom,
    width: sidebarLeftSpace,
    paddingLeft: sidebarLayoutConfig.paddingLeft,
    paddingRight: sidebarLayoutConfig.paddingRight,
    paddingBottom: sidebarLayoutConfig.paddingBottom,
  } as CSSProperties;
}

export function getSidebarThemeOverrides(): Partial<SidebarTestTheme> {
  return { ...sidebarThemeOverrides };
}

export function getSidebarProfileSheetLayoutOverrides(): Partial<SidebarProfileSheetLayout> {
  return { ...sidebarProfileSheetLayoutOverrides };
}
