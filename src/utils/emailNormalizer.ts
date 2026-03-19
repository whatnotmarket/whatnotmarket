export interface NormalizedEmail {
  original: string;
  normalized: string;
  localPart: string;
  domain: string;
  provider: string;
}

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);
const OUTLOOK_DOMAINS = new Set(["outlook.com", "hotmail.com", "live.com", "msn.com"]);
const YAHOO_DOMAINS = new Set(["yahoo.com", "ymail.com", "rocketmail.com"]);
const PROTON_DOMAINS = new Set(["proton.me", "protonmail.com", "pm.me"]);
const ICLOUD_DOMAINS = new Set(["icloud.com", "me.com", "mac.com"]);

function splitEmail(value: string) {
  const cleanEmail = value.toLowerCase().trim();
  const atIndex = cleanEmail.lastIndexOf("@");
  if (atIndex <= 0 || atIndex >= cleanEmail.length - 1) {
    return { cleanEmail, localPart: "", domain: "" };
  }

  return {
    cleanEmail,
    localPart: cleanEmail.slice(0, atIndex),
    domain: cleanEmail.slice(atIndex + 1),
  };
}

function normalizeDomain(domain: string, provider: string) {
  if (provider === "gmail" && domain === "googlemail.com") {
    return "gmail.com";
  }
  return domain;
}

export function getEmailProvider(domain: string): string {
  const domainLower = domain.toLowerCase();

  if (GMAIL_DOMAINS.has(domainLower)) return "gmail";
  if (OUTLOOK_DOMAINS.has(domainLower)) return "outlook";
  if (YAHOO_DOMAINS.has(domainLower)) return "yahoo";
  if (PROTON_DOMAINS.has(domainLower)) return "protonmail";
  if (ICLOUD_DOMAINS.has(domainLower)) return "icloud";

  return "other";
}

export function normalizeEmail(email: string): NormalizedEmail {
  const { cleanEmail, localPart, domain } = splitEmail(email);

  if (!localPart || !domain) {
    return {
      original: cleanEmail,
      normalized: cleanEmail,
      localPart,
      domain,
      provider: "other",
    };
  }

  const provider = getEmailProvider(domain);
  const normalizedDomain = normalizeDomain(domain, provider);
  let normalizedLocal = localPart;

  switch (provider) {
    case "gmail":
      normalizedLocal = localPart
        .replace(/\./g, "")
        .replace(/\+(.*)$/, "");
      break;
    case "outlook":
      normalizedLocal = localPart.replace(/\+(.*)$/, "");
      break;
    case "yahoo":
      normalizedLocal = localPart
        .replace(/\-(.*)$/, "")
        .replace(/\+(.*)$/, "");
      break;
    case "protonmail":
      normalizedLocal = localPart.replace(/\+(.*)$/, "");
      break;
    case "icloud":
      normalizedLocal = localPart.replace(/\+(.*)$/, "");
      break;
    default:
      normalizedLocal = localPart;
  }

  normalizedLocal = normalizedLocal.trim();
  const normalized = `${normalizedLocal}@${normalizedDomain}`;

  return {
    original: cleanEmail,
    normalized,
    localPart: normalizedLocal,
    domain: normalizedDomain,
    provider,
  };
}
