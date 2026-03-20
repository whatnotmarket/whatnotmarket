#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import tls from "node:tls";
import { URL } from "node:url";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { load } from "cheerio";

const SECTION_NAMES = [
  "1. RICOGNIZIONE",
  "2. SECURITY HEADERS",
  "3. SSL/TLS",
  "4. TEST XSS (Cross-Site Scripting)",
  "5. TEST SQL INJECTION",
  "6. TEST CSRF",
  "7. AUTENTICAZIONE E SESSIONI",
  "8. API E NETWORK",
  "9. INFORMATION DISCLOSURE",
  "10. RISORSE ESTERNE",
];

const STATUS = {
  safe: "\u2705 sicuro",
  warn: "\u26a0\ufe0f da migliorare",
  vuln: "\u274c vulnerabile",
};

const DEDUCTION = {
  safe: 0,
  warn: 3,
  vuln: 8,
};

const SEVERITY_RANK = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const resultsBySection = new Map(SECTION_NAMES.map((name) => [name, []]));
const findings = [];

function normalizeTarget(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) return "https://openlymarket.xyz";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

const targetUrl = normalizeTarget(
  process.env.SECURITY_AUDIT_TARGET_URL || process.env.PRODUCTION_BASE_URL || process.argv[2] || "https://openlymarket.xyz"
);
const target = new URL(targetUrl);
const startedAt = new Date();
const runId = randomUUID().slice(0, 8);

function escapeMarkdownCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeSummaryText(value, max = 420) {
  const compact = String(value || "").replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 3)}...`;
}

function normalizeFindingTitle(test) {
  const value = String(test || "").trim();
  if (value.startsWith("Payload XSS:")) return "XSS input sanitization";
  if (value.startsWith("Payload SQLi:")) return "SQL injection hardening";
  if (/POST cross-origin|CORS permissivo/i.test(value)) return "CORS and CSRF hardening";
  if (/Cookie flags SameSite\/Secure\/HttpOnly/i.test(value)) return "Session cookie hardening";
  return value;
}

function statusEmoji(level) {
  if (level === "vuln") return "\u{1F534}";
  if (level === "warn") return "\u{1F7E0}";
  return "\u{1F7E2}";
}

function toStatusLabel(level) {
  return STATUS[level] || STATUS.warn;
}

function addResult(section, test, status, details, fix, severity = "medium") {
  const entry = {
    test,
    status,
    details: `${sanitizeSummaryText(details, 900)} Fix consigliato: ${sanitizeSummaryText(fix, 450)}`,
    severity,
  };

  const sectionRows = resultsBySection.get(section);
  if (sectionRows) sectionRows.push(entry);

  if (status !== "safe") {
    findings.push({ section, test, status, details, fix, severity });
  }
}

function headerMapFromResponse(response) {
  const map = new Map();
  for (const [k, v] of response.headers.entries()) map.set(k.toLowerCase(), v);
  return map;
}

async function httpRequest(url, options = {}) {
  const started = performance.now();
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      redirect: options.redirect || "follow",
      headers: options.headers || {},
      body: options.body,
      signal: controller.signal,
    });

    const text = options.skipText ? "" : await response.text();
    const headers = headerMapFromResponse(response);
    const setCookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : response.headers.get("set-cookie")
          ? [response.headers.get("set-cookie")]
          : [];

    return {
      ok: response.ok,
      status: response.status,
      url: response.url,
      headers,
      setCookies,
      text,
      durationMs: Math.round(performance.now() - started),
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url: String(url),
      headers: new Map(),
      setCookies: [],
      text: "",
      durationMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isSameOrigin(urlLike) {
  try {
    const url = new URL(urlLike, target.href);
    return url.origin === target.origin;
  } catch {
    return false;
  }
}

function collectInternalLinks(pageUrl, html) {
  const $ = load(html);
  const links = new Set();

  $("a[href]").each((_, el) => {
    const href = String($(el).attr("href") || "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;
    try {
      const resolved = new URL(href, pageUrl);
      if (resolved.origin !== target.origin) return;
      links.add(`${resolved.origin}${resolved.pathname}`);
    } catch {
      // ignore invalid href
    }
  });

  return Array.from(links);
}

function collectExternalResources(html, pageUrl) {
  const $ = load(html);
  const resources = [];
  const selectors = ["script[src]", "link[href]", "img[src]", "iframe[src]", "source[src]"];

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const attr = selector.includes("href") ? "href" : "src";
      const value = String($(el).attr(attr) || "").trim();
      if (!value) return;
      try {
        const resolved = new URL(value, pageUrl);
        if (resolved.origin !== target.origin) {
          resources.push({
            tag: selector.split("[")[0],
            url: resolved.toString(),
            integrity: String($(el).attr("integrity") || ""),
          });
        }
      } catch {
        // ignore
      }
    });
  }

  return resources;
}

function extractApiCandidates(text) {
  const endpoints = new Set();
  const patterns = [
    /["'`](\/api\/[a-zA-Z0-9/_\-?.=&%]+)["'`]/g,
    /https?:\/\/[^"'`\s]+\/api\/[a-zA-Z0-9/_\-?.=&%]*/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = match[1] || match[0];
      try {
        const resolved = new URL(value, target.href);
        if (resolved.origin === target.origin) {
          endpoints.add(`${resolved.origin}${resolved.pathname}`);
        }
      } catch {
        // ignore
      }
    }
  }

  return Array.from(endpoints);
}

function parseSetCookieFlags(setCookie) {
  const parts = String(setCookie).split(";").map((part) => part.trim());
  const [namePart, ...attrs] = parts;
  const cookieName = String(namePart || "").split("=")[0] || "";
  const lowerAttrs = attrs.map((item) => item.toLowerCase());

  return {
    name: cookieName,
    secure: lowerAttrs.some((item) => item === "secure"),
    httpOnly: lowerAttrs.some((item) => item === "httponly"),
    sameSite: lowerAttrs.find((item) => item.startsWith("samesite=")) || "",
  };
}

async function getTlsInfo(hostname, port = 443) {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: hostname,
      port,
      servername: hostname,
      rejectUnauthorized: true,
      minVersion: "TLSv1",
    });

    const timer = setTimeout(() => {
      socket.destroy();
      resolve({ protocol: "unknown", error: "timeout" });
    }, 10000);

    socket.once("secureConnect", () => {
      clearTimeout(timer);
      const protocol = socket.getProtocol() || "unknown";
      socket.end();
      resolve({ protocol, error: null });
    });

    socket.once("error", (error) => {
      clearTimeout(timer);
      resolve({ protocol: "unknown", error: error.message });
    });
  });
}

async function supportsDeprecatedTls(hostname, version) {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: false,
      minVersion: version,
      maxVersion: version,
    });

    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 7000);

    socket.once("secureConnect", () => {
      clearTimeout(timer);
      socket.end();
      resolve(true);
    });

    socket.once("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

function detectSensitivePatterns(text) {
  const patterns = [
    /sk_live_[0-9a-zA-Z]{16,}/g,
    /AIza[0-9A-Za-z\-_]{35}/g,
    /ghp_[A-Za-z0-9]{36}/g,
    /xox[baprs]-[A-Za-z0-9-]{10,}/g,
    /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]{10,}/g,
  ];

  const hits = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      hits.push(String(match[0]).slice(0, 28));
    }
  }

  return hits.slice(0, 20);
}

async function main() {
  const homepage = await httpRequest(target.href);
  if (homepage.error) {
    throw new Error(`Unable to reach target ${target.href}: ${homepage.error}`);
  }

  const homeHeaders = homepage.headers;
  const pageSnapshots = [];
  const crawlQueue = [target.href];
  const visited = new Set();

  while (crawlQueue.length > 0 && pageSnapshots.length < 6) {
    const nextUrl = crawlQueue.shift();
    if (!nextUrl || visited.has(nextUrl)) continue;
    visited.add(nextUrl);

    const response = await httpRequest(nextUrl);
    if (response.error) continue;

    const contentType = String(response.headers.get("content-type") || "");
    if (!contentType.includes("text/html")) continue;

    pageSnapshots.push({
      url: nextUrl,
      html: response.text,
      headers: response.headers,
      setCookies: response.setCookies,
    });

    const links = collectInternalLinks(nextUrl, response.text);
    for (const link of links.slice(0, 12)) {
      if (!visited.has(link) && crawlQueue.length < 20) {
        crawlQueue.push(link);
      }
    }
  }

  const allHtml = pageSnapshots.map((snapshot) => snapshot.html).join("\n");
  const allSetCookies = pageSnapshots.flatMap((snapshot) => snapshot.setCookies || []);

  const scriptSources = new Set();
  for (const snapshot of pageSnapshots) {
    const $ = load(snapshot.html);
    $("script[src]").each((_, el) => {
      const src = String($(el).attr("src") || "").trim();
      if (!src) return;
      try {
        const resolved = new URL(src, snapshot.url);
        scriptSources.add(resolved.toString());
      } catch {
        // ignore invalid url
      }
    });
  }

  const sameOriginScripts = Array.from(scriptSources).filter((url) => isSameOrigin(url)).slice(0, 10);
  const jsPayloads = [];
  for (const scriptUrl of sameOriginScripts) {
    const scriptResponse = await httpRequest(scriptUrl, { timeoutMs: 12000 });
    if (!scriptResponse.error && scriptResponse.ok && scriptResponse.text) {
      jsPayloads.push({ url: scriptUrl, text: scriptResponse.text });
    }
  }

  const mergedJsText = jsPayloads.map((item) => item.text).join("\n");

  // 1. RICOGNIZIONE
  const frameworkHints = [];
  if (homepage.text.includes("/_next/") || homepage.text.includes("__NEXT_DATA__")) frameworkHints.push("Next.js");
  if (homeHeaders.get("x-vercel-id")) frameworkHints.push("Vercel");
  if (homeHeaders.get("cf-ray")) frameworkHints.push("Cloudflare");
  if (homeHeaders.get("server")) frameworkHints.push(`Server:${homeHeaders.get("server")}`);

  addResult(
    "1. RICOGNIZIONE",
    "Identificazione tech stack",
    frameworkHints.length > 0 ? "safe" : "warn",
    frameworkHints.length > 0 ? `Tecnologie rilevate: ${frameworkHints.join(", ")}.` : "Stack non identificabile in modo affidabile dai marker pubblici.",
    "Mantieni aggiornate framework e librerie e riduci fingerprinting non necessario.",
    "low"
  );

  const exposedPaths = [
    "/.env",
    "/.git/HEAD",
    "/wp-admin",
    "/api",
    "/.well-known/security.txt",
    "/robots.txt",
    "/sitemap.xml",
    "/package.json",
    "/.DS_Store",
  ];

  const exposedFindings = [];
  for (const path of exposedPaths) {
    const probe = await httpRequest(new URL(path, target.href).toString(), { redirect: "manual", timeoutMs: 10000 });
    exposedFindings.push({ path, status: probe.status, redirectedTo: probe.headers.get("location") || "" });
  }

  const criticalExposed = exposedFindings.filter((item) => ["/.env", "/.git/HEAD", "/.DS_Store"].includes(item.path) && item.status === 200);
  addResult(
    "1. RICOGNIZIONE",
    "Ricerca file/path esposti",
    criticalExposed.length > 0 ? "vuln" : "safe",
    `Probe eseguite: ${exposedFindings.map((item) => `${item.path}:${item.status}`).join(", ")}.`,
    "Blocca accesso a file sensibili lato web server e verifica artifact di deploy.",
    criticalExposed.length > 0 ? "critical" : "low"
  );

  const robotsProbe = exposedFindings.find((item) => item.path === "/robots.txt");
  let robotsContent = "";
  if (robotsProbe && robotsProbe.status === 200) {
    const robotsResponse = await httpRequest(new URL("/robots.txt", target.href).toString(), { timeoutMs: 8000 });
    robotsContent = robotsResponse.text || "";
  }

  const sensitiveRobots = Array.from(robotsContent.matchAll(/^\s*Disallow:\s*(.+)$/gim))
    .map((m) => String(m[1]).trim())
    .filter((line) => /admin|private|internal|backup|staging|secret/i.test(line));

  addResult(
    "1. RICOGNIZIONE",
    "Analisi robots.txt",
    robotsContent ? (sensitiveRobots.length > 0 ? "warn" : "safe") : "warn",
    robotsContent
      ? `robots.txt presente. Disallow sensibili: ${sensitiveRobots.length > 0 ? sensitiveRobots.join(", ") : "nessuno rilevato"}.`
      : "robots.txt non raggiungibile o assente.",
    "Evita di elencare path realmente sensibili in robots.txt; usa controllo accessi server-side.",
    sensitiveRobots.length > 0 ? "medium" : "low"
  );

  const sourceMapHits = [];
  for (const scriptUrl of sameOriginScripts.slice(0, 8)) {
    const mapUrl = `${scriptUrl}.map`;
    const probe = await httpRequest(mapUrl, { timeoutMs: 6000, redirect: "manual" });
    if (probe.status === 200 && probe.text.length > 0) {
      sourceMapHits.push(mapUrl);
    }
  }

  addResult(
    "1. RICOGNIZIONE",
    "Source map esposte (.js.map)",
    sourceMapHits.length > 0 ? "warn" : "safe",
    sourceMapHits.length > 0 ? `Source map accessibili: ${sourceMapHits.slice(0, 4).join(", ")}` : "Nessuna source map pubblica rilevata sui bundle testati.",
    "Disabilita upload/deploy delle source map pubbliche o pubblicale solo con accesso autenticato.",
    sourceMapHits.length > 0 ? "high" : "low"
  );

  const htmlComments = Array.from(allHtml.matchAll(/<!--([\s\S]*?)-->/g)).map((m) => String(m[1]).trim());
  const sensitiveComments = htmlComments.filter((comment) => /token|secret|password|api[_-]?key|internal|staging|todo/i.test(comment));

  addResult(
    "1. RICOGNIZIONE",
    "Commenti HTML sensibili",
    sensitiveComments.length > 0 ? "warn" : "safe",
    sensitiveComments.length > 0 ? `Commenti sospetti: ${sensitiveComments.slice(0, 2).join(" | ")}` : `Commenti analizzati: ${htmlComments.length}. Nessun marker sensibile rilevato.`,
    "Rimuovi commenti con dettagli operativi/tecnici sensibili dal markup di produzione.",
    sensitiveComments.length > 0 ? "medium" : "low"
  );

  // 2. SECURITY HEADERS
  const headerChecks = [
    {
      name: "Content-Security-Policy",
      header: "content-security-policy",
      severity: "critical",
      evaluate: (value) => {
        if (!value) return { status: "vuln", details: "Header assente." };
        if (value.includes("'unsafe-inline'") || value.includes("'unsafe-eval'")) {
          return { status: "warn", details: `Header presente ma permissivo: ${value}` };
        }
        return { status: "safe", details: "Header presente con policy non permissiva." };
      },
      fix: "Imposta CSP strict con nonce/hash e senza unsafe-inline/unsafe-eval.",
    },
    {
      name: "X-Frame-Options",
      header: "x-frame-options",
      severity: "high",
      evaluate: (value) => (!value ? { status: "warn", details: "Header assente." } : { status: "safe", details: `Valore: ${value}` }),
      fix: "Imposta X-Frame-Options: DENY (o SAMEORIGIN se necessario).",
    },
    {
      name: "X-Content-Type-Options",
      header: "x-content-type-options",
      severity: "high",
      evaluate: (value) => (String(value).toLowerCase() === "nosniff" ? { status: "safe", details: "Valore corretto: nosniff." } : { status: "warn", details: `Valore assente/non corretto: ${value || "missing"}` }),
      fix: "Imposta X-Content-Type-Options: nosniff.",
    },
    {
      name: "Strict-Transport-Security",
      header: "strict-transport-security",
      severity: "high",
      evaluate: (value) => {
        if (!value) return { status: "warn", details: "Header assente." };
        const maxAgeMatch = value.match(/max-age=(\d+)/i);
        const maxAge = maxAgeMatch ? Number(maxAgeMatch[1]) : 0;
        if (maxAge < 31536000 || !/includesubdomains/i.test(value) || !/preload/i.test(value)) {
          return { status: "warn", details: `Configurazione migliorabile: ${value}` };
        }
        return { status: "safe", details: `Configurazione robusta: ${value}` };
      },
      fix: "Imposta Strict-Transport-Security: max-age=31536000; includeSubDomains; preload.",
    },
    {
      name: "Referrer-Policy",
      header: "referrer-policy",
      severity: "medium",
      evaluate: (value) => (!value ? { status: "warn", details: "Header assente." } : { status: "safe", details: `Valore: ${value}` }),
      fix: "Usa Referrer-Policy: strict-origin-when-cross-origin.",
    },
    {
      name: "Permissions-Policy",
      header: "permissions-policy",
      severity: "medium",
      evaluate: (value) => (!value ? { status: "warn", details: "Header assente." } : { status: "safe", details: `Valore: ${value}` }),
      fix: "Definisci Permissions-Policy minimizzando feature browser non necessarie.",
    },
    {
      name: "X-XSS-Protection",
      header: "x-xss-protection",
      severity: "low",
      evaluate: (value) => (!value ? { status: "warn", details: "Header assente (legacy)." } : { status: "safe", details: `Valore: ${value}` }),
      fix: "Per compatibilita legacy puoi impostare X-XSS-Protection: 1; mode=block.",
    },
    {
      name: "Cross-Origin-Opener-Policy",
      header: "cross-origin-opener-policy",
      severity: "medium",
      evaluate: (value) => (!value ? { status: "warn", details: "Header assente." } : { status: "safe", details: `Valore: ${value}` }),
      fix: "Imposta Cross-Origin-Opener-Policy: same-origin dove possibile.",
    },
    {
      name: "Cross-Origin-Resource-Policy",
      header: "cross-origin-resource-policy",
      severity: "medium",
      evaluate: (value) => (!value ? { status: "warn", details: "Header assente." } : { status: "safe", details: `Valore: ${value}` }),
      fix: "Imposta Cross-Origin-Resource-Policy: same-site o same-origin per risorse sensibili.",
    },
  ];

  for (const check of headerChecks) {
    const value = homeHeaders.get(check.header) || "";
    const outcome = check.evaluate(value);
    addResult("2. SECURITY HEADERS", check.name, outcome.status, outcome.details, check.fix, check.severity);
  }

  // 3. SSL/TLS
  const httpTarget = new URL(target.href);
  httpTarget.protocol = "http:";
  const httpProbe = await httpRequest(httpTarget.toString(), { redirect: "manual", timeoutMs: 10000 });
  const redirectLocation = httpProbe.headers.get("location") || "";

  addResult(
    "3. SSL/TLS",
    "Redirect HTTP -> HTTPS",
    [301, 302, 307, 308].includes(httpProbe.status) && /^https:\/\//i.test(redirectLocation) ? "safe" : "warn",
    `Risposta HTTP: ${httpProbe.status}. Location: ${redirectLocation || "n/a"}.`,
    "Forza redirect 301 da HTTP a HTTPS su tutte le route.",
    "high"
  );

  const tlsInfo = await getTlsInfo(target.hostname);
  const supportsTls10 = await supportsDeprecatedTls(target.hostname, "TLSv1");
  const supportsTls11 = await supportsDeprecatedTls(target.hostname, "TLSv1.1");

  addResult(
    "3. SSL/TLS",
    "Versione TLS",
    supportsTls10 || supportsTls11 ? "vuln" : tlsInfo.protocol === "unknown" ? "warn" : "safe",
    `Protocollo negoziato: ${tlsInfo.protocol}. Supporto TLS1.0: ${supportsTls10}. Supporto TLS1.1: ${supportsTls11}.`,
    "Disabilita TLS 1.0/1.1 e consenti solo TLS 1.2+ (preferibilmente TLS 1.3).",
    supportsTls10 || supportsTls11 ? "critical" : "high"
  );

  const mixedContentMatches = Array.from(allHtml.matchAll(/(?:src|href|action)\s*=\s*["'](http:\/\/[^"']+)["']/gi)).map((m) => m[1]);
  addResult(
    "3. SSL/TLS",
    "Mixed content su pagine HTTPS",
    mixedContentMatches.length > 0 ? "warn" : "safe",
    mixedContentMatches.length > 0 ? `Rilevate risorse HTTP: ${mixedContentMatches.slice(0, 5).join(", ")}` : "Nessuna risorsa HTTP rilevata nelle pagine analizzate.",
    "Servi tutte le risorse su HTTPS e abilita upgrade-insecure-requests in CSP.",
    mixedContentMatches.length > 0 ? "high" : "low"
  );

  // Inventory form
  const formInventory = [];
  for (const snapshot of pageSnapshots) {
    const $ = load(snapshot.html);
    $("form").each((_, formEl) => {
      const method = String($(formEl).attr("method") || "get").toLowerCase();
      const actionRaw = String($(formEl).attr("action") || snapshot.url);
      let actionUrl;
      try {
        actionUrl = new URL(actionRaw, snapshot.url).toString();
      } catch {
        actionUrl = snapshot.url;
      }

      const inputs = [];
      $(formEl)
        .find("input[name], textarea[name], select[name]")
        .each((__, inputEl) => {
          const name = String($(inputEl).attr("name") || "").trim();
          const type = String($(inputEl).attr("type") || "text").toLowerCase();
          if (!name) return;
          if (["hidden", "submit", "button", "image", "reset", "checkbox", "radio", "file"].includes(type)) return;
          inputs.push(name);
        });

      const hiddenFields = [];
      $(formEl)
        .find("input[type='hidden'][name]")
        .each((__, hiddenEl) => {
          hiddenFields.push(String($(hiddenEl).attr("name") || "").trim());
        });

      formInventory.push({ pageUrl: snapshot.url, method, actionUrl, inputs, hiddenFields });
    });
  }

  const getTargets = formInventory
    .filter((form) => form.method === "get" && form.inputs.length > 0 && isSameOrigin(form.actionUrl))
    .map((form) => ({ url: form.actionUrl, param: form.inputs[0] }));

  if (getTargets.length === 0) {
    getTargets.push({ url: target.href, param: "q" });
  }

  // 4. TEST XSS
  const xssPayloads = [
    "<script>alert('xss')</script>",
    '"><img src=x onerror=alert("xss")>',
    "javascript:alert('xss')",
    "{{7*7}}",
    "${7*7}",
  ];

  for (const payload of xssPayloads) {
    let rawReflections = 0;
    let escapedReflections = 0;
    let tested = 0;

    for (const targetForm of getTargets.slice(0, 6)) {
      const probeUrl = new URL(targetForm.url);
      probeUrl.searchParams.set(targetForm.param, payload);
      const response = await httpRequest(probeUrl.toString(), { timeoutMs: 12000 });
      if (response.error) continue;

      tested += 1;
      if (response.text.includes(payload)) {
        rawReflections += 1;
      } else if (response.text.includes(escapeHtml(payload)) || response.text.includes(encodeURIComponent(payload))) {
        escapedReflections += 1;
      }
    }

    addResult(
      "4. TEST XSS (Cross-Site Scripting)",
      `Payload XSS: ${payload}`,
      rawReflections > 0 ? "vuln" : tested === 0 ? "warn" : escapedReflections > 0 ? "safe" : "warn",
      `Endpoint testati: ${tested}. Reflection raw: ${rawReflections}. Reflection escaped: ${escapedReflections}. Nota: test non-distruttivo, nessuna esecuzione forzata JS.`,
      "Sanitizza input lato server, escape output contestuale (HTML/attribute/JS), valida schemi URL e rafforza CSP.",
      rawReflections > 0 ? "critical" : "high"
    );
  }

  // 5. TEST SQL INJECTION (solo non distruttivi)
  const sqlPayloads = [
    "' OR '1'='1",
    '" OR ""="',
    "1; WAITFOR DELAY '0:0:5'",
  ];

  const baselineTarget = getTargets[0];
  let baselineDuration = 0;
  if (baselineTarget) {
    const baselineUrl = new URL(baselineTarget.url);
    baselineUrl.searchParams.set(baselineTarget.param, "audit-baseline");
    const baselineRes = await httpRequest(baselineUrl.toString(), { timeoutMs: 12000 });
    baselineDuration = baselineRes.durationMs;
  }

  for (const payload of sqlPayloads) {
    let sqlErrors = 0;
    let timeAnomalies = 0;
    let tested = 0;

    for (const targetForm of getTargets.slice(0, 4)) {
      const probeUrl = new URL(targetForm.url);
      probeUrl.searchParams.set(targetForm.param, payload);
      const response = await httpRequest(probeUrl.toString(), { timeoutMs: 18000 });
      if (response.error) continue;
      tested += 1;

      if (/sql|syntax error|database error|odbc|postgres|mysql|sqlite|exception/i.test(response.text)) {
        sqlErrors += 1;
      }
      if (payload.includes("WAITFOR") && baselineDuration > 0 && response.durationMs - baselineDuration >= 4500) {
        timeAnomalies += 1;
      }
    }

    addResult(
      "5. TEST SQL INJECTION",
      `Payload SQLi: ${payload}`,
      sqlErrors > 0 || timeAnomalies > 0 ? "vuln" : tested === 0 ? "warn" : "safe",
      `Endpoint testati: ${tested}. Errori SQL rilevati: ${sqlErrors}. Anomalie timing: ${timeAnomalies}.`,
      "Usa query parametrizzate/prepared statements, valida input e normalizza error handling senza leak DB details.",
      sqlErrors > 0 || timeAnomalies > 0 ? "critical" : "high"
    );
  }

  addResult(
    "5. TEST SQL INJECTION",
    "Payload distruttivo `'; DROP TABLE users; --`",
    "warn",
    "NON eseguito per regole di ingaggio (test non distruttivo). Il payload potrebbe compromettere dati reali.",
    "Esegui solo in ambiente staging isolato con dati sintetici e backup ripristinabili.",
    "medium"
  );

  // 6. TEST CSRF
  const postForms = formInventory.filter((form) => form.method === "post");
  const postFormsMissingToken = postForms.filter((form) =>
    !form.hiddenFields.some((field) => /csrf|xsrf|token|authenticity|_token/i.test(field))
  );

  addResult(
    "6. TEST CSRF",
    "Token CSRF sui form",
    postForms.length === 0 ? "warn" : postFormsMissingToken.length > 0 ? "warn" : "safe",
    postForms.length === 0
      ? "Nessun form POST rilevato nelle pagine pubbliche analizzate (verifica manuale necessaria su aree autenticate)."
      : `Form POST analizzati: ${postForms.length}. Form senza token rilevabile: ${postFormsMissingToken.length}.`,
    "Aggiungi token CSRF per tutte le mutazioni stato e valida origin/referer lato server.",
    postFormsMissingToken.length > 0 ? "high" : "medium"
  );

  const apiCandidates = new Set(extractApiCandidates(allHtml + "\n" + mergedJsText));
  const corsPermissive = [];
  for (const endpoint of Array.from(apiCandidates).slice(0, 12)) {
    const corsProbe = await httpRequest(endpoint, {
      method: "OPTIONS",
      headers: {
        Origin: "https://evil.example",
        "Access-Control-Request-Method": "POST",
      },
      timeoutMs: 9000,
    });

    const acao = corsProbe.headers.get("access-control-allow-origin") || "";
    if (acao === "*" || acao === "https://evil.example") {
      corsPermissive.push(endpoint);
    }
  }

  addResult(
    "6. TEST CSRF",
    "POST cross-origin / CORS permissivo",
    corsPermissive.length > 0 ? "vuln" : "safe",
    corsPermissive.length > 0 ? `Endpoint con ACAO permissivo: ${corsPermissive.slice(0, 5).join(", ")}` : "Nessun endpoint testato ha accettato origin arbitrari per preflight POST.",
    "Limita Access-Control-Allow-Origin ai soli domini trusted e non usare wildcard su endpoint autenticati.",
    corsPermissive.length > 0 ? "critical" : "medium"
  );

  const sessionLikeCookies = allSetCookies
    .map(parseSetCookieFlags)
    .filter((cookie) => /session|auth|token|sid|jwt/i.test(cookie.name));
  const cookieWeak = sessionLikeCookies.filter((cookie) => !cookie.secure || !cookie.httpOnly || !cookie.sameSite);

  addResult(
    "6. TEST CSRF",
    "Cookie flags SameSite/Secure/HttpOnly",
    sessionLikeCookies.length === 0 ? "warn" : cookieWeak.length > 0 ? "warn" : "safe",
    sessionLikeCookies.length === 0
      ? "Nessun cookie di sessione individuato nelle risposte pubbliche analizzate."
      : `Cookie sessione analizzati: ${sessionLikeCookies.length}. Cookie con flag mancanti: ${cookieWeak.length}.`,
    "Imposta sempre Secure, HttpOnly, SameSite=Lax o Strict sui cookie di sessione.",
    cookieWeak.length > 0 ? "high" : "medium"
  );

  // 7. AUTH E SESSIONI
  const authPaths = ["/admin", "/dashboard", "/login", "/wp-login.php", "/admin/login", "/auth"];
  const authPathResults = [];

  for (const path of authPaths) {
    const probe = await httpRequest(new URL(path, target.href).toString(), { redirect: "manual", timeoutMs: 9000 });
    authPathResults.push({ path, status: probe.status, body: probe.text.slice(0, 500) });
  }

  const suspiciousOpenAdmin = authPathResults.filter(
    (entry) => ["/admin", "/dashboard"].includes(entry.path) && entry.status === 200 && !/login|password|sign in|accedi/i.test(entry.body)
  );

  addResult(
    "7. AUTENTICAZIONE E SESSIONI",
    "Pagine admin/login esposte",
    suspiciousOpenAdmin.length > 0 ? "vuln" : "safe",
    `Probe: ${authPathResults.map((entry) => `${entry.path}:${entry.status}`).join(", ")}.`,
    "Proteggi /admin e /dashboard con auth robusta + controllo ruolo server-side prima del rendering.",
    suspiciousOpenAdmin.length > 0 ? "critical" : "medium"
  );

  const brutePath = authPathResults.find((entry) => entry.path === "/admin/login" || entry.path === "/login");
  if (brutePath) {
    const rateProbeHeaders = [];
    for (let i = 0; i < 8; i += 1) {
      const probe = await httpRequest(new URL(brutePath.path, target.href).toString(), { timeoutMs: 7000 });
      rateProbeHeaders.push(probe.headers.get("x-ratelimit-limit") || probe.headers.get("ratelimit-limit") || "");
      if (probe.status === 429) break;
    }

    const hasRateSignals = rateProbeHeaders.some((header) => header);
    addResult(
      "7. AUTENTICAZIONE E SESSIONI",
      "Protezione brute force (check non distruttivo)",
      hasRateSignals ? "safe" : "warn",
      hasRateSignals ? "Header rate limit presenti durante richieste ripetute." : "Nessun segnale di rate-limit individuato con richieste GET ripetute (inconclusivo su POST auth).",
      "Applica rate limit + lockout progressivo su endpoint login e MFA su account privilegiati.",
      "high"
    );
  } else {
    addResult(
      "7. AUTENTICAZIONE E SESSIONI",
      "Protezione brute force (check non distruttivo)",
      "warn",
      "Endpoint login non identificato in modo certo nelle pagine analizzate.",
      "Verifica manualmente endpoint auth reali e applica throttling/ip reputation.",
      "high"
    );
  }

  addResult(
    "7. AUTENTICAZIONE E SESSIONI",
    "Scadenza sessioni",
    "warn",
    "Non verificabile in modo affidabile senza account di test e sessione reale prolungata (test volutamente non distruttivo).",
    "Aggiungi test e2e autenticati su TTL sessione, refresh token e invalidazione logout.",
    "medium"
  );

  // 8. API E NETWORK
  const apiList = Array.from(apiCandidates);
  addResult(
    "8. API E NETWORK",
    "Mappatura chiamate API",
    apiList.length > 0 ? "safe" : "warn",
    apiList.length > 0 ? `Endpoint API individuati: ${apiList.length}. Esempi: ${apiList.slice(0, 8).join(", ")}` : "Nessun endpoint API identificato dal markup/script pubblico analizzato.",
    "Mantieni inventory API aggiornata e segmenta endpoint pubblici vs autenticati.",
    "low"
  );

  let sensitiveApiLeaks = 0;
  const apiProbeDetails = [];
  for (const endpoint of apiList.slice(0, 10)) {
    const response = await httpRequest(endpoint, { timeoutMs: 10000 });
    if (response.error) continue;

    const textSample = response.text.slice(0, 3000);
    const leak = /password|secret|private[_-]?key|access[_-]?token|refresh[_-]?token/i.test(textSample);
    if (response.status === 200 && leak) {
      sensitiveApiLeaks += 1;
      apiProbeDetails.push(`${endpoint}:potential-sensitive`);
    } else {
      apiProbeDetails.push(`${endpoint}:${response.status}`);
    }
  }

  addResult(
    "8. API E NETWORK",
    "Dati sensibili nelle risposte API",
    sensitiveApiLeaks > 0 ? "vuln" : "safe",
    apiProbeDetails.length > 0 ? `Risultati API: ${apiProbeDetails.slice(0, 8).join(", ")}` : "Nessuna risposta API utile da analizzare in modalita anonima.",
    "Riduci campi restituiti (principio del minimo privilegio) e filtra sempre dati sensibili lato server.",
    sensitiveApiLeaks > 0 ? "critical" : "high"
  );

  const corsHeadersFound = [];
  for (const endpoint of apiList.slice(0, 8)) {
    const response = await httpRequest(endpoint, { timeoutMs: 8000 });
    const acao = response.headers.get("access-control-allow-origin");
    if (acao) corsHeadersFound.push(`${new URL(endpoint).pathname}:${acao}`);
  }

  addResult(
    "8. API E NETWORK",
    "Configurazione CORS API",
    corsHeadersFound.some((item) => item.endsWith(":*")) ? "warn" : "safe",
    corsHeadersFound.length > 0 ? `Header CORS osservati: ${corsHeadersFound.slice(0, 6).join(", ")}` : "Nessun header CORS esplicito osservato negli endpoint testati.",
    "Configura CORS per origin espliciti trusted; evita wildcard con credenziali.",
    corsHeadersFound.some((item) => item.endsWith(":*")) ? "high" : "medium"
  );

  const jsSecretHits = detectSensitivePatterns(mergedJsText);
  addResult(
    "8. API E NETWORK",
    "API key/JWT hardcoded in richieste/script",
    jsSecretHits.length > 0 ? "vuln" : "safe",
    jsSecretHits.length > 0 ? `Pattern sensibili rilevati nei JS pubblici: ${jsSecretHits.slice(0, 6).join(", ")}` : "Nessun pattern evidente di chiavi/token hardcoded nei JS analizzati.",
    "Rimuovi segreti dal client bundle, ruota chiavi esposte e usa secret manager lato server.",
    jsSecretHits.length > 0 ? "critical" : "high"
  );

  const rateLimitTarget = apiList[0];
  if (rateLimitTarget) {
    const rateStatuses = [];
    for (let i = 0; i < 12; i += 1) {
      const probe = await httpRequest(rateLimitTarget, { timeoutMs: 7000 });
      rateStatuses.push(probe.status);
      if (probe.status === 429) break;
    }

    addResult(
      "8. API E NETWORK",
      "Rate limiting API pubbliche",
      rateStatuses.includes(429) ? "safe" : "warn",
      `Endpoint testato: ${new URL(rateLimitTarget).pathname}. Status osservati: ${rateStatuses.join(", ")}.`,
      "Implementa throttling per IP/sessione e risposte 429 con Retry-After su endpoint pubblici.",
      "high"
    );
  } else {
    addResult(
      "8. API E NETWORK",
      "Rate limiting API pubbliche",
      "warn",
      "Impossibile identificare endpoint API GET pubblici da testare in modo anonimo.",
      "Esegui verifica manuale su endpoint reali in staging con traffic simulation controllata.",
      "medium"
    );
  }

  // 9. INFORMATION DISCLOSURE
  addResult(
    "9. INFORMATION DISCLOSURE",
    "Header Server / X-Powered-By",
    homeHeaders.get("server") || homeHeaders.get("x-powered-by") ? "warn" : "safe",
    `Server: ${homeHeaders.get("server") || "n/a"}, X-Powered-By: ${homeHeaders.get("x-powered-by") || "n/a"}.`,
    "Rimuovi/maschera header identificativi non necessari a runtime.",
    "medium"
  );

  const versionedAssets = Array.from(scriptSources)
    .map((url) => String(url))
    .filter((url) => /[@?&]v=\d|-\d+\.\d+\.\d+|@\d+\.\d+\.\d+/.test(url));

  addResult(
    "9. INFORMATION DISCLOSURE",
    "Versioni librerie JS esposte pubblicamente",
    versionedAssets.length > 0 ? "warn" : "safe",
    versionedAssets.length > 0 ? `Asset con version hint: ${versionedAssets.slice(0, 5).join(", ")}` : "Nessun version hint esplicito rilevato negli asset script analizzati.",
    "Esegui SCA continuo (npm audit, Dependabot, Snyk) e aggiorna librerie vulnerabili.",
    "medium"
  );

  const errorProbe = await httpRequest(new URL(`/__security_audit_probe_${Date.now()}__`, target.href).toString(), { timeoutMs: 9000 });
  const exposesStackTrace = /ReferenceError|TypeError|at\s+[A-Za-z0-9_.]+\s+\(|stack trace|Exception:/i.test(errorProbe.text);

  addResult(
    "9. INFORMATION DISCLOSURE",
    "Error handling / stack trace exposure",
    exposesStackTrace ? "vuln" : "safe",
    `Status errore probe: ${errorProbe.status}. Stack trace rilevato: ${exposesStackTrace}.`,
    "Mostra messaggi errore generici lato client e logga dettagli solo lato server.",
    exposesStackTrace ? "high" : "medium"
  );

  addResult(
    "9. INFORMATION DISCLOSURE",
    "Token/chiavi hardcoded nei JS",
    jsSecretHits.length > 0 ? "vuln" : "safe",
    jsSecretHits.length > 0 ? `Pattern rilevati: ${jsSecretHits.slice(0, 8).join(", ")}` : "Nessun token/chiave hardcoded evidente nei bundle analizzati.",
    "Sposta segreti su variabili server-only e ruota immediatamente eventuali chiavi esposte.",
    jsSecretHits.length > 0 ? "critical" : "high"
  );

  // 10. RISORSE ESTERNE
  const externalResources = [];
  for (const snapshot of pageSnapshots) {
    externalResources.push(...collectExternalResources(snapshot.html, snapshot.url));
  }

  const externalDomains = Array.from(new Set(externalResources.map((item) => new URL(item.url).hostname))).sort();
  addResult(
    "10. RISORSE ESTERNE",
    "Domini esterni caricati",
    externalDomains.length > 0 ? "safe" : "warn",
    externalDomains.length > 0 ? `Domini esterni: ${externalDomains.join(", ")}` : "Nessuna risorsa esterna rilevata nelle pagine analizzate.",
    "Mantieni allowlist CSP aggiornata per tutti i domini esterni necessari.",
    "low"
  );

  const externalScriptsNoSri = externalResources.filter((resource) => resource.tag === "script" && !resource.integrity);
  addResult(
    "10. RISORSE ESTERNE",
    "Subresource Integrity (SRI) su script esterni",
    externalScriptsNoSri.length > 0 ? "warn" : "safe",
    externalScriptsNoSri.length > 0 ? `Script esterni senza SRI: ${externalScriptsNoSri.slice(0, 6).map((item) => item.url).join(", ")}` : "Tutti gli script esterni rilevati usano integrity oppure nessuno script esterno presente.",
    "Aggiungi attributi integrity e crossorigin a tutti gli script esterni statici.",
    "medium"
  );

  const trackerDomains = externalDomains.filter((hostname) =>
    /(google-analytics|googletagmanager|posthog|hotjar|clarity|segment|mixpanel|facebook\.net|doubleclick)/i.test(hostname)
  );
  const hasConsentSignals = /cookie|consent|gdpr|onetrust|cmp/i.test(allHtml);

  addResult(
    "10. RISORSE ESTERNE",
    "Tracker/analytics senza consenso cookie",
    trackerDomains.length > 0 && !hasConsentSignals ? "warn" : "safe",
    trackerDomains.length > 0
      ? `Tracker rilevati: ${trackerDomains.join(", ")}. Marker consenso nel markup: ${hasConsentSignals}.`
      : "Nessun tracker noto rilevato nelle risorse analizzate.",
    "Blocca tracker fino a consenso esplicito (CMP) e documenta base giuridica del trattamento.",
    trackerDomains.length > 0 && !hasConsentSignals ? "high" : "low"
  );

  // Score e priorita
  let score = 100;
  for (const sectionRows of resultsBySection.values()) {
    for (const row of sectionRows) {
      score -= DEDUCTION[row.status] || 0;
    }
  }
  score = Math.max(0, score);

  const orderedFindings = findings
    .slice()
    .sort((a, b) => {
      const statusRankA = a.status === "vuln" ? 2 : 1;
      const statusRankB = b.status === "vuln" ? 2 : 1;
      if (statusRankA !== statusRankB) return statusRankB - statusRankA;
      return (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0);
    });

  const topPriorities = orderedFindings.slice(0, 3);

  const fixSnippets = [
    {
      title: "Next.js security headers (`next.config.ts`)",
      code: `export default {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }
        ]
      }
    ];
  }
};`,
    },
    {
      title: "Nginx hardening (HTTP->HTTPS + file leakage)",
      code: `server {
  listen 80;
  server_name example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name example.com;

  location ~ /\\.(env|git|DS_Store) { deny all; return 404; }
  location ~* \\.map$ { deny all; return 404; }
}`,
    },
    {
      title: "Express/Node cookie hardening",
      code: `res.cookie("session", token, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 1000 * 60 * 60 * 8
});`,
    },
  ];

  const criticalThenHigh = orderedFindings.map((finding) => {
    const probableFiles = /header|csp|hsts|frame|policy/i.test(finding.test)
      ? "next.config.ts, edge middleware, reverse proxy config"
      : /cookie|csrf|session|auth/i.test(finding.test)
        ? "auth routes (src/app/api/**), session middleware, cookie utilities"
        : /api|cors|rate/i.test(finding.test)
          ? "API routes (src/app/api/**), CORS middleware, rate-limit layer"
          : /source map|commenti|file esposti/i.test(finding.test)
            ? "build/deploy config, web server rules, CI artifacts"
            : "routing/configuration and related security middleware";

    const severity = finding.status === "vuln" ? "HIGH/CRITICAL" : "MEDIUM";
    return `- [${severity}] ${finding.test} (${finding.section})\n  - Evidenza: ${sanitizeSummaryText(finding.details, 220)}\n  - Probabile area codice/config: ${probableFiles}\n  - Fix da implementare: ${sanitizeSummaryText(finding.fix, 220)}`;
  });

  let report = `# Security Audit Report - ${target.href}

Run ID: ${runId}  
Data: ${startedAt.toISOString()}  
Modalita: Non distruttiva (safe checks + probing effimero)

`;

  for (const sectionName of SECTION_NAMES) {
    const rows = resultsBySection.get(sectionName) || [];
    report += `[${sectionName}]\n`;
    report += `| Test | Risultato | Dettagli |\n`;
    report += `|---|---|---|\n`;
    for (const row of rows) {
      report += `| ${escapeMarkdownCell(row.test)} | ${escapeMarkdownCell(toStatusLabel(row.status))} | ${escapeMarkdownCell(row.details)} |\n`;
    }
    report += `\n`;
  }

  report += `## Score complessivo\n`;
  report += `**${score}/100**\n\n`;

  report += `## Top 3 priorita (fix immediati)\n`;
  if (topPriorities.length === 0) {
    report += `1. Nessuna vulnerabilita critica/high rilevata nei test automatici eseguiti.\n`;
  } else {
    topPriorities.forEach((item, index) => {
      report += `${index + 1}. ${normalizeFindingTitle(item.test)} (${item.section}) - ${toStatusLabel(item.status)}. Fix: ${item.fix}\n`;
    });
  }
  report += `\n`;

  report += `## Comandi/config pronti da copiare e incollare\n`;
  for (const snippet of fixSnippets) {
    report += `### ${snippet.title}\n`;
    report += "```ts\n";
    report += `${snippet.code}\n`;
    report += "```\n\n";
  }

  report += `## Messaggio per l'agente AI che fixera i problemi\n`;
  report += `Eseguito audit security automatizzato non distruttivo su ${target.href}.  
Di seguito briefing operativo, ordinato per priorita:\n\n`;
  if (criticalThenHigh.length === 0) {
    report += `- Nessun finding critico emerso dai test automatici. Concentrarsi su hardening preventivo (headers, CORS, rate-limit, monitoraggio).\n`;
  } else {
    report += `${criticalThenHigh.join("\n")}\n`;
  }
  report += `\nContesto aggiuntivo:  
- I test SQLi distruttivi sono stati volutamente non eseguiti per rispettare regole non distruttive.  
- Session timeout e brute-force protection richiedono test autenticati dedicati in staging.  
- Prima del deploy, aggiungere regression tests security in CI e monitorare alert runtime.\n`;

  const reportDir = join(process.cwd(), "reports", "security-audit");
  await mkdir(reportDir, { recursive: true });
  const timestamp = startedAt.toISOString().replace(/[:.]/g, "-");
  const reportPath = join(reportDir, `web-security-audit-${timestamp}-${runId}.md`);
  const latestPath = join(reportDir, "latest.md");
  const summaryPath = join(reportDir, "latest-summary.txt");
  const telegramPath = join(reportDir, "latest-telegram.html");

  await writeFile(reportPath, report, "utf8");
  await writeFile(latestPath, report, "utf8");

  const criticalCount = findings.filter((finding) => finding.status === "vuln").length;
  const warningCount = findings.filter((finding) => finding.status === "warn").length;
  const summary = `score=${score}/100 | vulnerabilita=${criticalCount} | miglioramenti=${warningCount} | top=${topPriorities
    .map((priority) => normalizeFindingTitle(priority.test).replace(/[<>"'`]/g, ""))
    .join("; ") || "none"} | report=${reportPath}`;

  await writeFile(summaryPath, summary, "utf8");

  const scoreEmoji = score >= 85 ? "\u{1F7E2}" : score >= 70 ? "\u{1F7E1}" : "\u{1F534}";
  const healthLine =
    criticalCount > 0
      ? "\u{1F534} <b>Stato:</b> vulnerabilita rilevate"
      : warningCount > 0
        ? "\u{1F7E0} <b>Stato:</b> da migliorare"
        : "\u{1F7E2} <b>Stato:</b> baseline solida";

  const topIssuesForTelegram =
    topPriorities.length === 0
      ? "1) \u{1F7E2} <b>Nessuna criticita prioritaria</b>\n• Cosa non va: nessuna vulnerabilita critica emersa in questo run.\n• Come fixare: continuare hardening preventivo e monitoraggio."
      : topPriorities
          .map((item, index) => {
            const title = escapeHtml(normalizeFindingTitle(item.test));
            const issue = escapeHtml(sanitizeSummaryText(item.details, 180));
            const fix = escapeHtml(sanitizeSummaryText(item.fix, 170));
            return `${index + 1}) ${statusEmoji(item.status)} <b>${title}</b>\n• Cosa non va: ${issue}\n• Come fixare: ${fix}`;
          })
          .join("\n\n");

  const telegramMessage = `<b>\u{1F6E1}\uFE0F Daily Web Security Audit</b>\n\n` +
    `\u{1F3AF} <b>Target:</b> ${escapeHtml(target.href)}\n` +
    `${scoreEmoji} <b>Score:</b> ${score}/100\n` +
    `\u{1F534} <b>Vulnerabilita:</b> ${criticalCount}\n` +
    `\u{1F7E0} <b>Da migliorare:</b> ${warningCount}\n` +
    `${healthLine}\n\n` +
    `<b>\u{1F525} Top 3 priorita (cosa non va + come fixare)</b>\n` +
    `${topIssuesForTelegram}\n\n` +
    `\u{1F4CC} <b>Report completo:</b> vedi artifact workflow <code>daily-web-security-audit</code>.`;

  await writeFile(telegramPath, telegramMessage, "utf8");

  console.log(`Security audit completed for ${target.href}`);
  console.log(`Report: ${reportPath}`);
  console.log(`Summary: ${summaryPath}`);
  console.log(`Telegram: ${telegramPath}`);
  console.log(summary);
}

main().catch((error) => {
  console.error("Security audit failed:", error);
  process.exit(1);
});

