import type { CSSProperties } from "react";

export const globalChatButtonLayout = {
  size: "36px",
  gapFromSearchbar: "8px",
  actionsToSearchGapWhenChatClosed: "160px",
  authButtonsShellPaddingX: "4px",
  authButtonsShellPaddingY: "4px",
  loginWidth: "82px",
  loginHeight: "32px",
  signupWidth: "112px",
  signupHeight: "32px",
  signupGapFromChatButton: "6px",
  pinnedGapFromCentralRightEdge: "10px",
  iconSize: "16px",
  panelWidth: "clamp(330px, 28vw, 460px)",
} as const;

export const globalChatButtonStyleTokens = {
  backgroundColor: "#1e2428aa",
  borderColor: "#5b5d5f40",
  borderWidth: "0px",
  borderStyle: "solid",
  borderRadius: "12px",
  color: "#e2e2e2ff",
  boxShadow: "inset 0 2px 0 rgba(255,255,255,0.02)",
  activeBackgroundColor: "#1e2428e0",
  activeBorderColor: "#8383837a",
  authButtonsShellBackgroundColor: "#d1d5db04",
  authButtonsShellBorderRadius: "10px",
  loginBackgroundColor: "#1E2428",
  loginTextColor: "#ffffff",
  loginBorderRadius: "8px",
  loginShadow: "inset 0 -4px 0 rgba(42, 50, 56, 0.61), inset 0 1px 0 rgba(255, 255, 255, 0.02)",
  loginHoverBackgroundColor: "rgba(23, 143, 229, 0.72)",
  loginFontWeight: 700,
  loginFontSize: "13px",
  loginLabelOffsetY: "-1px",
  signupBackgroundColor: "#178fe5",
  signupTextColor: "#ffffff",
  signupBorderRadius: "8px",
  signupShadow: "inset 0 -4px 0 rgba(8, 60, 100, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
  signupHoverBackgroundColor: "#2399eb",
  signupFontWeight: 700,
  signupFontSize: "16px",
  signupLabelOffsetY: "-1.5px",
} as const;

export function getChatGlobalButtonStyle(): CSSProperties {
  return {
    width: globalChatButtonLayout.size,
    height: globalChatButtonLayout.size,
    backgroundColor: globalChatButtonStyleTokens.backgroundColor,
    borderColor: globalChatButtonStyleTokens.borderColor,
    borderWidth: globalChatButtonStyleTokens.borderWidth,
    borderStyle: globalChatButtonStyleTokens.borderStyle,
    borderRadius: globalChatButtonStyleTokens.borderRadius,
    color: globalChatButtonStyleTokens.color,
    boxShadow: globalChatButtonStyleTokens.boxShadow,
  } as CSSProperties;
}

export function getChatGlobalButtonGap(): string {
  return globalChatButtonLayout.gapFromSearchbar;
}

export function getActionsToSearchGapWhenChatClosed(): string {
  return globalChatButtonLayout.actionsToSearchGapWhenChatClosed;
}

export function getRightActionGroupWidth(): string {
  return `calc(${getAuthButtonsShellWidth()} + ${globalChatButtonLayout.signupGapFromChatButton} + ${globalChatButtonLayout.size})`;
}

export function getSignUpButtonWidth(): string {
  return globalChatButtonLayout.signupWidth;
}

export function getAuthButtonsShellWidth(): string {
  return `calc(${globalChatButtonLayout.loginWidth} + ${globalChatButtonLayout.signupGapFromChatButton} + ${globalChatButtonLayout.signupWidth} + (${globalChatButtonLayout.authButtonsShellPaddingX} * 2))`;
}

export function getAuthButtonsShellStyle(): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: globalChatButtonLayout.signupGapFromChatButton,
    paddingLeft: globalChatButtonLayout.authButtonsShellPaddingX,
    paddingRight: globalChatButtonLayout.authButtonsShellPaddingX,
    paddingTop: globalChatButtonLayout.authButtonsShellPaddingY,
    paddingBottom: globalChatButtonLayout.authButtonsShellPaddingY,
    backgroundColor: globalChatButtonStyleTokens.authButtonsShellBackgroundColor,
    borderRadius: globalChatButtonStyleTokens.authButtonsShellBorderRadius,
  } as CSSProperties;
}

export function getLogInButtonWidth(): string {
  return globalChatButtonLayout.loginWidth;
}

export function getSignUpButtonGap(): string {
  return globalChatButtonLayout.signupGapFromChatButton;
}

export function getLogInButtonStyle(): CSSProperties {
  return {
    width: globalChatButtonLayout.loginWidth,
    height: globalChatButtonLayout.loginHeight,
    backgroundColor: globalChatButtonStyleTokens.loginBackgroundColor,
    color: globalChatButtonStyleTokens.loginTextColor,
    borderRadius: globalChatButtonStyleTokens.loginBorderRadius,
    boxShadow: globalChatButtonStyleTokens.loginShadow,
    fontWeight: globalChatButtonStyleTokens.loginFontWeight,
    fontSize: globalChatButtonStyleTokens.loginFontSize,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
  } as CSSProperties;
}

export function getLogInButtonLabelStyle(): CSSProperties {
  return {
    position: "relative",
    top: globalChatButtonStyleTokens.loginLabelOffsetY,
    display: "inline-block",
  } as CSSProperties;
}

export function getSignUpButtonStyle(): CSSProperties {
  return {
    width: globalChatButtonLayout.signupWidth,
    height: globalChatButtonLayout.signupHeight,
    backgroundColor: globalChatButtonStyleTokens.signupBackgroundColor,
    color: globalChatButtonStyleTokens.signupTextColor,
    borderRadius: globalChatButtonStyleTokens.signupBorderRadius,
    boxShadow: globalChatButtonStyleTokens.signupShadow,
    fontWeight: globalChatButtonStyleTokens.signupFontWeight,
    fontSize: globalChatButtonStyleTokens.signupFontSize,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
  } as CSSProperties;
}

export function getSignUpButtonLabelStyle(): CSSProperties {
  return {
    position: "relative",
    top: globalChatButtonStyleTokens.signupLabelOffsetY,
    display: "inline-block",
  } as CSSProperties;
}

export function getLogInButtonHoverStyle(): CSSProperties {
  return {
    backgroundColor: globalChatButtonStyleTokens.loginHoverBackgroundColor,
  } as CSSProperties;
}

export function getSignUpButtonHoverStyle(): CSSProperties {
  return {
    backgroundColor: globalChatButtonStyleTokens.signupHoverBackgroundColor,
  } as CSSProperties;
}

export function getChatGlobalButtonPinnedGap(): string {
  return globalChatButtonLayout.pinnedGapFromCentralRightEdge;
}

export function getChatGlobalButtonSize(): string {
  return globalChatButtonLayout.size;
}

export function getChatGlobalButtonIconSize(): string {
  return globalChatButtonLayout.iconSize;
}

export function getChatGlobalPanelWidth(): string {
  return globalChatButtonLayout.panelWidth;
}

export function getChatGlobalButtonActiveStyle(): CSSProperties {
  return {
    backgroundColor: globalChatButtonStyleTokens.activeBackgroundColor,
    borderColor: globalChatButtonStyleTokens.activeBorderColor,
  } as CSSProperties;
}
