import type { CSSProperties } from "react";

type CssVarName = `--${string}`;
type CssVarMap = Partial<Record<CssVarName, string>>;

const searchbarVars = {
  "--cmdk-trigger-bg": "#1e2428aa",
  "--cmdk-trigger-hover-bg": "#1e2428e0",
  "--cmdk-trigger-border-width": "0px",
  "--cmdk-trigger-height": "40px",
  "--cmdk-trigger-radius": "12px",
  "--cmdk-trigger-padding-x": "6px",
  "--cmdk-trigger-padding-y": "4px",
  "--cmdk-leading-gap": "12px",
  "--cmdk-search-icon-size": "20px",
  "--cmdk-placeholder-color": "#838383ff",
  "--cmdk-placeholder-size": "14px",
  "--cmdk-placeholder-weight": "500",
} as const;

const cmdkVars = {
  "--cmdk-shortcut-color": "#838383ff",
  "--cmdk-shortcut-bg": "#7373734c",
  "--cmdk-shortcut-radius": "5px",
  "--cmdk-shortcut-padding-x": "10px",
  "--cmdk-shortcut-padding-y": "7px",
  "--cmdk-shortcut-gap": "5px",
  "--cmdk-shortcut-icon-size": "16px",
  "--cmdk-shortcut-font-size": "14px",
} as const;

const panelVars = {
  "--cmdk-panel-bg": "#1B2025",
  "--cmdk-open-offset": "22px",
  "--cmdk-popup-bg": "var(--cmdk-panel-bg)",
  "--cmdk-popup-border-color": "var(--gc-border)",
  "--cmdk-popup-border-width": "1px",
  "--cmdk-popup-radius": "12px",
  "--cmdk-popup-shadow": "none",
  "--cmdk-group-heading-color": "var(--gc-text-secondary)",
  "--cmdk-input-bg": "var(--cmdk-panel-bg)",
  "--cmdk-input-border-color": "var(--gc-border)",
  "--cmdk-input-border-width": "1px",
  "--cmdk-input-icon-color": "var(--gc-text-secondary)",
  "--cmdk-input-text-color": "var(--gc-text-primary)",
  "--cmdk-input-placeholder-color": "var(--gc-text-tertiary)",
  "--cmdk-item-bg": "transparent",
  "--cmdk-item-selected-bg": "var(--gc-surface)",
  "--cmdk-item-selected-text-color": "var(--gc-text-primary)",
  "--cmdk-item-featured-bg": "var(--gc-surface)",
  "--cmdk-item-featured-border-color": "var(--gc-border)",
  "--cmdk-item-featured-border-width": "1px",
  "--cmdk-item-icon-bg": "#bababa0a",
  "--cmdk-item-icon-border-color": "var(--gc-border)",
  "--cmdk-item-icon-border-width": "0px",
  "--cmdk-item-icon-color": "var(--gc-text-secondary)",
  "--cmdk-item-title-color": "var(--gc-text-primary)",
  "--cmdk-item-description-color": "var(--gc-text-tertiary)",
  "--cmdk-item-action-color": "var(--gc-text-secondary)", 
  "--cmdk-item-hover-bg": "#35383c6c",
  "--cmdk-item-hover-border": "#83838344",
  "--cmdk-item-hover-glow": "rgba(131, 131, 131, 0.24)",
  "--cmdk-footer-bg": "#1b2025d5",
  "--cmdk-footer-border-color": "#1b2025d5",
  "--cmdk-footer-border-width": "0px",
  "--cmdk-footer-primary-color": "var(--gc-text-primary)",
  "--cmdk-footer-secondary-color": "var(--gc-text-primary)",
  "--cmdk-kbd-bg": "var(--gc-surface)",
  "--cmdk-kbd-border-color": "var(--gc-border)",
  "--cmdk-kbd-border-width": "2px",
  "--cmdk-kbd-text-color": "var(--gc-text-secondary)",
  "--gc-surface": "#35383c6c",
  "--gc-border": "#8383832f",
  "--gc-text-primary": "#e2e2e2ff",
  "--gc-text-secondary": "#e2e2e28a",
  "--gc-text-tertiary": "#e2e2e2ff",
} as const;

export const commandSearchTheme = {
  triggerPlaceholder: "Search openly for products, categories, sellers, and more....",
  rightHint: "Ctrl K",
  searchbar: searchbarVars,
  cmdk: cmdkVars,
  panel: panelVars,
  vars: {
    ...searchbarVars,
    ...cmdkVars,
    ...panelVars,
  } as CssVarMap,
} as const;

export function getCommandSearchThemeVars(): CSSProperties {
  return { ...commandSearchTheme.vars } as CSSProperties;
}
