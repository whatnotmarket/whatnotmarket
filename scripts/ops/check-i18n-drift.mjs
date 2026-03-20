import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const ICONS = {
  green: "\u{1F7E2}",
  red: "\u{1F534}",
  orange: "\u{1F7E0}",
};

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

function numberOrDefault(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function writeOutputFile(targetPath, content) {
  const resolved = resolve(targetPath);
  await mkdir(dirname(resolved), { recursive: true });
  await writeFile(resolved, content, "utf8");
}

function loadDictionariesViaTsx() {
  const code = `
    import enMod from "./src/i18n/dictionaries/en.ts";
    import itMod from "./src/i18n/dictionaries/it.ts";
    import deMod from "./src/i18n/dictionaries/de.ts";
    import esMod from "./src/i18n/dictionaries/es.ts";
    import plMod from "./src/i18n/dictionaries/pl.ts";
    import ruMod from "./src/i18n/dictionaries/ru.ts";
    import ukMod from "./src/i18n/dictionaries/uk.ts";
    import trMod from "./src/i18n/dictionaries/tr.ts";
    import roMod from "./src/i18n/dictionaries/ro.ts";
    import ptBrMod from "./src/i18n/dictionaries/pt-br.ts";
    const en = enMod?.dictionary || enMod?.default?.dictionary || enMod?.default || enMod;
    const it = itMod?.dictionary || itMod?.default?.dictionary || itMod?.default || itMod;
    const de = deMod?.dictionary || deMod?.default?.dictionary || deMod?.default || deMod;
    const es = esMod?.dictionary || esMod?.default?.dictionary || esMod?.default || esMod;
    const pl = plMod?.dictionary || plMod?.default?.dictionary || plMod?.default || plMod;
    const ru = ruMod?.dictionary || ruMod?.default?.dictionary || ruMod?.default || ruMod;
    const uk = ukMod?.dictionary || ukMod?.default?.dictionary || ukMod?.default || ukMod;
    const tr = trMod?.dictionary || trMod?.default?.dictionary || trMod?.default || trMod;
    const ro = roMod?.dictionary || roMod?.default?.dictionary || roMod?.default || roMod;
    const ptBr = ptBrMod?.dictionary || ptBrMod?.default?.dictionary || ptBrMod?.default || ptBrMod;
    const payload = {
      en,
      it,
      de,
      es,
      pl,
      ru,
      uk,
      tr,
      ro,
      "pt-br": ptBr
    };
    console.log(JSON.stringify(payload));
  `;

  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "--eval", code],
    {
      cwd: process.cwd(),
      env: process.env,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    }
  );

  if (result.status !== 0) {
    const stderr = String(result.stderr || "").trim();
    const stdout = String(result.stdout || "").trim();
    throw new Error(`Unable to load i18n dictionaries via tsx. ${stderr || stdout || "unknown failure"}`);
  }

  const payloadText = String(result.stdout || "").trim();
  if (!payloadText) {
    throw new Error("i18n dictionary loader returned empty output.");
  }

  return JSON.parse(payloadText);
}

function flattenLeaves(input, prefix = "", output = {}) {
  if (Array.isArray(input)) {
    input.forEach((item, index) => {
      flattenLeaves(item, `${prefix}[${index}]`, output);
    });
    return output;
  }
  if (input && typeof input === "object") {
    for (const [key, value] of Object.entries(input)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      flattenLeaves(value, nextPrefix, output);
    }
    return output;
  }
  output[prefix] = input;
  return output;
}

function buildTelegramReport(payload) {
  const checkedAt = String(payload.checkedAt || new Date().toISOString());
  const mode = String(payload.mode || "critical");
  const criticalIssues = Number(payload.criticalIssues || 0);
  const warningIssues = Number(payload.warningIssues || 0);
  const localesChecked = Number(payload.localesChecked || 0);
  const totalMissing = Number(payload.totalMissing || 0);
  const totalExtra = Number(payload.totalExtra || 0);
  const totalEmpty = Number(payload.totalEmpty || 0);
  const totalSameAsEnglish = Number(payload.totalSameAsEnglish || 0);

  const modeIcon = mode === "healthy" ? ICONS.green : mode === "warning" ? ICONS.orange : ICONS.red;
  const modeLabel = mode === "healthy" ? "HEALTHY" : mode === "warning" ? "WARNING" : "CRITICAL";

  const lines = [
    `<b>\u{1F310} I18N Drift Guard</b>`,
    "",
    `${modeIcon} <b>Status:</b> ${modeLabel}`,
    `\u{1F551} <b>Checked at:</b> ${escapeHtml(checkedAt)}`,
    "",
    "<b>Summary</b>",
    `${ICONS.red} <b>Critical issues:</b> ${criticalIssues}`,
    `${ICONS.orange} <b>Warnings:</b> ${warningIssues}`,
    `\u{2022} <b>Locales checked:</b> ${localesChecked}`,
    `\u{2022} <b>Total missing keys:</b> ${totalMissing}`,
    `\u{2022} <b>Total extra keys:</b> ${totalExtra}`,
    `\u{2022} <b>Total empty values:</b> ${totalEmpty}`,
    `\u{2022} <b>Total values identical to EN:</b> ${totalSameAsEnglish}`,
  ];

  const perLocale = Array.isArray(payload.perLocale) ? payload.perLocale : [];
  if (perLocale.length > 0) {
    lines.push("", "<b>Per-locale</b>");
    for (const row of perLocale) {
      lines.push(
        `\u{2022} <code>${escapeHtml(row.locale)}</code>: missing=${row.missing} extra=${row.extra} empty=${row.empty} same_en=${row.sameAsEnglish}`
      );
    }
  }

  const topIssues = Array.isArray(payload.topIssues) ? payload.topIssues : [];
  if (topIssues.length > 0) {
    lines.push("", "<b>Top key issues</b>");
    for (const item of topIssues.slice(0, 10)) {
      lines.push(`\u{2022} <code>${escapeHtml(item.locale)}</code> ${escapeHtml(item.type)}: <code>${escapeHtml(item.key)}</code>`);
    }
  }

  lines.push("", "<b>How to fix</b>");
  lines.push("\u{2022} Add missing keys to localized dictionaries from EN baseline.");
  lines.push("\u{2022} Remove stale keys or keep them in sync with dictionary types.");
  lines.push("\u{2022} Translate EN fallback strings where localization is expected.");

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/i18n-drift-guard.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/i18n-drift-guard.telegram.html");
  const maxAllowedMissing = Math.max(0, numberOrDefault(args["max-missing"] || process.env.I18N_MAX_MISSING_KEYS, 0));
  const maxAllowedEmpty = Math.max(0, numberOrDefault(args["max-empty"] || process.env.I18N_MAX_EMPTY_VALUES, 0));
  const checkedAt = new Date().toISOString();

  const dictionaries = loadDictionariesViaTsx();
  const english = dictionaries.en;
  if (!english || typeof english !== "object") {
    throw new Error("English dictionary is missing or invalid.");
  }

  const enLeaves = flattenLeaves(english);
  const enKeys = new Set(Object.keys(enLeaves));
  const locales = Object.keys(dictionaries).filter((locale) => locale !== "en");

  const perLocale = [];
  const topIssues = [];

  let totalMissing = 0;
  let totalExtra = 0;
  let totalEmpty = 0;
  let totalSameAsEnglish = 0;

  for (const locale of locales) {
    const dictionary = dictionaries[locale];
    const leaves = flattenLeaves(dictionary);
    const keys = new Set(Object.keys(leaves));

    const missing = [...enKeys].filter((key) => !keys.has(key));
    const extra = [...keys].filter((key) => !enKeys.has(key));
    const empty = Object.entries(leaves)
      .filter(([, value]) => typeof value === "string" && String(value).trim() === "")
      .map(([key]) => key);
    const sameAsEnglish = Object.entries(leaves)
      .filter(([key, value]) => typeof value === "string" && typeof enLeaves[key] === "string" && value === enLeaves[key])
      .map(([key]) => key);

    totalMissing += missing.length;
    totalExtra += extra.length;
    totalEmpty += empty.length;
    totalSameAsEnglish += sameAsEnglish.length;

    for (const key of missing.slice(0, 3)) {
      topIssues.push({ locale, type: "missing", key });
    }
    for (const key of extra.slice(0, 2)) {
      topIssues.push({ locale, type: "extra", key });
    }
    for (const key of empty.slice(0, 2)) {
      topIssues.push({ locale, type: "empty", key });
    }

    perLocale.push({
      locale,
      missing: missing.length,
      extra: extra.length,
      empty: empty.length,
      sameAsEnglish: sameAsEnglish.length,
    });
  }

  const criticalIssues = totalMissing > maxAllowedMissing || totalEmpty > maxAllowedEmpty ? 1 : 0;
  const warningIssues = totalExtra > 0 || totalSameAsEnglish > 0 ? 1 : 0;
  const mode = criticalIssues > 0 ? "critical" : warningIssues > 0 ? "warning" : "healthy";

  const payload = {
    checkedAt,
    mode,
    criticalIssues,
    warningIssues,
    thresholds: {
      maxAllowedMissing,
      maxAllowedEmpty,
    },
    localesChecked: locales.length,
    totalMissing,
    totalExtra,
    totalEmpty,
    totalSameAsEnglish,
    perLocale,
    topIssues: topIssues.slice(0, 30),
  };

  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);

  process.exit(criticalIssues > 0 ? 1 : 0);
}

main().catch(async (error) => {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/i18n-drift-guard.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/i18n-drift-guard.telegram.html");
  const reason = error instanceof Error ? error.message : String(error);
  const payload = {
    checkedAt: new Date().toISOString(),
    mode: "critical",
    criticalIssues: 1,
    warningIssues: 0,
    localesChecked: 0,
    totalMissing: 0,
    totalExtra: 0,
    totalEmpty: 0,
    totalSameAsEnglish: 0,
    perLocale: [],
    topIssues: [{ locale: "global", type: "error", key: reason }],
    failureReason: reason,
  };
  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);
  process.exit(1);
});
