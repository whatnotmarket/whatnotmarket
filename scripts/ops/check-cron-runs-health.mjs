import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const ICONS = {
  green: "\u{1F7E2}",
  red: "\u{1F534}",
  orange: "\u{1F7E0}",
  white: "\u{26AA}",
};

const JOB_EXPECTATIONS = [
  { jobName: "auth/cleanup-expired-internal-sessions", maxAgeMinutes: 180, group: "hourly" },
  { jobName: "chat/cleanup-expired-moderation-controls", maxAgeMinutes: 180, group: "hourly" },
  { jobName: "maintenance/retry-early-access-emails", maxAgeMinutes: 180, group: "hourly" },
  { jobName: "admin/expire-timebound-records", maxAgeMinutes: 30 * 60, group: "daily" },
  { jobName: "security/daily-signals-digest", maxAgeMinutes: 30 * 60, group: "daily" },
  { jobName: "trust/weekly-risk-recalculation", maxAgeMinutes: 9 * 24 * 60, group: "weekly" },
  { jobName: "seo/weekly-internal-link-audit", maxAgeMinutes: 9 * 24 * 60, group: "weekly" },
  { jobName: "ops/monthly-platform-report", maxAgeMinutes: 40 * 24 * 60, group: "monthly" },
];

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

function formatAgeMinutes(ageMinutes) {
  if (!Number.isFinite(ageMinutes)) return "n/a";
  if (ageMinutes < 60) return `${Math.round(ageMinutes)}m`;
  const hours = ageMinutes / 60;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function normalizeStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "success") return `${ICONS.green} SUCCESS`;
  if (normalized === "failed") return `${ICONS.red} FAILED`;
  if (normalized === "skipped") return `${ICONS.orange} SKIPPED`;
  return `${ICONS.white} ${normalized ? normalized.toUpperCase() : "UNKNOWN"}`;
}

function buildTelegramReport(payload) {
  const checkedAt = String(payload.checkedAt || new Date().toISOString());
  const mode = String(payload.mode || "critical");
  const criticalIssues = Array.isArray(payload.criticalIssues) ? payload.criticalIssues : [];
  const warningIssues = Array.isArray(payload.warningIssues) ? payload.warningIssues : [];
  const recoveredFailures = Array.isArray(payload.recoveredFailures) ? payload.recoveredFailures : [];
  const failedRuns24h = Number(payload.failedRuns24h || 0);
  const checkedJobs = Number(payload.checkedJobs || JOB_EXPECTATIONS.length);

  const headerIcon = mode === "healthy" ? ICONS.green : mode === "warning" ? ICONS.orange : ICONS.red;
  const headerLabel = mode === "healthy" ? "HEALTHY" : mode === "warning" ? "WARNING" : "CRITICAL";

  const lines = [
    `<b>\u{1F4C8} Cron Reliability Watchdog</b>`,
    "",
    `${headerIcon} <b>Status:</b> ${headerLabel}`,
    `\u{1F551} <b>Checked at:</b> ${escapeHtml(checkedAt)}`,
    "",
    "<b>Summary</b>",
    `\u{1F9BE} <b>Jobs checked:</b> ${checkedJobs}`,
    `${ICONS.red} <b>Critical issues:</b> ${criticalIssues.length}`,
    `${ICONS.orange} <b>Warnings:</b> ${warningIssues.length}`,
    `${ICONS.orange} <b>Recovered failures (24h):</b> ${recoveredFailures.length}`,
    `${ICONS.red} <b>Failed runs in 24h:</b> ${failedRuns24h}`,
  ];

  if (criticalIssues.length > 0) {
    lines.push("", "<b>Critical issues</b>");
    for (const issue of criticalIssues.slice(0, 8)) {
      lines.push(`\u{2022} <code>${escapeHtml(issue.jobName)}</code>: ${escapeHtml(issue.reason)}`);
    }
  }

  if (warningIssues.length > 0) {
    lines.push("", "<b>Warnings</b>");
    for (const issue of warningIssues.slice(0, 8)) {
      lines.push(`\u{2022} <code>${escapeHtml(issue.jobName)}</code>: ${escapeHtml(issue.reason)}`);
    }
  }

  if (recoveredFailures.length > 0) {
    lines.push("", "<b>Recovered in last 24h</b>");
    for (const row of recoveredFailures.slice(0, 8)) {
      lines.push(`\u{2022} <code>${escapeHtml(row.jobName)}</code>: ${row.failures24h} failed run(s) but latest is success.`);
    }
  }

  lines.push("", "<b>How to fix</b>");
  lines.push("\u{2022} For stale jobs, run the matching workflow manually and inspect logs.");
  lines.push("\u{2022} For failed jobs, open cron_job_runs details and fix schema/secrets/runtime dependencies.");
  lines.push("\u{2022} Re-run watchdog after fixes to verify green status.");

  return lines.join("\n");
}

function getLatestByJob(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const jobName = String(row.job_name || "");
    if (!jobName || map.has(jobName)) continue;
    map.set(jobName, row);
  }
  return map;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/cron-runs-watchdog.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/cron-runs-watchdog.telegram.html");
  const supabaseUrl = firstNonEmptyEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const serviceRole = firstNonEmptyEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE");
  const checkedAt = new Date().toISOString();

  if (!supabaseUrl || !serviceRole) {
    const payload = {
      checkedAt,
      mode: "critical",
      checkedJobs: JOB_EXPECTATIONS.length,
      failedRuns24h: 0,
      criticalIssues: [
        {
          jobName: "global",
          reason:
            "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY).",
        },
      ],
      warningIssues: [],
      recoveredFailures: [],
      latestByJob: [],
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

  const jobs = JOB_EXPECTATIONS.map((row) => row.jobName);
  const lookbackRows = jobs.length * 25;

  const [latestRowsRes, failedRowsRes] = await Promise.all([
    client
      .from("cron_job_runs")
      .select("job_name,status,started_at,finished_at,warnings,failed,error")
      .in("job_name", jobs)
      .order("started_at", { ascending: false })
      .limit(lookbackRows),
    client
      .from("cron_job_runs")
      .select("job_name,started_at")
      .eq("status", "failed")
      .gte("started_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("started_at", { ascending: false })
      .limit(500),
  ]);

  if (latestRowsRes.error) {
    const payload = {
      checkedAt,
      mode: "critical",
      checkedJobs: JOB_EXPECTATIONS.length,
      failedRuns24h: 0,
      criticalIssues: [{ jobName: "cron_job_runs", reason: latestRowsRes.error.message }],
      warningIssues: [],
      recoveredFailures: [],
      latestByJob: [],
    };
    await Promise.all([
      writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
      writeOutputFile(telegramOutput, buildTelegramReport(payload)),
    ]);
    process.exit(1);
  }

  if (failedRowsRes.error) {
    const payload = {
      checkedAt,
      mode: "critical",
      checkedJobs: JOB_EXPECTATIONS.length,
      failedRuns24h: 0,
      criticalIssues: [{ jobName: "cron_job_runs", reason: failedRowsRes.error.message }],
      warningIssues: [],
      recoveredFailures: [],
      latestByJob: [],
    };
    await Promise.all([
      writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
      writeOutputFile(telegramOutput, buildTelegramReport(payload)),
    ]);
    process.exit(1);
  }

  const nowMs = Date.now();
  const latestByJob = getLatestByJob(latestRowsRes.data || []);
  const failedRows = failedRowsRes.data || [];
  const failedCountByJob = new Map();
  for (const row of failedRows) {
    const jobName = String(row.job_name || "");
    if (!jobName) continue;
    failedCountByJob.set(jobName, Number(failedCountByJob.get(jobName) || 0) + 1);
  }

  const criticalIssues = [];
  const warningIssues = [];
  const recoveredFailures = [];
  const latestReportRows = [];

  for (const expectation of JOB_EXPECTATIONS) {
    const latest = latestByJob.get(expectation.jobName);
    if (!latest) {
      criticalIssues.push({
        jobName: expectation.jobName,
        reason: `No cron_job_runs row found for ${expectation.group} job.`,
      });
      latestReportRows.push({
        jobName: expectation.jobName,
        expectedGroup: expectation.group,
        maxAgeMinutes: expectation.maxAgeMinutes,
        state: "missing",
      });
      continue;
    }

    const startedAt = String(latest.started_at || "");
    const startedAtMs = Date.parse(startedAt);
    const ageMinutes = Number.isFinite(startedAtMs) ? (nowMs - startedAtMs) / (1000 * 60) : Number.NaN;
    const status = String(latest.status || "unknown").toLowerCase();
    const warnings = Number(latest.warnings || 0);
    const failures24h = Number(failedCountByJob.get(expectation.jobName) || 0);

    latestReportRows.push({
      jobName: expectation.jobName,
      expectedGroup: expectation.group,
      latestStatus: status,
      latestStartedAt: startedAt,
      latestAgeMinutes: Number.isFinite(ageMinutes) ? Number(ageMinutes.toFixed(2)) : null,
      maxAgeMinutes: expectation.maxAgeMinutes,
      latestWarnings: warnings,
      failures24h,
    });

    if (!Number.isFinite(ageMinutes)) {
      criticalIssues.push({
        jobName: expectation.jobName,
        reason: `Invalid started_at value (${startedAt || "empty"}).`,
      });
      continue;
    }

    if (ageMinutes > expectation.maxAgeMinutes) {
      criticalIssues.push({
        jobName: expectation.jobName,
        reason: `Latest run is stale (${formatAgeMinutes(ageMinutes)} old, max ${formatAgeMinutes(expectation.maxAgeMinutes)}).`,
      });
      continue;
    }

    if (status === "failed") {
      criticalIssues.push({
        jobName: expectation.jobName,
        reason: `Latest run failed at ${startedAt}.`,
      });
      continue;
    }

    if (status === "skipped") {
      warningIssues.push({
        jobName: expectation.jobName,
        reason: `Latest run is skipped (${startedAt}).`,
      });
    }

    if (warnings > 0) {
      warningIssues.push({
        jobName: expectation.jobName,
        reason: `Latest run reported ${warnings} warning(s).`,
      });
    }

    if (failures24h > 0 && status === "success") {
      recoveredFailures.push({
        jobName: expectation.jobName,
        failures24h,
      });
    }
  }

  const mode = criticalIssues.length > 0 ? "critical" : warningIssues.length > 0 || recoveredFailures.length > 0 ? "warning" : "healthy";
  const payload = {
    checkedAt,
    mode,
    checkedJobs: JOB_EXPECTATIONS.length,
    failedRuns24h: failedRows.length,
    criticalIssues,
    warningIssues,
    recoveredFailures,
    latestByJob: latestReportRows.map((row) => ({
      ...row,
      latestStatusLabel: row.latestStatus ? normalizeStatus(row.latestStatus) : undefined,
    })),
  };

  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);

  process.exit(criticalIssues.length > 0 ? 1 : 0);
}

main().catch(async (error) => {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/cron-runs-watchdog.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/cron-runs-watchdog.telegram.html");
  const checkedAt = new Date().toISOString();
  const reason = error instanceof Error ? error.message : String(error);
  const payload = {
    checkedAt,
    mode: "critical",
    checkedJobs: JOB_EXPECTATIONS.length,
    failedRuns24h: 0,
    criticalIssues: [{ jobName: "global", reason }],
    warningIssues: [],
    recoveredFailures: [],
    latestByJob: [],
  };

  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);

  process.exit(1);
});
