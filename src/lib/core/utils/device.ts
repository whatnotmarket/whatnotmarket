export type InstallPlatform =
  | "ios-safari"
  | "ios-other"
  | "android-chrome"
  | "android-browser"
  | "desktop"
  | "unknown-mobile"
  | "unknown";

export type InstallPlatformInfo = {
  platform: InstallPlatform;
  isMobile: boolean;
  needsSafari: boolean;
  needsChrome: boolean;
};

export type DeviceDetectionInput = {
  userAgent?: string;
  vendor?: string;
  platform?: string;
  maxTouchPoints?: number;
};

const IOS_BROWSER_EXCLUSIONS = /crios|fxios|edgios|opios|mercury|duckduckgo/i;
const ANDROID_CHROME_EXCLUSIONS = /edg|opr|opera|samsungbrowser|ucbrowser|firefox|brave/i;

export function detectInstallPlatform(input: DeviceDetectionInput): InstallPlatformInfo {
  const ua = (input.userAgent ?? "").toLowerCase();
  const vendor = (input.vendor ?? "").toLowerCase();
  const navPlatform = (input.platform ?? "").toLowerCase();
  const touchPoints = input.maxTouchPoints ?? 0;

  const isIPhoneIPadIPod = /iphone|ipad|ipod/.test(ua);
  const isIpadOS = navPlatform === "macintel" && touchPoints > 1;
  const isIOS = isIPhoneIPadIPod || isIpadOS;
  const isAndroid = /android/.test(ua);
  const isMobileUA = /mobile|iphone|ipad|ipod|android/.test(ua);

  if (isIOS) {
    const looksLikeSafari = /safari/.test(ua) && !IOS_BROWSER_EXCLUSIONS.test(ua);
    return {
      platform: looksLikeSafari ? "ios-safari" : "ios-other",
      isMobile: true,
      needsSafari: !looksLikeSafari,
      needsChrome: false,
    };
  }

  if (isAndroid) {
    const hasChromeToken = /chrome|chromium/.test(ua) || /google inc/.test(vendor);
    const isChromeLike = hasChromeToken && !ANDROID_CHROME_EXCLUSIONS.test(ua);
    return {
      platform: isChromeLike ? "android-chrome" : "android-browser",
      isMobile: true,
      needsSafari: false,
      needsChrome: !isChromeLike,
    };
  }

  if (!isMobileUA && ua.length > 0) {
    return {
      platform: "desktop",
      isMobile: false,
      needsSafari: false,
      needsChrome: false,
    };
  }

  if (isMobileUA) {
    return {
      platform: "unknown-mobile",
      isMobile: true,
      needsSafari: false,
      needsChrome: false,
    };
  }

  return {
    platform: "unknown",
    isMobile: false,
    needsSafari: false,
    needsChrome: false,
  };
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;

  const mediaStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  const iosStandalone =
    typeof navigator !== "undefined" &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

  return mediaStandalone || iosStandalone;
}
