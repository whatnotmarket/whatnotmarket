import type { CSSProperties } from "react";

export const centralLayoutConfig = {
  leftSpace: "clamp(90px, 15vw, 122px)",
} as const;

export const centralSurfaceStyle = {
  backgroundColor: "rgba(30, 36, 40, 0.43)",
  boxShadow: "inset 0 2px 0 rgba(255,255,255,0.02)",
  borderTopLeftRadius: "20px",
  borderTopRightRadius: "0px",
  border: "0px solid rgba(255,255,255,0.04)",
  borderBottom: "none",
} as const;

export function getCentralLayoutStyle(): CSSProperties {
  return { ...centralSurfaceStyle } as CSSProperties;
}

export function getCentralLeftSpace(): string {
  return centralLayoutConfig.leftSpace;
}
