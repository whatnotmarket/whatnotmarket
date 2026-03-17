import type { CSSProperties } from "react";

export const globalChatLayout = {
  panelWidth: "clamp(330px, 28vw, 390px)",
  leftSpace: "15px",
  rightSpace: "15px",
  zIndex: 70,
  bottom: "calc(env(safe-area-inset-bottom, 0px) * -1)",
  motionOffsetX: 20,
  motionDuration: 0.22,
  motionEase: [0.22, 1, 0.36, 1] as const,
} as const;

export const globalChatClassNames = {
  container: "fixed overflow-hidden",
  panel: "relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-transparent",
} as const;

export const globalChatBehavior = {
  maxMessageLength: 180,
  sendButtonMotionDuration: 0.15,
  onlineDisplayBase: 478,
  onlineMinFloor: 283,
  onlineInflateFactor: 5,
  onlineStepScale: 0.15,
  onlineStepMin: 1,
  onlineStepMax: 20,
  onlineJitterAbs: 2,
  onlineTickBaseMs: 4000,
  onlineTickJitterMs: 3000,
} as const;

export const globalChatColors = {
  homeBackground: "none",
  chatPanel: "#1e2428aa",
  surface: "#FFFFFF",
  surfaceSoft: "#F8FAFC",
  border: "#D1D5DB",
  textPrimary: "#111827",
  textMuted: "#6B7280",
  textSecondary: "#374151",
  textTertiary: "#9CA3AF",
  avatarFallbackBg: "#E5E7EB",
  surfaceDeep: "#F3F4F6",
  tooltipBg: "#111827",
  tooltipBorder: "#1F2937",
  successDot: "#16A34A",
  successStroke: "#BBF7D0",
  resizeHandleIcon: "#6B7280",
  danger: "#DC2626",
  infoBadgeBg: "#DBEAFE",
  infoBadgeText: "#1E3A8A",
  warningBadgeBg: "#FEF3C7",
  warningBadgeText: "#78350F",
  buttonPrimaryBg: "#111827",
  buttonPrimaryText: "#FFFFFF",
  buttonPrimaryHoverBg: "#1F2937",
  roomButtonBackground: "#22282F",
  roomButtonBorder: "#d1d5db04",
  roomButtonText: "#ffffffff",
  roomButtonHoverBackground: "#272d32ff",
  roomDropdownBackground: "#22282F",
  roomDropdownBorder: "#d1d5db04",
  roomItemText: "#ffffffff",
  roomItemHoverBackground: "#1e242877",
  roomItemActiveBackground: "#1E2428",
  roomFocusRing: "#D1D5DB",
  headerActionBackground: "#22282F",
  headerActionBorder: "#d1d5db04",
  headerActionText: "#ffffffff",
  headerActionHoverBackground: "#272d32ff",
  headerActionFocusRing: "#D1D5DB",
  stateCardBackground: "#22282F",
  stateCardBorder: "#d1d5db04",
  stateCardText: "#ffffffff",
  messageCardBackground: "#15191D",
  messageCardBorder: "#d1d5db04",
  messageDisplayName: "#ffffffff",
  messageTime: "#9CA3AF",
  messageBodyText: "#ffffffff",
  footerBackground: "#15191D",
  footerBorder: "#d1d5db04",
  footerRadius: "20px",
  userSheetBackground: "#22282F",
  userSheetBorder: "#d1d5db04",
  userSheetTitleText: "#ffffffff",
  userSheetHandleText: "#ffffffa5",
  userSheetBodyText: "#e7e7e7ff",
  userSheetLabelText: "#ffffffa5",
  userSheetLoadingText: "#ffffffa5",
  rulesCardBackground: "#1e2428aa",
  rulesCardBorder: "#d1d5db04",
  rulesCardText: "#e7e7e7ff",
  rulesTitle: "#ffffffff",
  rulesCloseButtonBackground: "#22282F",
  rulesCloseButtonBorder: "#d1d5db04",
  rulesCloseButtonText: "#ffffffff",
  rulesCloseButtonHoverBackground: "#D1D5DB",
  rulesAcceptButtonBackground: "#22282F",
  rulesAcceptButtonText: "#FFFFFF",
  rulesAcceptButtonHoverBackground: "#272d32ff",
  inputBackground: "#22282F",
  inputReadOnlyBackground: "#22282F",
  inputBorder: "#d1d5db04",
  inputText: "#ffffffff",
  inputPlaceholder: "#9CA3AF",
  inputReadOnlyText: "rgba(17, 24, 39, 0.60)",
  inputReadOnlyPlaceholder: "rgba(255, 255, 255, 0.47)",
  sendButtonBackground: "#FFFFFF",
  sendButtonText: "#22282F",
  sendButtonHoverBackground: "#E4E4E7",
  errorBackground: "#FFFFFF",
  errorBorder: "#D1D5DB",
  errorText: "#DC2626",
  footerText: "#ffffffff",
  footerLink: "#ffffffa5",
  footerLinkHover: "#ffffffff",
  footerCounter: "#9CA3AF",
  footerOnlineDot: "#16A34A",
  footerOnlineDotStroke: "#00ff59ff",
} as const;

export const globalChatComponentClassNames = {
  headerLayer: "relative z-20",
  messageList: "relative flex-1 min-h-0 space-y-2 overflow-y-auto no-scrollbar px-3 py-3",
  stateCard:
    "rounded-2xl border-2 border-[var(--gc-state-card-border)] bg-[var(--gc-state-card-bg)] p-3 text-sm text-[var(--gc-state-card-text)] shadow-none",
  messageCard:
    "rounded-2xl border-2 border-[var(--gc-message-card-border)] bg-[var(--gc-message-card-bg)] px-3 py-2 shadow-none",
  messageRow: "flex items-center gap-2",
  messageAvatar: "shrink-0 border-2 border-[var(--gc-border)]",
  messageAvatarFallback: "bg-[var(--gc-avatar-fallback-bg)] text-[10px] text-[var(--gc-text-secondary)]",
  messageBody: "min-w-0 flex-1",
  messageHeader: "flex items-center justify-between gap-2",
  messageDisplayName: "truncate text-sm font-bold text-[var(--gc-message-display-name)]",
  messageTime: "shrink-0 text-[11px] text-[var(--gc-message-time)]",
  messageText: "mt-0.5 whitespace-pre-wrap break-words text-sm text-[var(--gc-message-body-text)]",
  composerShell:
    "mx-3 mb-3 mt-2 rounded-[var(--gc-footer-radius)] border-2 border-[var(--gc-footer-border)] bg-[var(--gc-footer-bg)] p-3 shadow-none",
  rulesCard:
    "mb-2 rounded-2xl border-2 border-[var(--gc-rules-card-border)] bg-[var(--gc-rules-card-bg)] px-3 py-3 text-sm text-[var(--gc-rules-card-text)]",
  rulesHeader: "flex items-center justify-between",
  rulesTitle: "text-[var(--gc-rules-title)] font-semibold",
  rulesCloseButton:
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[var(--gc-header-action-border)] bg-[var(--gc-header-action-bg)] text-[var(--gc-header-action-text)] transition hover:bg-[var(--gc-header-action-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-header-action-focus-ring)]",
  rulesList: "mt-2 list-disc pl-5 space-y-1",
  rulesActionWrap: "mt-3",
  rulesAcceptButton:
    "w-full rounded-2xl bg-[var(--gc-rules-accept-bg)] px-4 py-3 text-[var(--gc-rules-accept-text)] hover:bg-[var(--gc-rules-accept-hover-bg)]",
  errorCard:
    "mb-2 rounded-xl border-2 border-[var(--gc-error-border)] bg-[var(--gc-error-bg)] px-3 py-2 text-xs text-[var(--gc-error-text)]",
  inputRow: "mb-2 flex items-center gap-2",
  inputWrap: "relative flex-1",
  inputBase:
    "h-11 w-full rounded-2xl border-2 border-[var(--gc-input-border)] px-3 text-base shadow-none focus:border-[var(--gc-input-border)] focus:outline-none focus:shadow-none disabled:cursor-not-allowed",
  inputCanWrite:
    "bg-[var(--gc-input-bg)] pr-28 text-[var(--gc-input-text)] placeholder:text-[var(--gc-input-placeholder)]",
  inputReadOnly:
    "bg-[var(--gc-input-readonly-bg)] pr-3 text-[var(--gc-input-readonly-text)] placeholder:text-[var(--gc-input-readonly-placeholder)]",
  sendButtonWrap: "absolute inset-y-1 right-1 flex items-center",
  sendButton:
    "flex h-full items-center gap-2 rounded-2xl border-0 bg-[var(--gc-send-button-bg)] px-4 text-sm font-medium text-[var(--gc-send-button-text)] transition-all hover:bg-[var(--gc-send-button-hover-bg)] disabled:cursor-not-allowed disabled:opacity-40",
  statusRow: "flex items-center justify-between gap-2 text-xs text-[var(--gc-footer-text)]",
  statusOnline: "inline-flex items-center gap-2",
  statusSignInLink:
    "inline-flex items-center gap-1 text-[var(--gc-footer-link)] hover:text-[var(--gc-footer-link-hover)]",
  statusCounter: "text-[var(--gc-footer-counter)]",
  statusOnlineDotIcon: "h-6 w-6",
  userSheetPanel:
    "absolute bottom-2 left-2 right-2 z-[95] h-[60%] overflow-hidden rounded-3xl border p-3",
  userSheetAvatar: "shrink-0 border border-[var(--gc-user-sheet-border)]",
  userSheetDisplayName:
    "truncate text-left text-sm font-bold text-[var(--gc-user-sheet-title-text)] transition hover:underline",
  userSheetHandle: "truncate text-xs text-[var(--gc-user-sheet-handle-text)]",
  userSheetLoading: "text-sm text-[var(--gc-user-sheet-loading-text)]",
  userSheetBody: "space-y-2 text-sm text-[var(--gc-user-sheet-body-text)]",
  userSheetLabel: "text-[var(--gc-user-sheet-label-text)]",
} as const;

export const globalChatStyleTokens = {
  panelBackgroundColor: "var(--gc-chat-panel)",
  panelBorderColor: "var(--gc-border)",
  panelBorderWidth: "0px",
  panelBorderStyle: "solid",
  panelBorderRadius: "20px",
  panelBorderTopLeftRadius: "20px",
  panelBorderTopRightRadius: "20px",
  panelBorderBottomLeftRadius: "0px",
  panelBorderBottomRightRadius: "0px",
  panelShadow: "inset 0 2px 0 rgba(255,255,255,0.02)",
  centralBlockOpenTopRightRadius: "20px",
  stateCardBackgroundColor: "var(--gc-state-card-bg)",
  stateCardBorderColor: "var(--gc-state-card-border)",
  stateCardBorderWidth: "2px",
  stateCardBorderStyle: "solid",
  stateCardBackgroundImage: "none",
  stateCardOpacity: 1,
  messageCardBackgroundColor: "var(--gc-message-card-bg)",
  messageCardBorderColor: "var(--gc-message-card-border)",
  messageCardBorderWidth: "2px",
  messageCardBorderStyle: "solid",
  messageCardBackgroundImage: "none",
  messageCardOpacity: 1,
  composerShellBackgroundColor: "var(--gc-footer-bg)",
  composerShellBorderColor: "var(--gc-footer-border)",
  composerShellBorderWidth: "2px",
  composerShellBorderStyle: "solid",
  composerShellBorderRadius: "var(--gc-footer-radius)",
  composerShellBackgroundImage: "none",
  userSheetBackgroundColor: "var(--gc-user-sheet-bg)",
  userSheetBorderColor: "var(--gc-user-sheet-border)",
  userSheetBorderWidth: "1px",
  userSheetBorderStyle: "solid",
  userSheetBorderRadius: "24px",
  userSheetShadow: "0 16px 48px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
  userSheetOpacity: 1,
  rulesCardBackgroundColor: "var(--gc-rules-card-bg)",
  rulesCardBorderColor: "var(--gc-rules-card-border)",
  rulesCardBorderWidth: "2px",
  rulesCardBorderStyle: "solid",
  rulesCardBackgroundImage: "none",
  rulesCardOpacity: 1,
  inputBackgroundColor: "var(--gc-input-bg)",
  inputReadOnlyBackgroundColor: "var(--gc-input-readonly-bg)",
  inputBackgroundImage: "none",
  inputCanWriteOpacity: 1,
  inputReadOnlyOpacity: 0.3,
  errorCardBackgroundColor: "var(--gc-error-bg)",
  errorCardBorderColor: "var(--gc-error-border)",
  errorCardBorderWidth: "2px",
  errorCardBorderStyle: "solid",
  errorCardBackgroundImage: "none",
  errorCardOpacity: 1,
  sendButtonBackgroundImage: "none",
  sendButtonOpacity: 1,
} as const;

export function getChatGlobalPanelWidth(): string {
  return globalChatLayout.panelWidth;
}

export function getChatGlobalCenterRightInset(): string {
  return `calc(${globalChatLayout.panelWidth} + ${globalChatLayout.leftSpace} + ${globalChatLayout.rightSpace})`;
}

export function getChatGlobalContainerStyle(panelTop: string): CSSProperties {
  return {
    top: panelTop,
    right: globalChatLayout.rightSpace,
    bottom: globalChatLayout.bottom,
    width: globalChatLayout.panelWidth,
    marginLeft: globalChatLayout.leftSpace,
    zIndex: globalChatLayout.zIndex,
  } as CSSProperties;
}

export function getChatGlobalMotionSpec() {
  return {
    initial: { x: globalChatLayout.motionOffsetX, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: globalChatLayout.motionOffsetX, opacity: 0 },
    transition: {
      duration: globalChatLayout.motionDuration,
      ease: globalChatLayout.motionEase,
    },
  } as const;
}

export function getChatGlobalCssVars(): CSSProperties {
  return {
    ["--gc-home-bg" as string]: globalChatColors.homeBackground,
    ["--gc-chat-panel" as string]: globalChatColors.chatPanel,
    ["--gc-surface" as string]: globalChatColors.surface,
    ["--gc-surface-soft" as string]: globalChatColors.surfaceSoft,
    ["--gc-border" as string]: globalChatColors.border,
    ["--gc-text-primary" as string]: globalChatColors.textPrimary,
    ["--gc-text-muted" as string]: globalChatColors.textMuted,
    ["--gc-text-secondary" as string]: globalChatColors.textSecondary,
    ["--gc-text-tertiary" as string]: globalChatColors.textTertiary,
    ["--gc-avatar-fallback-bg" as string]: globalChatColors.avatarFallbackBg,
    ["--gc-surface-deep" as string]: globalChatColors.surfaceDeep,
    ["--gc-tooltip-bg" as string]: globalChatColors.tooltipBg,
    ["--gc-tooltip-border" as string]: globalChatColors.tooltipBorder,
    ["--gc-success-dot" as string]: globalChatColors.successDot,
    ["--gc-success-stroke" as string]: globalChatColors.successStroke,
    ["--gc-resize-handle-icon" as string]: globalChatColors.resizeHandleIcon,
    ["--gc-danger" as string]: globalChatColors.danger,
    ["--gc-info-badge-bg" as string]: globalChatColors.infoBadgeBg,
    ["--gc-info-badge-text" as string]: globalChatColors.infoBadgeText,
    ["--gc-warning-badge-bg" as string]: globalChatColors.warningBadgeBg,
    ["--gc-warning-badge-text" as string]: globalChatColors.warningBadgeText,
    ["--gc-button-primary-bg" as string]: globalChatColors.buttonPrimaryBg,
    ["--gc-button-primary-text" as string]: globalChatColors.buttonPrimaryText,
    ["--gc-button-primary-hover-bg" as string]: globalChatColors.buttonPrimaryHoverBg,
    ["--gc-room-button-bg" as string]: globalChatColors.roomButtonBackground,
    ["--gc-room-button-border" as string]: globalChatColors.roomButtonBorder,
    ["--gc-room-button-text" as string]: globalChatColors.roomButtonText,
    ["--gc-room-button-hover-bg" as string]: globalChatColors.roomButtonHoverBackground,
    ["--gc-room-dropdown-bg" as string]: globalChatColors.roomDropdownBackground,
    ["--gc-room-dropdown-border" as string]: globalChatColors.roomDropdownBorder,
    ["--gc-room-item-text" as string]: globalChatColors.roomItemText,
    ["--gc-room-item-hover-bg" as string]: globalChatColors.roomItemHoverBackground,
    ["--gc-room-item-active-bg" as string]: globalChatColors.roomItemActiveBackground,
    ["--gc-room-focus-ring" as string]: globalChatColors.roomFocusRing,
    ["--gc-header-action-bg" as string]: globalChatColors.headerActionBackground,
    ["--gc-header-action-border" as string]: globalChatColors.headerActionBorder,
    ["--gc-header-action-text" as string]: globalChatColors.headerActionText,
    ["--gc-header-action-hover-bg" as string]: globalChatColors.headerActionHoverBackground,
    ["--gc-header-action-focus-ring" as string]: globalChatColors.headerActionFocusRing,
    ["--gc-state-card-bg" as string]: globalChatColors.stateCardBackground,
    ["--gc-state-card-border" as string]: globalChatColors.stateCardBorder,
    ["--gc-state-card-text" as string]: globalChatColors.stateCardText,
    ["--gc-message-card-bg" as string]: globalChatColors.messageCardBackground,
    ["--gc-message-card-border" as string]: globalChatColors.messageCardBorder,
    ["--gc-message-display-name" as string]: globalChatColors.messageDisplayName,
    ["--gc-message-time" as string]: globalChatColors.messageTime,
    ["--gc-message-body-text" as string]: globalChatColors.messageBodyText,
    ["--gc-footer-bg" as string]: globalChatColors.footerBackground,
    ["--gc-footer-border" as string]: globalChatColors.footerBorder,
    ["--gc-footer-radius" as string]: globalChatColors.footerRadius,
    ["--gc-user-sheet-bg" as string]: globalChatColors.userSheetBackground,
    ["--gc-user-sheet-border" as string]: globalChatColors.userSheetBorder,
    ["--gc-user-sheet-title-text" as string]: globalChatColors.userSheetTitleText,
    ["--gc-user-sheet-handle-text" as string]: globalChatColors.userSheetHandleText,
    ["--gc-user-sheet-body-text" as string]: globalChatColors.userSheetBodyText,
    ["--gc-user-sheet-label-text" as string]: globalChatColors.userSheetLabelText,
    ["--gc-user-sheet-loading-text" as string]: globalChatColors.userSheetLoadingText,
    ["--gc-rules-card-bg" as string]: globalChatColors.rulesCardBackground,
    ["--gc-rules-card-border" as string]: globalChatColors.rulesCardBorder,
    ["--gc-rules-card-text" as string]: globalChatColors.rulesCardText,
    ["--gc-rules-title" as string]: globalChatColors.rulesTitle,
    ["--gc-rules-close-bg" as string]: globalChatColors.rulesCloseButtonBackground,
    ["--gc-rules-close-border" as string]: globalChatColors.rulesCloseButtonBorder,
    ["--gc-rules-close-text" as string]: globalChatColors.rulesCloseButtonText,
    ["--gc-rules-close-hover-bg" as string]: globalChatColors.rulesCloseButtonHoverBackground,
    ["--gc-rules-accept-bg" as string]: globalChatColors.rulesAcceptButtonBackground,
    ["--gc-rules-accept-text" as string]: globalChatColors.rulesAcceptButtonText,
    ["--gc-rules-accept-hover-bg" as string]: globalChatColors.rulesAcceptButtonHoverBackground,
    ["--gc-input-bg" as string]: globalChatColors.inputBackground,
    ["--gc-input-readonly-bg" as string]: globalChatColors.inputReadOnlyBackground,
    ["--gc-input-border" as string]: globalChatColors.inputBorder,
    ["--gc-input-text" as string]: globalChatColors.inputText,
    ["--gc-input-placeholder" as string]: globalChatColors.inputPlaceholder,
    ["--gc-input-readonly-text" as string]: globalChatColors.inputReadOnlyText,
    ["--gc-input-readonly-placeholder" as string]: globalChatColors.inputReadOnlyPlaceholder,
    ["--gc-send-button-bg" as string]: globalChatColors.sendButtonBackground,
    ["--gc-send-button-text" as string]: globalChatColors.sendButtonText,
    ["--gc-send-button-hover-bg" as string]: globalChatColors.sendButtonHoverBackground,
    ["--gc-error-bg" as string]: globalChatColors.errorBackground,
    ["--gc-error-border" as string]: globalChatColors.errorBorder,
    ["--gc-error-text" as string]: globalChatColors.errorText,
    ["--gc-footer-text" as string]: globalChatColors.footerText,
    ["--gc-footer-link" as string]: globalChatColors.footerLink,
    ["--gc-footer-link-hover" as string]: globalChatColors.footerLinkHover,
    ["--gc-footer-counter" as string]: globalChatColors.footerCounter,
    ["--gc-footer-online-dot" as string]: globalChatColors.footerOnlineDot,
    ["--gc-footer-online-dot-stroke" as string]: globalChatColors.footerOnlineDotStroke,
  } as CSSProperties;
}

export function getChatGlobalPanelStyle(): CSSProperties {
  return {
    transform: "none",
    backgroundColor: globalChatStyleTokens.panelBackgroundColor,
    borderColor: globalChatStyleTokens.panelBorderColor,
    borderWidth: globalChatStyleTokens.panelBorderWidth,
    borderStyle: globalChatStyleTokens.panelBorderStyle,
    borderRadius: globalChatStyleTokens.panelBorderRadius,
    borderTopLeftRadius: globalChatStyleTokens.panelBorderTopLeftRadius,
    borderTopRightRadius: globalChatStyleTokens.panelBorderTopRightRadius,
    borderBottomLeftRadius: globalChatStyleTokens.panelBorderBottomLeftRadius,
    borderBottomRightRadius: globalChatStyleTokens.panelBorderBottomRightRadius,
    boxShadow: globalChatStyleTokens.panelShadow,
  } as CSSProperties;
}

export function getChatGlobalStateCardStyle(): CSSProperties {
  return {
    backgroundColor: globalChatStyleTokens.stateCardBackgroundColor,
    borderColor: globalChatStyleTokens.stateCardBorderColor,
    borderWidth: globalChatStyleTokens.stateCardBorderWidth,
    borderStyle: globalChatStyleTokens.stateCardBorderStyle,
    backgroundImage: globalChatStyleTokens.stateCardBackgroundImage,
    opacity: globalChatStyleTokens.stateCardOpacity,
  } as CSSProperties;
}

export function getChatGlobalMessageCardStyle(): CSSProperties {
  return {
    backgroundColor: globalChatStyleTokens.messageCardBackgroundColor,
    borderColor: globalChatStyleTokens.messageCardBorderColor,
    borderWidth: globalChatStyleTokens.messageCardBorderWidth,
    borderStyle: globalChatStyleTokens.messageCardBorderStyle,
    backgroundImage: globalChatStyleTokens.messageCardBackgroundImage,
    opacity: globalChatStyleTokens.messageCardOpacity,
  } as CSSProperties;
}

export function getChatGlobalComposerShellStyle(): CSSProperties {
  return {
    backgroundColor: globalChatStyleTokens.composerShellBackgroundColor,
    borderColor: globalChatStyleTokens.composerShellBorderColor,
    borderWidth: globalChatStyleTokens.composerShellBorderWidth,
    borderStyle: globalChatStyleTokens.composerShellBorderStyle,
    borderRadius: globalChatStyleTokens.composerShellBorderRadius,
    backgroundImage: globalChatStyleTokens.composerShellBackgroundImage,
  } as CSSProperties;
}

export function getChatGlobalUserSheetStyle(): CSSProperties {
  return {
    backgroundColor: globalChatStyleTokens.userSheetBackgroundColor,
    borderColor: globalChatStyleTokens.userSheetBorderColor,
    borderWidth: globalChatStyleTokens.userSheetBorderWidth,
    borderStyle: globalChatStyleTokens.userSheetBorderStyle,
    borderRadius: globalChatStyleTokens.userSheetBorderRadius,
    boxShadow: globalChatStyleTokens.userSheetShadow,
    opacity: globalChatStyleTokens.userSheetOpacity,
  } as CSSProperties;
}

export function getChatGlobalRulesCardStyle(): CSSProperties {
  return {
    backgroundColor: globalChatStyleTokens.rulesCardBackgroundColor,
    borderColor: globalChatStyleTokens.rulesCardBorderColor,
    borderWidth: globalChatStyleTokens.rulesCardBorderWidth,
    borderStyle: globalChatStyleTokens.rulesCardBorderStyle,
    backgroundImage: globalChatStyleTokens.rulesCardBackgroundImage,
    opacity: globalChatStyleTokens.rulesCardOpacity,
  } as CSSProperties;
}

export function getChatGlobalInputStyle(canWrite: boolean): CSSProperties {
  return {
    backgroundColor: canWrite
      ? globalChatStyleTokens.inputBackgroundColor
      : globalChatStyleTokens.inputReadOnlyBackgroundColor,
    backgroundImage: globalChatStyleTokens.inputBackgroundImage,
    opacity: canWrite ? globalChatStyleTokens.inputCanWriteOpacity : globalChatStyleTokens.inputReadOnlyOpacity,
  } as CSSProperties;
}

export function getChatGlobalErrorCardStyle(): CSSProperties {
  return {
    backgroundColor: globalChatStyleTokens.errorCardBackgroundColor,
    borderColor: globalChatStyleTokens.errorCardBorderColor,
    borderWidth: globalChatStyleTokens.errorCardBorderWidth,
    borderStyle: globalChatStyleTokens.errorCardBorderStyle,
    backgroundImage: globalChatStyleTokens.errorCardBackgroundImage,
    opacity: globalChatStyleTokens.errorCardOpacity,
  } as CSSProperties;
}

export function getChatGlobalSendButtonStyle(): CSSProperties {
  return {
    backgroundImage: globalChatStyleTokens.sendButtonBackgroundImage,
    opacity: globalChatStyleTokens.sendButtonOpacity,
  } as CSSProperties;
}

export function getChatGlobalCentralBlockOpenTopRightRadius(): string {
  return globalChatStyleTokens.centralBlockOpenTopRightRadius;
}
