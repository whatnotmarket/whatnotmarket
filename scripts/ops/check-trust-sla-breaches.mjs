import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

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

function firstNonEmptyEnv(...keys) {
  for (const key of keys) {
    const value = String(process.env[key] || "").trim();
    if (value) return value;
  }
  return "";
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

function isSchemaMissingError(message) {
  const normalized = String(message || "").toLowerCase();
  return (
    (normalized.includes("could not find the table") && normalized.includes("schema cache")) ||
    (normalized.includes("could not find the column") && normalized.includes("schema cache")) ||
    (normalized.includes("relation") && normalized.includes("does not exist"))
  );
}

async function writeOutputFile(targetPath, content) {
  const resolved = resolve(targetPath);
  await mkdir(dirname(resolved), { recursive: true });
  await writeFile(resolved, content, "utf8");
}

function toHoursSince(createdAtIso) {
  const createdAt = Date.parse(String(createdAtIso || ""));
  if (!Number.isFinite(createdAt)) return null;
  return Number(((Date.now() - createdAt) / (1000 * 60 * 60)).toFixed(2));
}

function summarizeRecords(rows, label) {
  return (rows || []).slice(0, 8).map((row) => ({
    label,
    id: String(row?.id || "unknown"),
    priority: Number(row?.priority || 0),
    status: String(row?.status || "unknown"),
    created_at: String(row?.created_at || ""),
    age_hours: toHoursSince(row?.created_at),
  }));
}

function buildTelegramReport(payload) {
  const checkedAt = String(payload.checkedAt || new Date().toISOString());
  const highSlaHours = Number(payload.highSlaHours || 12);
  const normalSlaHours = Number(payload.normalSlaHours || 48);
  const mode = String(payload.mode || "critical");
  const criticalIssues = Number(payload.criticalIssues || 0);
  const warningIssues = Number(payload.warningIssues || 0);
  const missingSchema = Array.isArray(payload.missingSchema) ? payload.missingSchema : [];

  const reportsHighOverdue = Number(payload.reportsHighOverdue || 0);
  const reportsNormalOverdue = Number(payload.reportsNormalOverdue || 0);
  const casesHighOverdue = Number(payload.casesHighOverdue || 0);
  const casesNormalOverdue = Number(payload.casesNormalOverdue || 0);

  const modeIcon = mode === "healthy" ? ICONS.green : mode === "warning" ? ICONS.orange : ICONS.red;
  const modeLabel = mode === "healthy" ? "HEALTHY" : mode === "warning" ? "WARNING" : "CRITICAL";

  const lines = [
    `<b>\u{1F6E1} Trust SLA Breach Alert</b>`,
    "",
    `${modeIcon} <b>Status:</b> ${modeLabel}`,
    `\u{1F551} <b>Checked at:</b> ${escapeHtml(checkedAt)}`,
    "",
    "<b>SLA windows</b>",
    `\u{2022} <b>High priority (>=4):</b> ${highSlaHours}h`,
    `\u{2022} <b>Normal priority (<=3):</b> ${normalSlaHours}h`,
    "",
    "<b>Summary</b>",
    `${ICONS.red} <b>Critical issues:</b> ${criticalIssues}`,
    `${ICONS.orange} <b>Warnings:</b> ${warningIssues}`,
    "",
    "<b>Detections</b>",
    `\u{2022} <b>trust_reports high-priority overdue:</b> ${reportsHighOverdue}`,
    `\u{2022} <b>trust_reports normal overdue:</b> ${reportsNormalOverdue}`,
    `\u{2022} <b>trust_moderation_cases high-priority overdue:</b> ${casesHighOverdue}`,
    `\u{2022} <b>trust_moderation_cases normal overdue:</b> ${casesNormalOverdue}`,
  ];

  if (missingSchema.length > 0) {
    lines.push("", "<b>Missing schema</b>");
    for (const name of missingSchema) {
      lines.push(`\u{2022} <code>${escapeHtml(name)}</code>`);
    }
  }

  const samples = Array.isArray(payload.samples) ? payload.samples : [];
  if (samples.length > 0) {
    lines.push("", "<b>Top overdue items</b>");
    for (const row of samples.slice(0, 10)) {
      const age = row.age_hours === null ? "n/a" : `${row.age_hours}h`;
      lines.push(
        `\u{2022} <code>${escapeHtml(row.label)}</code> ${escapeHtml(row.id)} | p${row.priority} | ${escapeHtml(
          row.status
        )} | age ${age}`
      );
    }
  }

  lines.push("", "<b>How to fix</b>");
  lines.push("\u{2022} Prioritize p4-p5 reports/cases and assign owner immediately.");
  lines.push("\u{2022} Close stale open/in_review records with action notes.");
  lines.push("\u{2022} Tune SLA thresholds only after backlog normalizes.");

  return lines.join("\n");
}

async function countQuery(queryPromise) {
  const { count, error } = await queryPromise;
  if (error) throw error;
  return Number(count || 0);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/trust-sla-breach-alert.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/trust-sla-breach-alert.telegram.html");
  const highSlaHours = Math.max(1, numberOrDefault(args["high-sla-hours"] || process.env.TRUST_HIGH_SLA_HOURS, 12));
  const normalSlaHours = Math.max(1, numberOrDefault(args["normal-sla-hours"] || process.env.TRUST_NORMAL_SLA_HOURS, 48));
  const detailLimit = Math.max(5, Math.min(numberOrDefault(args["detail-limit"] || process.env.TRUST_SLA_DETAIL_LIMIT, 50), 200));
  const checkedAt = new Date().toISOString();

  const highCutoffIso = new Date(Date.now() - highSlaHours * 60 * 60 * 1000).toISOString();
  const normalCutoffIso = new Date(Date.now() - normalSlaHours * 60 * 60 * 1000).toISOString();

  const supabaseUrl = firstNonEmptyEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const serviceRole = firstNonEmptyEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE");

  if (!supabaseUrl || !serviceRole) {
    const payload = {
      checkedAt,
      highSlaHours,
      normalSlaHours,
      mode: "critical",
      criticalIssues: 1,
      warningIssues: 0,
      missingSchema: [],
      reportsHighOverdue: 0,
      reportsNormalOverdue: 0,
      casesHighOverdue: 0,
      casesNormalOverdue: 0,
      samples: [],
      failureReason:
        "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY).",
    };
    await Promise.all([
      writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
      writeOutputFile(telegramOutput, buildTelegramReport(payload)),
    ]);
    process.exit(1);
  }

  const client = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const missingSchema = [];
  const reportStatuses = ["open", "in_review"];
  const caseStatuses = ["open", "in_review", "appealed"];

  let reportsHighRows = [];
  let reportsNormalRows = [];
  let casesHighRows = [];
  let casesNormalRows = [];
  let reportsHighOverdue = 0;
  let reportsNormalOverdue = 0;
  let casesHighOverdue = 0;
  let casesNormalOverdue = 0;

  try {
    reportsHighOverdue = await countQuery(
      client
        .from("trust_reports")
        .select("id", { count: "exact", head: true })
        .in("status", reportStatuses)
        .gte("priority", 4)
        .lt("created_at", highCutoffIso)
    );

    const reportsHighRes = await client
      .from("trust_reports")
      .select("id,priority,status,created_at")
      .in("status", reportStatuses)
      .gte("priority", 4)
      .lt("created_at", highCutoffIso)
      .order("created_at", { ascending: true })
      .limit(detailLimit);
    if (reportsHighRes.error) throw reportsHighRes.error;
    reportsHighRows = reportsHighRes.data || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isSchemaMissingError(message)) missingSchema.push("trust_reports");
    else throw error;
  }

  try {
    reportsNormalOverdue = await countQuery(
      client
        .from("trust_reports")
        .select("id", { count: "exact", head: true })
        .in("status", reportStatuses)
        .lt("priority", 4)
        .lt("created_at", normalCutoffIso)
    );

    const reportsNormalRes = await client
      .from("trust_reports")
      .select("id,priority,status,created_at")
      .in("status", reportStatuses)
      .lt("priority", 4)
      .lt("created_at", normalCutoffIso)
      .order("created_at", { ascending: true })
      .limit(detailLimit);
    if (reportsNormalRes.error) throw reportsNormalRes.error;
    reportsNormalRows = reportsNormalRes.data || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isSchemaMissingError(message)) missingSchema.push("trust_reports");
    else throw error;
  }

  try {
    casesHighOverdue = await countQuery(
      client
        .from("trust_moderation_cases")
        .select("id", { count: "exact", head: true })
        .in("status", caseStatuses)
        .gte("priority", 4)
        .lt("created_at", highCutoffIso)
    );

    const casesHighRes = await client
      .from("trust_moderation_cases")
      .select("id,priority,status,created_at")
      .in("status", caseStatuses)
      .gte("priority", 4)
      .lt("created_at", highCutoffIso)
      .order("created_at", { ascending: true })
      .limit(detailLimit);
    if (casesHighRes.error) throw casesHighRes.error;
    casesHighRows = casesHighRes.data || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isSchemaMissingError(message)) missingSchema.push("trust_moderation_cases");
    else throw error;
  }

  try {
    casesNormalOverdue = await countQuery(
      client
        .from("trust_moderation_cases")
        .select("id", { count: "exact", head: true })
        .in("status", caseStatuses)
        .lt("priority", 4)
        .lt("created_at", normalCutoffIso)
    );

    const casesNormalRes = await client
      .from("trust_moderation_cases")
      .select("id,priority,status,created_at")
      .in("status", caseStatuses)
      .lt("priority", 4)
      .lt("created_at", normalCutoffIso)
      .order("created_at", { ascending: true })
      .limit(detailLimit);
    if (casesNormalRes.error) throw casesNormalRes.error;
    casesNormalRows = casesNormalRes.data || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isSchemaMissingError(message)) missingSchema.push("trust_moderation_cases");
    else throw error;
  }

  const criticalIssues = reportsHighOverdue + casesHighOverdue + (missingSchema.length > 0 ? 1 : 0);
  const warningIssues = reportsNormalOverdue + casesNormalOverdue;
  const mode = criticalIssues > 0 ? "critical" : warningIssues > 0 ? "warning" : "healthy";

  const samples = [
    ...summarizeRecords(reportsHighRows, "report-high"),
    ...summarizeRecords(casesHighRows, "case-high"),
    ...summarizeRecords(reportsNormalRows, "report-normal"),
    ...summarizeRecords(casesNormalRows, "case-normal"),
  ].slice(0, 20);

  const payload = {
    checkedAt,
    highSlaHours,
    normalSlaHours,
    mode,
    criticalIssues,
    warningIssues,
    missingSchema: Array.from(new Set(missingSchema)),
    reportsHighOverdue,
    reportsNormalOverdue,
    casesHighOverdue,
    casesNormalOverdue,
    samples,
  };

  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);

  process.exit(criticalIssues > 0 ? 1 : 0);
}

main().catch(async (error) => {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/trust-sla-breach-alert.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/trust-sla-breach-alert.telegram.html");
  const reason = error instanceof Error ? error.message : String(error);
  const payload = {
    checkedAt: new Date().toISOString(),
    highSlaHours: 12,
    normalSlaHours: 48,
    mode: "critical",
    criticalIssues: 1,
    warningIssues: 0,
    missingSchema: [],
    reportsHighOverdue: 0,
    reportsNormalOverdue: 0,
    casesHighOverdue: 0,
    casesNormalOverdue: 0,
    samples: [{ label: "error", id: "global", priority: 0, status: reason, created_at: "", age_hours: null }],
    failureReason: reason,
  };
  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);
  process.exit(1);
});
