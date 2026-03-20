export const JOB_LOADERS = {
  "admin/expire-timebound-records": () => import("./admin/expire-timebound-records"),
  "auth/cleanup-expired-internal-sessions": () => import("./auth/cleanup-expired-internal-sessions"),
  "chat/cleanup-expired-moderation-controls": () => import("./chat/cleanup-expired-moderation-controls"),
  "maintenance/retry-early-access-emails": () => import("./maintenance/retry-early-access-emails"),
  "ops/monthly-platform-report": () => import("./ops/monthly-platform-report"),
  "seo/weekly-internal-link-audit": () => import("./seo/weekly-internal-link-audit"),
  "security/daily-signals-digest": () => import("./security/daily-signals-digest"),
  "security/sensitive-access-telegram-alerts": () => import("./security/sensitive-access-telegram-alerts"),
  "trust/weekly-risk-recalculation": () => import("./trust/weekly-risk-recalculation"),
} as const;

export type RegisteredJobName = keyof typeof JOB_LOADERS;

export const JOB_GROUPS: Record<string, RegisteredJobName[]> = {
  hourly: [
    "auth/cleanup-expired-internal-sessions",
    "chat/cleanup-expired-moderation-controls",
    "maintenance/retry-early-access-emails",
    "security/sensitive-access-telegram-alerts",
  ],
  daily: [
    "admin/expire-timebound-records",
    "security/daily-signals-digest",
  ],
  weekly: [
    "trust/weekly-risk-recalculation",
    "seo/weekly-internal-link-audit",
  ],
  monthly: [
    "ops/monthly-platform-report",
  ],
};
