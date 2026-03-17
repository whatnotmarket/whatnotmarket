import type { CSSProperties } from "react";

export const chatGlobalButtonLayoutModify = {
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

export const chatGlobalButtonStyleModify = {
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
    width: chatGlobalButtonLayoutModify.size,
    height: chatGlobalButtonLayoutModify.size,
    backgroundColor: chatGlobalButtonStyleModify.backgroundColor,
    borderColor: chatGlobalButtonStyleModify.borderColor,
    borderWidth: chatGlobalButtonStyleModify.borderWidth,
    borderStyle: chatGlobalButtonStyleModify.borderStyle,
    borderRadius: chatGlobalButtonStyleModify.borderRadius,
    color: chatGlobalButtonStyleModify.color,
    boxShadow: chatGlobalButtonStyleModify.boxShadow,
  } as CSSProperties;
}

export function getChatGlobalButtonGap(): string {
  return chatGlobalButtonLayoutModify.gapFromSearchbar;
}

// Spazio orizzontale tra searchbar e blocco destro (Log in + Sign up + chat) quando la chat globale e chiusa.
export function getActionsToSearchGapWhenChatClosed(): string {
  return chatGlobalButtonLayoutModify.actionsToSearchGapWhenChatClosed;
}

// Larghezza totale del blocco azioni destro (shell auth + gap + bottone chat).
export function getRightActionGroupWidth(): string {
  return `calc(${getAuthButtonsShellWidth()} + ${chatGlobalButtonLayoutModify.signupGapFromChatButton} + ${chatGlobalButtonLayoutModify.size})`;
}

export function getSignUpButtonWidth(): string {
  return chatGlobalButtonLayoutModify.signupWidth;
}

export function getAuthButtonsShellWidth(): string {
  return `calc(${chatGlobalButtonLayoutModify.loginWidth} + ${chatGlobalButtonLayoutModify.signupGapFromChatButton} + ${chatGlobalButtonLayoutModify.signupWidth} + (${chatGlobalButtonLayoutModify.authButtonsShellPaddingX} * 2))`;
}

export function getAuthButtonsShellStyle(): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: chatGlobalButtonLayoutModify.signupGapFromChatButton,
    paddingLeft: chatGlobalButtonLayoutModify.authButtonsShellPaddingX,
    paddingRight: chatGlobalButtonLayoutModify.authButtonsShellPaddingX,
    paddingTop: chatGlobalButtonLayoutModify.authButtonsShellPaddingY,
    paddingBottom: chatGlobalButtonLayoutModify.authButtonsShellPaddingY,
    backgroundColor: chatGlobalButtonStyleModify.authButtonsShellBackgroundColor,
    borderRadius: chatGlobalButtonStyleModify.authButtonsShellBorderRadius,
  } as CSSProperties;
}

export function getLogInButtonWidth(): string {
  return chatGlobalButtonLayoutModify.loginWidth;
}

export function getSignUpButtonGap(): string {
  return chatGlobalButtonLayoutModify.signupGapFromChatButton;
}

export function getLogInButtonStyle(): CSSProperties {
  return {
    width: chatGlobalButtonLayoutModify.loginWidth,
    height: chatGlobalButtonLayoutModify.loginHeight,
    backgroundColor: chatGlobalButtonStyleModify.loginBackgroundColor,
    color: chatGlobalButtonStyleModify.loginTextColor,
    borderRadius: chatGlobalButtonStyleModify.loginBorderRadius,
    boxShadow: chatGlobalButtonStyleModify.loginShadow,
    fontWeight: chatGlobalButtonStyleModify.loginFontWeight,
    fontSize: chatGlobalButtonStyleModify.loginFontSize,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
  } as CSSProperties;
}

// Offset verticale della sola label (testo) del bottone LOG IN.
export function getLogInButtonLabelStyle(): CSSProperties {
  return {
    position: "relative",
    top: chatGlobalButtonStyleModify.loginLabelOffsetY,
    display: "inline-block",
  } as CSSProperties;
}

export function getSignUpButtonStyle(): CSSProperties {
  return {
    width: chatGlobalButtonLayoutModify.signupWidth,
    height: chatGlobalButtonLayoutModify.signupHeight,
    backgroundColor: chatGlobalButtonStyleModify.signupBackgroundColor,
    color: chatGlobalButtonStyleModify.signupTextColor,
    borderRadius: chatGlobalButtonStyleModify.signupBorderRadius,
    boxShadow: chatGlobalButtonStyleModify.signupShadow,
    fontWeight: chatGlobalButtonStyleModify.signupFontWeight,
    fontSize: chatGlobalButtonStyleModify.signupFontSize,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
  } as CSSProperties;
}

// Offset verticale della sola label (testo) del bottone Sign up.
export function getSignUpButtonLabelStyle(): CSSProperties {
  return {
    position: "relative",
    top: chatGlobalButtonStyleModify.signupLabelOffsetY,
    display: "inline-block",
  } as CSSProperties;
}

export function getLogInButtonHoverStyle(): CSSProperties {
  return {
    backgroundColor: chatGlobalButtonStyleModify.loginHoverBackgroundColor,
  } as CSSProperties;
}

export function getSignUpButtonHoverStyle(): CSSProperties {
  return {
    backgroundColor: chatGlobalButtonStyleModify.signupHoverBackgroundColor,
  } as CSSProperties;
}

export function getChatGlobalButtonPinnedGap(): string {
  return chatGlobalButtonLayoutModify.pinnedGapFromCentralRightEdge;
}

export function getChatGlobalButtonSize(): string {
  return chatGlobalButtonLayoutModify.size;
}

export function getChatGlobalButtonIconSize(): string {
  return chatGlobalButtonLayoutModify.iconSize;
}

export function getChatGlobalPanelWidth(): string {
  return chatGlobalButtonLayoutModify.panelWidth;
}

export function getChatGlobalButtonActiveStyle(): CSSProperties {
  return {
    backgroundColor: chatGlobalButtonStyleModify.activeBackgroundColor,
    borderColor: chatGlobalButtonStyleModify.activeBorderColor,
  } as CSSProperties;
}
