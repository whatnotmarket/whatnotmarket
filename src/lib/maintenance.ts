export const MAINTENANCE_PATHNAME = "/maintenance";
export const MAINTENANCE_RETRY_AFTER_SECONDS = 900;

const MAINTENANCE_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

export function isMaintenanceModeEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}

export function createMaintenanceHeaders(): Headers {
  const headers = new Headers();
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");
  headers.set("Surrogate-Control", "no-store");
  headers.set("Retry-After", String(MAINTENANCE_RETRY_AFTER_SECONDS));
  headers.set("X-Robots-Tag", "noindex, nofollow, nosnippet, noarchive");
  headers.set("Content-Security-Policy", MAINTENANCE_CONTENT_SECURITY_POLICY);
  return headers;
}
