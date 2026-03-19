const MAINTENANCE_ENV_VALUE = "true";

export const MAINTENANCE_PATHNAME = "/maintenance";
export const MAINTENANCE_RETRY_AFTER_SECONDS = 900;

export function isMaintenanceModeEnabled(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    (process.env.MAINTENANCE_MODE ?? "").trim().toLowerCase() === MAINTENANCE_ENV_VALUE
  );
}

export function createMaintenanceHeaders(): Headers {
  const headers = new Headers();
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");
  headers.set("Surrogate-Control", "no-store");
  headers.set("Retry-After", String(MAINTENANCE_RETRY_AFTER_SECONDS));
  headers.set("X-Robots-Tag", "noindex, nofollow, nosnippet, noarchive");
  return headers;
}
