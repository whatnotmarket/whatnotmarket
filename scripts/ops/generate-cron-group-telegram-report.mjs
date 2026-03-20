import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const GROUP_JOBS = {
  hourly: [
    "auth/cleanup-expired-internal-sessions",
    "chat/cleanup-expired-moderation-controls",
    "maintenance/retry-early-access-emails",
  ],
  daily: ["admin/expire-timebound-records", "security/daily-signals-digest"],
  weekly: ["trust/weekly-risk-recalculation", "seo/weekly-internal-link-audit"],
  monthly: ["ops/monthly-platform-report"],
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(value, maxLength) {
  const text = String(value ?? "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function normalizeStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "success") return { icon: "🟢", label: "SUCCESS" };
  if (normalized === "skipped") return { icon: "🟡", label: "SKIPPED" };
  if (normalized === "failed") return { icon: "🔴", label: "FAILED" };
  return { icon: "⚪", label: normalized ? normalized.toUpperCase() : "UNKNOWN" };
}

function parseMissingSchema(details) {
  if (!details || typeof details !== "object") return [];
  const value = details.missing_schema_relations;
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function parseSummaryMessage(details) {
  if (!details || typeof details !== "object") return "";
  const value = details.summary_message;
  return typeof value === "string" ? value : "";
}

function buildFallbackReport({ group, workflowStatus, reason, jobs }) {
  const workflowMeta = normalizeStatus(workflowStatus);
  const lines = [
    `<b>📋 Ops ${escapeHtml(group)} Report</b>`,
    `${workflowMeta.icon} <b>Workflow status:</b> ${workflowMeta.label}`,
    "",
    "⚠️ <b>Run report unavailable</b>",
    `• ${escapeHtml(reason)}`,
    "",
    "<b>Expected jobs</b>",
  ];
  for (const job of jobs) {
    lines.push(`• ${escapeHtml(job)}`);
  }
  return lines.join("\n");
}

async function writeReportFile(outputPath, reportText) {
  const target = resolve(outputPath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, reportText, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const group = String(args.group || "").toLowerCase();
  const owner = String(args.owner || process.env.GITHUB_RUN_ID || "");
  const output = String(args.output || "");
  const workflowStatus = String(args.status || process.env.JOB_STATUS || "unknown");

  if (!group || !GROUP_JOBS[group]) {
    throw new Error(`Invalid or missing --group. Allowed: ${Object.keys(GROUP_JOBS).join(", ")}`);
  }
  if (!output) {
    throw new Error("Missing required --output path.");
  }

  const jobs = GROUP_JOBS[group];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || "";

  if (!supabaseUrl || !serviceRole) {
    const fallback = buildFallbackReport({
      group,
      workflowStatus,
      reason: "Supabase admin credentials are missing; unable to collect per-job report.",
      jobs,
    });
    await writeReportFile(output, fallback);
    return;
  }

  const client = createClient(supabaseUrl, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await client
    .from("cron_job_runs")
    .select("job_name,status,duration_ms,processed,failed,skipped,warnings,memory_mb,details,error,started_at,owner")
    .in("job_name", jobs)
    .eq("owner", owner)
    .order("started_at", { ascending: false })
    .limit(Math.max(20, jobs.length * 4));

  if (error) {
    const fallback = buildFallbackReport({
      group,
      workflowStatus,
      reason: `Database query failed: ${error.message}`,
      jobs,
    });
    await writeReportFile(output, fallback);
    return;
  }

  const latestByJob = new Map();
  for (const row of data || []) {
    const jobName = String(row.job_name || "");
    if (!jobName || latestByJob.has(jobName)) continue;
    latestByJob.set(jobName, row);
  }

  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  let warningCount = 0;
  let missingRows = 0;

  const workflowMeta = normalizeStatus(workflowStatus);
  const lines = [
    `<b>📋 Ops ${escapeHtml(group)} Report</b>`,
    `${workflowMeta.icon} <b>Workflow status:</b> ${workflowMeta.label}`,
    "",
    "<b>Summary</b>",
  ];

  for (const jobName of jobs) {
    const row = latestByJob.get(jobName);
    if (!row) {
      missingRows += 1;
      lines.push(`⚪ <b>${escapeHtml(jobName)}</b>`);
      lines.push("• No run row captured for this workflow owner.");
      continue;
    }

    const statusMeta = normalizeStatus(row.status);
    const warnings = Number(row.warnings || 0);
    const durationMs = Number(row.duration_ms || 0);
    const processed = Number(row.processed || 0);
    const failed = Number(row.failed || 0);
    const skipped = Number(row.skipped || 0);
    const memoryMb = Number(row.memory_mb || 0);
    const details = row.details && typeof row.details === "object" ? row.details : {};
    const summaryMessage = parseSummaryMessage(details);
    const missingSchema = parseMissingSchema(details);

    if (String(row.status) === "success") successCount += 1;
    if (String(row.status) === "failed") failedCount += 1;
    if (String(row.status) === "skipped") skippedCount += 1;
    warningCount += warnings;

    lines.push(`${statusMeta.icon} <b>${escapeHtml(jobName)}</b> — ${statusMeta.label}`);
    lines.push(
      `• ⏱ ${durationMs}ms | 📦 ${processed} | ❌ ${failed} | ⏭ ${skipped} | ⚠️ ${warnings} | 🧠 ${memoryMb.toFixed(2)} MB`
    );

    if (summaryMessage) {
      lines.push(`• 💬 ${escapeHtml(truncate(summaryMessage, 200))}`);
    }
    if (missingSchema.length > 0) {
      lines.push(`• 🧱 Missing schema: ${escapeHtml(missingSchema.join(", "))}`);
    }
    if (row.error) {
      lines.push(`• 🚨 ${escapeHtml(truncate(String(row.error), 250))}`);
    }
  }

  lines.splice(4, 0, `• ✅ Success: ${successCount}`, `• 🔴 Failed: ${failedCount}`, `• 🟡 Skipped: ${skippedCount}`, `• ⚠️ Warnings: ${warningCount}`);
  if (missingRows > 0) {
    lines.splice(8, 0, `• ⚪ Missing rows: ${missingRows}`);
  }

  await writeReportFile(output, lines.join("\n"));
}

main().catch(async (error) => {
  const args = parseArgs(process.argv.slice(2));
  const group = String(args.group || "unknown");
  const output = String(args.output || "");
  if (output) {
    const fallback = buildFallbackReport({
      group,
      workflowStatus: String(args.status || "unknown"),
      reason: error instanceof Error ? error.message : String(error),
      jobs: GROUP_JOBS[group] || [],
    });
    await writeReportFile(output, fallback);
  }
  process.exit(0);
});

