const DEFAULT_TWICPICS_DOMAIN = "openly.twic.pics";

function getTwicBaseUrl() {
  const configured = (process.env.NEXT_PUBLIC_TWICPICS_DOMAIN ?? "").trim();
  const domain = configured || DEFAULT_TWICPICS_DOMAIN;
  const normalized = domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return `https://${normalized}`;
}

function normalizeSourcePath(sourcePath: string) {
  const trimmed = String(sourcePath || "").trim();
  if (!trimmed) return "";
  // TwicPics path should not start with "/".
  return trimmed.replace(/^\/+/, "");
}

export function toTwicUrl(sourcePath: string, manipulation?: string) {
  const path = normalizeSourcePath(sourcePath);
  if (!path) return "";

  const base = getTwicBaseUrl();
  const cleanManipulation = String(manipulation || "").trim().replace(/^\/+/, "");
  if (!cleanManipulation) {
    return `${base}/${path}`;
  }

  return `${base}/${path}?twic=v1/${cleanManipulation}`;
}

