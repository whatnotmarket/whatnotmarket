import "server-only";
import { SITE_URL } from "@/lib/site-config";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const BING_ENDPOINT = "https://www.bing.com/indexnow";
const BASE_URL = SITE_URL;
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

// URLs to never submit
const EXCLUDED_PREFIXES = [
  "/admin",
  "/api",
  "/auth",
  "/dashboard",
  "/install",
  "/onboarding",
  "/profile", // Usually private or requires auth
  "/track",
  "/deals", // Private transactional pages
  "/inbox",
  "/my-deals",
  "/settings",
];

function isPublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== new URL(BASE_URL).hostname) return false;
    
    return !EXCLUDED_PREFIXES.some((prefix) => parsed.pathname.startsWith(prefix));
  } catch {
    return false;
  }
}

export async function submitToIndexNow(paths: string | string[]) {
  if (!INDEXNOW_KEY) {
    console.warn("⚠️ IndexNow key not configured. Skipping submission.");
    return;
  }

  if (process.env.NODE_ENV !== "production" && !process.env.INDEXNOW_DEBUG) {
    console.log("ℹ️ IndexNow submission skipped in non-production environment.");
    return;
  }

  const urlList = Array.isArray(paths) ? paths : [paths];
  const publicUrls = urlList
    .map((path) => (path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`))
    .filter(isPublicUrl);

  if (publicUrls.length === 0) return;

  const payload = {
    host: new URL(BASE_URL).hostname,
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: publicUrls,
  };

  try {
    // Submit to IndexNow (Microsoft/Bing) - they propagate to Yandex/others
    const res = await fetch(BING_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`❌ IndexNow submission failed: ${res.status} ${res.statusText}`);
    } else {
      console.log(`✅ IndexNow submitted ${publicUrls.length} URLs successfully.`);
    }
  } catch (error) {
    console.error("❌ IndexNow submission error:", error);
  }
}
