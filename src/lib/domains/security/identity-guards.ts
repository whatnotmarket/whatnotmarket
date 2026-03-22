const RESERVED_PROFILE_HANDLES = new Set([
  "admin",
  "administrator",
  "support",
  "helpdesk",
  "moderator",
  "mod",
  "staff",
  "security",
  "official",
  "team",
  "openlymarket",
]);

export function normalizeProfileHandle(raw: string) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._-]/g, "");
}

export function isReservedProfileHandle(raw: string) {
  const normalized = normalizeProfileHandle(raw);
  if (!normalized) return false;
  return RESERVED_PROFILE_HANDLES.has(normalized);
}

