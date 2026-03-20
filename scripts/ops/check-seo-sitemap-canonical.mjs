import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

const ICONS = {
  green: "\u{1F7E2}",
  red: "\u{1F534}",
  orange: "\u{1F7E0}",
};

const DEFAULT_SAMPLE_PATHS = ["/", "/market", "/requests", "/faq", "/about"];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function numberOrDefault(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

async function writeOutputFile(targetPath, content) {
  const resolved = resolve(targetPath);
  await mkdir(dirname(resolved), { recursive: true });
  await writeFile(resolved, content, "utf8");
}

function normalizeBaseUrl(rawUrl) {
  const fallback = "https://openlymarket.xyz";
  const url = String(rawUrl || fallback).trim();
  const withoutTrailing = url.replace(/\/+$/, "");
  if (!withoutTrailing.startsWith("http://") && !withoutTrailing.startsWith("https://")) {
    return `https://${withoutTrailing}`;
  }
  return withoutTrailing;
}

function parseAllowedStatuses(rawValue, fallback = [200, 503]) {
  if (!rawValue) return fallback;
  const parsed = String(rawValue)
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value >= 100 && value <= 599);
  return parsed.length > 0 ? parsed : fallback;
}

function extractLocsFromXml(xml) {
  const matches = [...String(xml || "").matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)];
  return matches.map((match) => String(match[1] || "").trim()).filter(Boolean);
}

function extractCanonicalHref(html) {
  const regex = /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i;
  const match = String(html || "").match(regex);
  return match ? String(match[1] || "").trim() : "";
}

async function fetchText(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "user-agent": "openlymarket-seo-check/1.0",
    },
    redirect: "follow",
  });
  const body = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    finalUrl: response.url,
    body,
  };
}

function buildTelegramReport(payload) {
  const checkedAt = String(payload.checkedAt || new Date().toISOString());
  const targetBaseUrl = String(payload.targetBaseUrl || "");
  const mode = String(payload.mode || "critical");
  const criticalIssues = Number(payload.criticalIssues || 0);
  const warningIssues = Number(payload.warningIssues || 0);
  const sitemapLocCount = Number(payload.sitemapLocCount || 0);
  const sitemapInsecureLocCount = Number(payload.sitemapInsecureLocCount || 0);
  const canonicalMissingCount = Number(payload.canonicalMissingCount || 0);
  const canonicalInvalidCount = Number(payload.canonicalInvalidCount || 0);

  const modeIcon = mode === "healthy" ? ICONS.green : mode === "warning" ? ICONS.orange : ICONS.red;
  const modeLabel = mode === "healthy" ? "HEALTHY" : mode === "warning" ? "WARNING" : "CRITICAL";

  const lines = [
    `<b>\u{1F50D} SEO Sitemap & Canonical Check</b>`,
    "",
    `${modeIcon} <b>Status:</b> ${modeLabel}`,
    `\u{1F551} <b>Checked at:</b> ${escapeHtml(checkedAt)}`,
    `\u{1F3AF} <b>Target:</b> ${escapeHtml(targetBaseUrl)}`,
    "",
    "<b>Summary</b>",
    `${ICONS.red} <b>Critical issues:</b> ${criticalIssues}`,
    `${ICONS.orange} <b>Warnings:</b> ${warningIssues}`,
    `\u{2022} <b>Sitemap URLs parsed:</b> ${sitemapLocCount}`,
    `\u{2022} <b>Sitemap non-HTTPS URLs:</b> ${sitemapInsecureLocCount}`,
    `\u{2022} <b>Pages missing canonical:</b> ${canonicalMissingCount}`,
    `\u{2022} <b>Pages with invalid canonical:</b> ${canonicalInvalidCount}`,
  ];

  const robots = payload.robots || {};
  const sitemap = payload.sitemap || {};
  lines.push("", "<b>HTTP checks</b>");
  lines.push(`\u{2022} <b>/robots.txt:</b> ${robots.status || "n/a"}`);
  lines.push(`\u{2022} <b>/sitemap.xml:</b> ${sitemap.status || "n/a"}`);

  const canonicalFindings = Array.isArray(payload.canonicalFindings) ? payload.canonicalFindings : [];
  if (canonicalFindings.length > 0) {
    lines.push("", "<b>Canonical findings</b>");
    for (const row of canonicalFindings.slice(0, 10)) {
      lines.push(`\u{2022} <code>${escapeHtml(row.path)}</code>: ${escapeHtml(row.issue)}`);
    }
  }

  const criticalMessages = Array.isArray(payload.criticalMessages) ? payload.criticalMessages : [];
  if (criticalMessages.length > 0) {
    lines.push("", "<b>Critical details</b>");
    for (const message of criticalMessages.slice(0, 8)) {
      lines.push(`\u{2022} ${escapeHtml(message)}`);
    }
  }

  lines.push("", "<b>How to fix</b>");
  lines.push("\u{2022} Ensure robots.txt advertises sitemap.xml and returns 200.");
  lines.push("\u{2022} Ensure sitemap loc entries use HTTPS canonical domain.");
  lines.push("\u{2022} Add/normalize canonical tags on key public pages.");

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/seo-sitemap-canonical-check.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/seo-sitemap-canonical-check.telegram.html");
  const targetBaseUrl = normalizeBaseUrl(args["target-url"] || process.env.PRODUCTION_BASE_URL || process.env.SECURITY_AUDIT_TARGET_URL);
  const sampleLimit = Math.max(3, Math.min(numberOrDefault(args["sample-limit"] || process.env.SEO_CANONICAL_SAMPLE_LIMIT, 5), 20));
  const allowedStatuses = parseAllowedStatuses(args["allowed-statuses"] || process.env.SEO_ALLOWED_HTTP_STATUSES, [200, 503]);
  const checkedAt = new Date().toISOString();

  const criticalMessages = [];
  const warningMessages = [];

  const robotsUrl = `${targetBaseUrl}/robots.txt`;
  const sitemapUrl = `${targetBaseUrl}/sitemap.xml`;

  const robots = await fetchText(robotsUrl);
  if (!allowedStatuses.includes(robots.status)) {
    criticalMessages.push(`/robots.txt returned HTTP ${robots.status} (allowed: ${allowedStatuses.join(",")}).`);
  } else if (robots.status !== 200) {
    warningMessages.push(`/robots.txt returned HTTP ${robots.status}.`);
  }
  const robotsBodyLower = String(robots.body || "").toLowerCase();
  if (!robotsBodyLower.includes("sitemap:")) {
    warningMessages.push("robots.txt does not contain a Sitemap directive.");
  }

  const sitemap = await fetchText(sitemapUrl);
  if (!allowedStatuses.includes(sitemap.status)) {
    criticalMessages.push(`/sitemap.xml returned HTTP ${sitemap.status} (allowed: ${allowedStatuses.join(",")}).`);
  } else if (sitemap.status !== 200) {
    warningMessages.push(`/sitemap.xml returned HTTP ${sitemap.status}.`);
  }
  const sitemapLocs = extractLocsFromXml(sitemap.body);
  if (sitemap.status === 200 && sitemapLocs.length === 0) {
    criticalMessages.push("sitemap.xml contains no <loc> entries.");
  }
  const sitemapInsecureLocs = sitemapLocs.filter((loc) => String(loc).toLowerCase().startsWith("http://"));
  if (sitemapInsecureLocs.length > 0) {
    criticalMessages.push(`sitemap.xml includes ${sitemapInsecureLocs.length} non-HTTPS URLs.`);
  }

  const canonicalPaths = [...new Set(DEFAULT_SAMPLE_PATHS)].slice(0, sampleLimit);
  const canonicalFindings = [];

  for (const path of canonicalPaths) {
    const pageUrl = `${targetBaseUrl}${path}`;
    const page = await fetchText(pageUrl);
    if (!allowedStatuses.includes(page.status)) {
      canonicalFindings.push({
        path,
        issue: `Page returned HTTP ${page.status} (not allowed)`,
      });
      continue;
    }
    if (page.status !== 200) {
      canonicalFindings.push({
        path,
        issue: `Page returned HTTP ${page.status} (maintenance/expected)`,
      });
      continue;
    }
    const canonical = extractCanonicalHref(page.body);
    if (!canonical) {
      canonicalFindings.push({
        path,
        issue: "Missing canonical link",
      });
      continue;
    }
    const canonicalLower = canonical.toLowerCase();
    if (!canonicalLower.startsWith("https://")) {
      canonicalFindings.push({
        path,
        issue: `Canonical is not HTTPS (${canonical})`,
      });
      continue;
    }
    if (!canonical.startsWith(targetBaseUrl)) {
      canonicalFindings.push({
        path,
        issue: `Canonical host mismatch (${canonical})`,
      });
    }
  }

  const canonicalMissingCount = canonicalFindings.filter((row) => row.issue.includes("Missing canonical")).length;
  const canonicalInvalidCount = canonicalFindings.filter((row) => !row.issue.includes("Missing canonical")).length;

  const canonicalCritical = canonicalFindings.filter((row) => row.issue.includes("(not allowed)")).length;
  const canonicalWarnings = canonicalFindings.length - canonicalCritical;
  const criticalIssues = criticalMessages.length + canonicalCritical;
  const warningIssues = warningMessages.length + canonicalWarnings;
  const mode = criticalIssues > 0 ? "critical" : warningIssues > 0 ? "warning" : "healthy";

  const payload = {
    checkedAt,
    targetBaseUrl,
    mode,
    criticalIssues,
    warningIssues,
    robots: {
      status: robots.status,
      ok: robots.ok,
    },
    sitemap: {
      status: sitemap.status,
      ok: sitemap.ok,
    },
    sitemapLocCount: sitemapLocs.length,
    sitemapInsecureLocCount: sitemapInsecureLocs.length,
    canonicalMissingCount,
    canonicalInvalidCount,
    canonicalFindings,
    criticalMessages,
    warningMessages,
    allowedStatuses,
  };

  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);

  process.exit(criticalIssues > 0 ? 1 : 0);
}

main().catch(async (error) => {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/seo-sitemap-canonical-check.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/seo-sitemap-canonical-check.telegram.html");
  const targetBaseUrl = normalizeBaseUrl(args["target-url"] || process.env.PRODUCTION_BASE_URL || process.env.SECURITY_AUDIT_TARGET_URL);
  const reason = error instanceof Error ? error.message : String(error);
  const payload = {
    checkedAt: new Date().toISOString(),
    targetBaseUrl,
    mode: "critical",
    criticalIssues: 1,
    warningIssues: 0,
    robots: { status: "n/a", ok: false },
    sitemap: { status: "n/a", ok: false },
    sitemapLocCount: 0,
    sitemapInsecureLocCount: 0,
    canonicalMissingCount: 0,
    canonicalInvalidCount: 0,
    canonicalFindings: [{ path: "/", issue: reason }],
    criticalMessages: [reason],
    warningMessages: [],
  };
  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);
  process.exit(1);
});
