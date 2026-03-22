import type { SileoOptions,SileoPosition } from "sileo";

export type NotificationScope =
  | "global"
  | "auth"
  | "admin"
  | "market"
  | "payments"
  | "profile"
  | "deals";

type NotificationOffset = number | string | Partial<Record<"top" | "right" | "bottom" | "left", number | string>>;

export const notificationScopePosition: Record<NotificationScope, SileoPosition> = {
  global: "top-center",
  auth: "top-center",
  admin: "top-right",
  market: "bottom-center",
  payments: "bottom-right",
  profile: "bottom-left",
  deals: "top-left",
};

export const notificationToasterOffsets: Partial<Record<SileoPosition, NotificationOffset>> = {
  "top-left": { top: 20, left: 20 },
  "top-center": { top: 20 },
  "top-right": { top: 20, right: 20 },
  "bottom-left": { bottom: 20, left: 20 },
  "bottom-center": { bottom: 20 },
  "bottom-right": { bottom: 20, right: 20 },
};

export const notificationScopeDefaults: Record<
  NotificationScope,
  Pick<SileoOptions, "duration" | "roundness" | "fill" | "autopilot">
> = {
  global: {
    duration: 4200,
    roundness: 16,
    fill: "#111827",
    autopilot: { expand: 180, collapse: 3000 },
  },
  auth: {
    duration: 4200,
    roundness: 16,
    fill: "#1d4ed8",
    autopilot: { expand: 180, collapse: 3000 },
  },
  admin: {
    duration: 4400,
    roundness: 16,
    fill: "#334155",
    autopilot: { expand: 180, collapse: 3100 },
  },
  market: {
    duration: 4200,
    roundness: 16,
    fill: "#0f172a",
    autopilot: { expand: 180, collapse: 3000 },
  },
  payments: {
    duration: 5000,
    roundness: 16,
    fill: "#166534",
    autopilot: { expand: 180, collapse: 3600 },
  },
  profile: {
    duration: 4200,
    roundness: 16,
    fill: "#7c3aed",
    autopilot: { expand: 180, collapse: 3000 },
  },
  deals: {
    duration: 4300,
    roundness: 16,
    fill: "#9a3412",
    autopilot: { expand: 180, collapse: 3100 },
  },
};
