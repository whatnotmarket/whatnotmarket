import type { CSSProperties } from "react";

// Layout principale del pannello chat (larghezze, spazi e posizione nel viewport).
export const chatGlobalLayoutModify = {
  panelWidth: "clamp(330px, 28vw, 390px)",
  leftSpace: "15px",
  rightSpace: "15px",
  zIndex: 70,
  bottom: "calc(env(safe-area-inset-bottom, 0px) * -1)",
  motionOffsetX: 20,
  motionDuration: 0.22,
  motionEase: [0.22, 1, 0.36, 1] as const,
} as const;

// Classi base del contenitore esterno e del pannello.
export const chatGlobalClassModify = {
  container: "fixed overflow-hidden",
  panel: "relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-transparent",
} as const;

// Comportamenti funzionali della chat (limiti e timing animazioni).
export const chatGlobalBehaviorModify = {
  maxMessageLength: 180,
  sendButtonMotionDuration: 0.15,
  // Regola "online pompati": base + amplificazione + piccoli jitter nel tempo.
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

// Palette completa della chat: ogni colore modificabile parte da qui.
export const chatGlobalColorModify = {
  // Colori base pannello.
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
  // Colori menu stanze (room selector + dropdown).
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
  // Card stato/chat.
  stateCardBackground: "#22282F",
  stateCardBorder: "#d1d5db04",
  stateCardText: "#ffffffff",
  messageCardBackground: "#15191D",
  messageCardBorder: "#d1d5db04",
  messageDisplayName: "#ffffffff",
  messageTime: "#9CA3AF",
  messageBodyText: "#ffffffff",
  // Footer composer.
  footerBackground: "#15191D",
  footerBorder: "#d1d5db04",
  footerRadius: "20px",
  // Pannello profilo utente (sheet su click nome messaggio).
  userSheetBackground: "#22282F",
  userSheetBorder: "#d1d5db04",
  userSheetTitleText: "#ffffffff",
  userSheetHandleText: "#ffffffa5",
  userSheetBodyText: "#e7e7e7ff",
  userSheetLabelText: "#ffffffa5",
  userSheetLoadingText: "#ffffffa5",
  // Card regole e bottoni regole.
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
  // Input e bottone invio.
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
  // Stato errore.
  errorBackground: "#FFFFFF",
  errorBorder: "#D1D5DB",
  errorText: "#DC2626",
  // Footer info (online/login/counter).
  footerText: "#ffffffff",
  footerLink: "#ffffffa5",
  footerLinkHover: "#ffffffff",
  footerCounter: "#9CA3AF",
  footerOnlineDot: "#16A34A",
  footerOnlineDotStroke: "#00ff59ff",
} as const;

// Classi dei singoli componenti della chat (lista, card, input, footer, bottoni).
export const chatGlobalComponentClassModify = {
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
    "absolute bottom-2 left-2 right-2 z-[95] h-[60%] overflow-y-auto rounded-3xl border p-3",
  userSheetAvatar: "shrink-0 border border-[var(--gc-user-sheet-border)]",
  userSheetDisplayName:
    "truncate text-left text-sm font-bold text-[var(--gc-user-sheet-title-text)] transition hover:underline",
  userSheetHandle: "truncate text-xs text-[var(--gc-user-sheet-handle-text)]",
  userSheetLoading: "text-sm text-[var(--gc-user-sheet-loading-text)]",
  userSheetBody: "space-y-2 text-sm text-[var(--gc-user-sheet-body-text)]",
  userSheetLabel: "text-[var(--gc-user-sheet-label-text)]",
} as const;

// Stili inline per rifinire i componenti (background, bordi, radius, opacita).
export const chatGlobalStyleModify = {
  // Shell esterna pannello chat.
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
  // Card "stato"/"no messages".
  stateCardBackgroundColor: "var(--gc-state-card-bg)",
  stateCardBorderColor: "var(--gc-state-card-border)",
  stateCardBorderWidth: "2px",
  stateCardBorderStyle: "solid",
  stateCardBackgroundImage: "none",
  stateCardOpacity: 1,
  // Card messaggi.
  messageCardBackgroundColor: "var(--gc-message-card-bg)",
  messageCardBorderColor: "var(--gc-message-card-border)",
  messageCardBorderWidth: "2px",
  messageCardBorderStyle: "solid",
  messageCardBackgroundImage: "none",
  messageCardOpacity: 1,
  // Footer (composer).
  composerShellBackgroundColor: "var(--gc-footer-bg)",
  composerShellBorderColor: "var(--gc-footer-border)",
  composerShellBorderWidth: "2px",
  composerShellBorderStyle: "solid",
  composerShellBorderRadius: "var(--gc-footer-radius)",
  composerShellBackgroundImage: "none",
  // Sheet profilo utente.
  userSheetBackgroundColor: "var(--gc-user-sheet-bg)",
  userSheetBorderColor: "var(--gc-user-sheet-border)",
  userSheetBorderWidth: "1px",
  userSheetBorderStyle: "solid",
  userSheetBorderRadius: "24px",
  userSheetShadow: "0 16px 48px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
  userSheetOpacity: 1,
  // Card regole.
  rulesCardBackgroundColor: "var(--gc-rules-card-bg)",
  rulesCardBorderColor: "var(--gc-rules-card-border)",
  rulesCardBorderWidth: "2px",
  rulesCardBorderStyle: "solid",
  rulesCardBackgroundImage: "none",
  rulesCardOpacity: 1,
  // Input.
  inputBackgroundColor: "var(--gc-input-bg)",
  inputReadOnlyBackgroundColor: "var(--gc-input-readonly-bg)",
  inputBackgroundImage: "none",
  inputCanWriteOpacity: 1,
  inputReadOnlyOpacity: 0.3,
  // Card errore.
  errorCardBackgroundColor: "var(--gc-error-bg)",
  errorCardBorderColor: "var(--gc-error-border)",
  errorCardBorderWidth: "2px",
  errorCardBorderStyle: "solid",
  errorCardBackgroundImage: "none",
  errorCardOpacity: 1,
  // Bottone send.
  sendButtonBackgroundImage: "none",
  sendButtonOpacity: 1,
} as const;

export function getChatGlobalPanelWidth(): string {
  return chatGlobalLayoutModify.panelWidth;
}

export function getChatGlobalCenterRightInset(): string {
  return `calc(${chatGlobalLayoutModify.panelWidth} + ${chatGlobalLayoutModify.leftSpace} + ${chatGlobalLayoutModify.rightSpace})`;
}

export function getChatGlobalContainerStyle(panelTop: string): CSSProperties {
  return {
    top: panelTop,
    right: chatGlobalLayoutModify.rightSpace,
    bottom: chatGlobalLayoutModify.bottom,
    width: chatGlobalLayoutModify.panelWidth,
    marginLeft: chatGlobalLayoutModify.leftSpace,
    zIndex: chatGlobalLayoutModify.zIndex,
  } as CSSProperties;
}

export function getChatGlobalMotionSpec() {
  return {
    initial: { x: chatGlobalLayoutModify.motionOffsetX, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: chatGlobalLayoutModify.motionOffsetX, opacity: 0 },
    transition: {
      duration: chatGlobalLayoutModify.motionDuration,
      ease: chatGlobalLayoutModify.motionEase,
    },
  } as const;
}

// Espone tutte le CSS variables usate dalla chat, così puoi cambiare i colori da un solo file.
export function getChatGlobalCssVars(): CSSProperties {
  return {
    ["--gc-home-bg" as string]: chatGlobalColorModify.homeBackground,
    ["--gc-chat-panel" as string]: chatGlobalColorModify.chatPanel,
    ["--gc-surface" as string]: chatGlobalColorModify.surface,
    ["--gc-surface-soft" as string]: chatGlobalColorModify.surfaceSoft,
    ["--gc-border" as string]: chatGlobalColorModify.border,
    ["--gc-text-primary" as string]: chatGlobalColorModify.textPrimary,
    ["--gc-text-muted" as string]: chatGlobalColorModify.textMuted,
    ["--gc-text-secondary" as string]: chatGlobalColorModify.textSecondary,
    ["--gc-text-tertiary" as string]: chatGlobalColorModify.textTertiary,
    ["--gc-avatar-fallback-bg" as string]: chatGlobalColorModify.avatarFallbackBg,
    ["--gc-surface-deep" as string]: chatGlobalColorModify.surfaceDeep,
    ["--gc-tooltip-bg" as string]: chatGlobalColorModify.tooltipBg,
    ["--gc-tooltip-border" as string]: chatGlobalColorModify.tooltipBorder,
    ["--gc-success-dot" as string]: chatGlobalColorModify.successDot,
    ["--gc-success-stroke" as string]: chatGlobalColorModify.successStroke,
    ["--gc-resize-handle-icon" as string]: chatGlobalColorModify.resizeHandleIcon,
    ["--gc-danger" as string]: chatGlobalColorModify.danger,
    ["--gc-info-badge-bg" as string]: chatGlobalColorModify.infoBadgeBg,
    ["--gc-info-badge-text" as string]: chatGlobalColorModify.infoBadgeText,
    ["--gc-warning-badge-bg" as string]: chatGlobalColorModify.warningBadgeBg,
    ["--gc-warning-badge-text" as string]: chatGlobalColorModify.warningBadgeText,
    ["--gc-button-primary-bg" as string]: chatGlobalColorModify.buttonPrimaryBg,
    ["--gc-button-primary-text" as string]: chatGlobalColorModify.buttonPrimaryText,
    ["--gc-button-primary-hover-bg" as string]: chatGlobalColorModify.buttonPrimaryHoverBg,
    ["--gc-room-button-bg" as string]: chatGlobalColorModify.roomButtonBackground,
    ["--gc-room-button-border" as string]: chatGlobalColorModify.roomButtonBorder,
    ["--gc-room-button-text" as string]: chatGlobalColorModify.roomButtonText,
    ["--gc-room-button-hover-bg" as string]: chatGlobalColorModify.roomButtonHoverBackground,
    ["--gc-room-dropdown-bg" as string]: chatGlobalColorModify.roomDropdownBackground,
    ["--gc-room-dropdown-border" as string]: chatGlobalColorModify.roomDropdownBorder,
    ["--gc-room-item-text" as string]: chatGlobalColorModify.roomItemText,
    ["--gc-room-item-hover-bg" as string]: chatGlobalColorModify.roomItemHoverBackground,
    ["--gc-room-item-active-bg" as string]: chatGlobalColorModify.roomItemActiveBackground,
    ["--gc-room-focus-ring" as string]: chatGlobalColorModify.roomFocusRing,
    ["--gc-header-action-bg" as string]: chatGlobalColorModify.headerActionBackground,
    ["--gc-header-action-border" as string]: chatGlobalColorModify.headerActionBorder,
    ["--gc-header-action-text" as string]: chatGlobalColorModify.headerActionText,
    ["--gc-header-action-hover-bg" as string]: chatGlobalColorModify.headerActionHoverBackground,
    ["--gc-header-action-focus-ring" as string]: chatGlobalColorModify.headerActionFocusRing,
    ["--gc-state-card-bg" as string]: chatGlobalColorModify.stateCardBackground,
    ["--gc-state-card-border" as string]: chatGlobalColorModify.stateCardBorder,
    ["--gc-state-card-text" as string]: chatGlobalColorModify.stateCardText,
    ["--gc-message-card-bg" as string]: chatGlobalColorModify.messageCardBackground,
    ["--gc-message-card-border" as string]: chatGlobalColorModify.messageCardBorder,
    ["--gc-message-display-name" as string]: chatGlobalColorModify.messageDisplayName,
    ["--gc-message-time" as string]: chatGlobalColorModify.messageTime,
    ["--gc-message-body-text" as string]: chatGlobalColorModify.messageBodyText,
    ["--gc-footer-bg" as string]: chatGlobalColorModify.footerBackground,
    ["--gc-footer-border" as string]: chatGlobalColorModify.footerBorder,
    ["--gc-footer-radius" as string]: chatGlobalColorModify.footerRadius,
    ["--gc-user-sheet-bg" as string]: chatGlobalColorModify.userSheetBackground,
    ["--gc-user-sheet-border" as string]: chatGlobalColorModify.userSheetBorder,
    ["--gc-user-sheet-title-text" as string]: chatGlobalColorModify.userSheetTitleText,
    ["--gc-user-sheet-handle-text" as string]: chatGlobalColorModify.userSheetHandleText,
    ["--gc-user-sheet-body-text" as string]: chatGlobalColorModify.userSheetBodyText,
    ["--gc-user-sheet-label-text" as string]: chatGlobalColorModify.userSheetLabelText,
    ["--gc-user-sheet-loading-text" as string]: chatGlobalColorModify.userSheetLoadingText,
    ["--gc-rules-card-bg" as string]: chatGlobalColorModify.rulesCardBackground,
    ["--gc-rules-card-border" as string]: chatGlobalColorModify.rulesCardBorder,
    ["--gc-rules-card-text" as string]: chatGlobalColorModify.rulesCardText,
    ["--gc-rules-title" as string]: chatGlobalColorModify.rulesTitle,
    ["--gc-rules-close-bg" as string]: chatGlobalColorModify.rulesCloseButtonBackground,
    ["--gc-rules-close-border" as string]: chatGlobalColorModify.rulesCloseButtonBorder,
    ["--gc-rules-close-text" as string]: chatGlobalColorModify.rulesCloseButtonText,
    ["--gc-rules-close-hover-bg" as string]: chatGlobalColorModify.rulesCloseButtonHoverBackground,
    ["--gc-rules-accept-bg" as string]: chatGlobalColorModify.rulesAcceptButtonBackground,
    ["--gc-rules-accept-text" as string]: chatGlobalColorModify.rulesAcceptButtonText,
    ["--gc-rules-accept-hover-bg" as string]: chatGlobalColorModify.rulesAcceptButtonHoverBackground,
    ["--gc-input-bg" as string]: chatGlobalColorModify.inputBackground,
    ["--gc-input-readonly-bg" as string]: chatGlobalColorModify.inputReadOnlyBackground,
    ["--gc-input-border" as string]: chatGlobalColorModify.inputBorder,
    ["--gc-input-text" as string]: chatGlobalColorModify.inputText,
    ["--gc-input-placeholder" as string]: chatGlobalColorModify.inputPlaceholder,
    ["--gc-input-readonly-text" as string]: chatGlobalColorModify.inputReadOnlyText,
    ["--gc-input-readonly-placeholder" as string]: chatGlobalColorModify.inputReadOnlyPlaceholder,
    ["--gc-send-button-bg" as string]: chatGlobalColorModify.sendButtonBackground,
    ["--gc-send-button-text" as string]: chatGlobalColorModify.sendButtonText,
    ["--gc-send-button-hover-bg" as string]: chatGlobalColorModify.sendButtonHoverBackground,
    ["--gc-error-bg" as string]: chatGlobalColorModify.errorBackground,
    ["--gc-error-border" as string]: chatGlobalColorModify.errorBorder,
    ["--gc-error-text" as string]: chatGlobalColorModify.errorText,
    ["--gc-footer-text" as string]: chatGlobalColorModify.footerText,
    ["--gc-footer-link" as string]: chatGlobalColorModify.footerLink,
    ["--gc-footer-link-hover" as string]: chatGlobalColorModify.footerLinkHover,
    ["--gc-footer-counter" as string]: chatGlobalColorModify.footerCounter,
    ["--gc-footer-online-dot" as string]: chatGlobalColorModify.footerOnlineDot,
    ["--gc-footer-online-dot-stroke" as string]: chatGlobalColorModify.footerOnlineDotStroke,
  } as CSSProperties;
}

// Stile shell esterna del pannello chat.
export function getChatGlobalPanelStyle(): CSSProperties {
  return {
    transform: "none",
    backgroundColor: chatGlobalStyleModify.panelBackgroundColor,
    borderColor: chatGlobalStyleModify.panelBorderColor,
    borderWidth: chatGlobalStyleModify.panelBorderWidth,
    borderStyle: chatGlobalStyleModify.panelBorderStyle,
    borderRadius: chatGlobalStyleModify.panelBorderRadius,
    borderTopLeftRadius: chatGlobalStyleModify.panelBorderTopLeftRadius,
    borderTopRightRadius: chatGlobalStyleModify.panelBorderTopRightRadius,
    borderBottomLeftRadius: chatGlobalStyleModify.panelBorderBottomLeftRadius,
    borderBottomRightRadius: chatGlobalStyleModify.panelBorderBottomRightRadius,
    boxShadow: chatGlobalStyleModify.panelShadow,
  } as CSSProperties;
}

// Stile card stato (es. "No messages yet").
export function getChatGlobalStateCardStyle(): CSSProperties {
  return {
    backgroundColor: chatGlobalStyleModify.stateCardBackgroundColor,
    borderColor: chatGlobalStyleModify.stateCardBorderColor,
    borderWidth: chatGlobalStyleModify.stateCardBorderWidth,
    borderStyle: chatGlobalStyleModify.stateCardBorderStyle,
    backgroundImage: chatGlobalStyleModify.stateCardBackgroundImage,
    opacity: chatGlobalStyleModify.stateCardOpacity,
  } as CSSProperties;
}

// Stile card singolo messaggio.
export function getChatGlobalMessageCardStyle(): CSSProperties {
  return {
    backgroundColor: chatGlobalStyleModify.messageCardBackgroundColor,
    borderColor: chatGlobalStyleModify.messageCardBorderColor,
    borderWidth: chatGlobalStyleModify.messageCardBorderWidth,
    borderStyle: chatGlobalStyleModify.messageCardBorderStyle,
    backgroundImage: chatGlobalStyleModify.messageCardBackgroundImage,
    opacity: chatGlobalStyleModify.messageCardOpacity,
  } as CSSProperties;
}

// Stile contenitore footer composer (input + stato online/sign-in).
export function getChatGlobalComposerShellStyle(): CSSProperties {
  return {
    backgroundColor: chatGlobalStyleModify.composerShellBackgroundColor,
    borderColor: chatGlobalStyleModify.composerShellBorderColor,
    borderWidth: chatGlobalStyleModify.composerShellBorderWidth,
    borderStyle: chatGlobalStyleModify.composerShellBorderStyle,
    borderRadius: chatGlobalStyleModify.composerShellBorderRadius,
    backgroundImage: chatGlobalStyleModify.composerShellBackgroundImage,
  } as CSSProperties;
}

// Stile sheet profilo utente (si apre cliccando il nome nel messaggio).
export function getChatGlobalUserSheetStyle(): CSSProperties {
  return {
    backgroundColor: chatGlobalStyleModify.userSheetBackgroundColor,
    borderColor: chatGlobalStyleModify.userSheetBorderColor,
    borderWidth: chatGlobalStyleModify.userSheetBorderWidth,
    borderStyle: chatGlobalStyleModify.userSheetBorderStyle,
    borderRadius: chatGlobalStyleModify.userSheetBorderRadius,
    boxShadow: chatGlobalStyleModify.userSheetShadow,
    opacity: chatGlobalStyleModify.userSheetOpacity,
  } as CSSProperties;
}

// Stile card regole chat.
export function getChatGlobalRulesCardStyle(): CSSProperties {
  return {
    backgroundColor: chatGlobalStyleModify.rulesCardBackgroundColor,
    borderColor: chatGlobalStyleModify.rulesCardBorderColor,
    borderWidth: chatGlobalStyleModify.rulesCardBorderWidth,
    borderStyle: chatGlobalStyleModify.rulesCardBorderStyle,
    backgroundImage: chatGlobalStyleModify.rulesCardBackgroundImage,
    opacity: chatGlobalStyleModify.rulesCardOpacity,
  } as CSSProperties;
}

// Stile input messaggio (varia tra write/read-only).
export function getChatGlobalInputStyle(canWrite: boolean): CSSProperties {
  return {
    backgroundColor: canWrite
      ? chatGlobalStyleModify.inputBackgroundColor
      : chatGlobalStyleModify.inputReadOnlyBackgroundColor,
    backgroundImage: chatGlobalStyleModify.inputBackgroundImage,
    opacity: canWrite ? chatGlobalStyleModify.inputCanWriteOpacity : chatGlobalStyleModify.inputReadOnlyOpacity,
  } as CSSProperties;
}

// Stile card errore invio/caricamento.
export function getChatGlobalErrorCardStyle(): CSSProperties {
  return {
    backgroundColor: chatGlobalStyleModify.errorCardBackgroundColor,
    borderColor: chatGlobalStyleModify.errorCardBorderColor,
    borderWidth: chatGlobalStyleModify.errorCardBorderWidth,
    borderStyle: chatGlobalStyleModify.errorCardBorderStyle,
    backgroundImage: chatGlobalStyleModify.errorCardBackgroundImage,
    opacity: chatGlobalStyleModify.errorCardOpacity,
  } as CSSProperties;
}

// Stile bottone Send (solo parte inline, classi in chatGlobalComponentClassModify).
export function getChatGlobalSendButtonStyle(): CSSProperties {
  return {
    backgroundImage: chatGlobalStyleModify.sendButtonBackgroundImage,
    opacity: chatGlobalStyleModify.sendButtonOpacity,
  } as CSSProperties;
}

// Radius del blocco centrale quando la chat e aperta.
export function getChatGlobalCentralBlockOpenTopRightRadius(): string {
  return chatGlobalStyleModify.centralBlockOpenTopRightRadius;
}
