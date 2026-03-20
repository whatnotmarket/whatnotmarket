import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const ICONS = {
  green: "\u{1F7E2}",
  red: "\u{1F534}",
  orange: "\u{1F7E0}",
};

const REQUIRED_TABLES = [
  "profiles",
  "requests",
  "deals",
  "payment_intents",
  "listing_payments",
  "trust_reports",
  "trust_moderation_cases",
  "cron_job_locks",
  "cron_job_runs",
];

const REQUIRED_MIGRATION_FILES = [
  "supabase/migrations/20260320150000_cron_job_locks_and_runs.sql",
  "supabase/migrations/20260320123000_operational_telemetry_retention_cron.sql",
  "supabase/migrations/20260310143000_message_retention_24h_cleanup.sql",
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
    (normalized.includes("relation") && normalized.includes("does not exist"))
  );
}

function isMissingFunctionError(message) {
  const normalized = String(message || "").toLowerCase();
  return (
    (normalized.includes("could not find the function") && normalized.includes("schema cache")) ||
    (normalized.includes("function") && normalized.includes("does not exist")) ||
    normalized.includes("pgrst202")
  );
}

async function writeOutputFile(targetPath, content) {
  const resolved = resolve(targetPath);
  await mkdir(dirname(resolved), { recursive: true });
  await writeFile(resolved, content, "utf8");
}

async function fileExists(relativePath) {
  try {
    await access(resolve(relativePath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function checkLockFunctions(client) {
  const lockName = `backup-readiness-${Date.now()}`;
  const lockOwner = `workflow:${process.env.GITHUB_RUN_ID || "local"}`;
  const lockToken = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const result = {
    acquire: { status: "ok", message: "ok" },
    release: { status: "ok", message: "ok" },
  };

  const acquire = await client.rpc("acquire_cron_job_lock", {
    p_job_name: lockName,
    p_owner: lockOwner,
    p_lease_seconds: 45,
    p_lock_token: lockToken,
  });
  if (acquire.error) {
    result.acquire = {
      status: isMissingFunctionError(acquire.error.message) ? "missing" : "error",
      message: acquire.error.message,
    };
    result.release = {
      status: "skipped",
      message: "Skipped because acquire failed.",
    };
    return result;
  }

  const release = await client.rpc("release_cron_job_lock", {
    p_job_name: lockName,
    p_lock_token: lockToken,
  });
  if (release.error) {
    result.release = {
      status: isMissingFunctionError(release.error.message) ? "missing" : "error",
      message: release.error.message,
    };
  }

  return result;
}

function buildTelegramReport(payload) {
  const checkedAt = String(payload.checkedAt || new Date().toISOString());
  const mode = String(payload.mode || "critical");
  const criticalIssues = Number(payload.criticalIssues || 0);
  const warningIssues = Number(payload.warningIssues || 0);
  const lookbackHours = Number(payload.lookbackHours || 48);
  const missingTables = Array.isArray(payload.missingTables) ? payload.missingTables : [];
  const missingMigrations = Array.isArray(payload.missingMigrations) ? payload.missingMigrations : [];

  const lockAcquireStatus = String(payload.lockAcquireStatus || "unknown");
  const lockReleaseStatus = String(payload.lockReleaseStatus || "unknown");

  const modeIcon = mode === "healthy" ? ICONS.green : mode === "warning" ? ICONS.orange : ICONS.red;
  const modeLabel = mode === "healthy" ? "READY" : mode === "warning" ? "PARTIAL" : "NOT READY";

  const lines = [
    `<b>\u{1F4BE} Backup & Restore Readiness</b>`,
    "",
    `${modeIcon} <b>Status:</b> ${modeLabel}`,
    `\u{1F551} <b>Checked at:</b> ${escapeHtml(checkedAt)}`,
    "",
    "<b>Summary</b>",
    `${ICONS.red} <b>Critical issues:</b> ${criticalIssues}`,
    `${ICONS.orange} <b>Warnings:</b> ${warningIssues}`,
    `\u{23F1} <b>Recent run lookback:</b> ${lookbackHours}h`,
    "",
    "<b>Signals</b>",
    `\u{2022} <b>Missing tables:</b> ${missingTables.length}`,
    `\u{2022} <b>Missing migration files:</b> ${missingMigrations.length}`,
    `\u{2022} <b>Lock acquire function:</b> ${escapeHtml(lockAcquireStatus)}`,
    `\u{2022} <b>Lock release function:</b> ${escapeHtml(lockReleaseStatus)}`,
  ];

  if (missingTables.length > 0) {
    lines.push("", "<b>Missing tables</b>");
    for (const table of missingTables) {
      lines.push(`\u{2022} <code>${escapeHtml(table)}</code>`);
    }
  }

  if (missingMigrations.length > 0) {
    lines.push("", "<b>Missing migration files</b>");
    for (const file of missingMigrations) {
      lines.push(`\u{2022} <code>${escapeHtml(file)}</code>`);
    }
  }

  const staleJobs = Array.isArray(payload.staleJobs) ? payload.staleJobs : [];
  if (staleJobs.length > 0) {
    lines.push("", "<b>Stale job telemetry</b>");
    for (const row of staleJobs.slice(0, 8)) {
      lines.push(`\u{2022} <code>${escapeHtml(row.jobName)}</code>: ${escapeHtml(row.reason)}`);
    }
  }

  lines.push("", "<b>How to fix</b>");
  lines.push("\u{2022} Ensure all required migrations are present and applied in Supabase.");
  lines.push("\u{2022} Verify service-role secrets in Actions and lock functions availability.");
  lines.push("\u{2022} Run at least one full daily cron cycle and confirm cron_job_runs telemetry.");

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/backup-restore-readiness.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/backup-restore-readiness.telegram.html");
  const lookbackHours = Math.max(1, numberOrDefault(args["lookback-hours"] || process.env.BACKUP_READINESS_LOOKBACK_HOURS, 48));
  const checkedAt = new Date().toISOString();
  const recentCutoffIso = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

  const supabaseUrl = firstNonEmptyEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const serviceRole = firstNonEmptyEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE");

  const migrationChecks = await Promise.all(
    REQUIRED_MIGRATION_FILES.map(async (file) => ({
      file,
      exists: await fileExists(file),
    }))
  );
  const missingMigrations = migrationChecks.filter((row) => !row.exists).map((row) => row.file);

  if (!supabaseUrl || !serviceRole) {
    const payload = {
      checkedAt,
      lookbackHours,
      mode: "critical",
      criticalIssues: 1 + missingMigrations.length,
      warningIssues: 0,
      missingTables: [],
      missingMigrations,
      lockAcquireStatus: "error",
      lockReleaseStatus: "error",
      staleJobs: [],
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

  const missingTables = [];
  const tableErrors = [];
  for (const table of REQUIRED_TABLES) {
    const { error } = await client.from(table).select("id", { count: "exact", head: true }).limit(1);
    if (!error) continue;
    if (isSchemaMissingError(error.message)) {
      missingTables.push(table);
      continue;
    }
    tableErrors.push({ table, error: error.message });
  }

  const lockCheck = await checkLockFunctions(client);

  let staleJobs = [];
  const criticalJobNames = [
    "auth/cleanup-expired-internal-sessions",
    "admin/expire-timebound-records",
    "security/daily-signals-digest",
    "ops/monthly-platform-report",
  ];

  const latestRuns = await client
    .from("cron_job_runs")
    .select("job_name,status,started_at")
    .in("job_name", criticalJobNames)
    .order("started_at", { ascending: false })
    .limit(100);

  if (latestRuns.error) {
    if (isSchemaMissingError(latestRuns.error.message)) {
      if (!missingTables.includes("cron_job_runs")) missingTables.push("cron_job_runs");
    } else {
      tableErrors.push({ table: "cron_job_runs", error: latestRuns.error.message });
    }
  } else {
    const latestByJob = new Map();
    for (const row of latestRuns.data || []) {
      if (!latestByJob.has(row.job_name)) {
        latestByJob.set(row.job_name, row);
      }
    }

    staleJobs = criticalJobNames
      .map((jobName) => {
        const row = latestByJob.get(jobName);
        if (!row) {
          return {
            jobName,
            reason: "No run telemetry found.",
          };
        }
        const startedAtIso = String(row.started_at || "");
        if (!startedAtIso || startedAtIso < recentCutoffIso) {
          return {
            jobName,
            reason: `Latest run older than ${lookbackHours}h window.`,
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  const criticalIssues =
    missingTables.length +
    missingMigrations.length +
    tableErrors.length +
    (lockCheck.acquire.status === "ok" ? 0 : 1) +
    (lockCheck.release.status === "ok" ? 0 : 1);
  const warningIssues = staleJobs.length;
  const mode = criticalIssues > 0 ? "critical" : warningIssues > 0 ? "warning" : "healthy";

  const payload = {
    checkedAt,
    lookbackHours,
    mode,
    criticalIssues,
    warningIssues,
    missingTables,
    missingMigrations,
    tableErrors,
    lockAcquireStatus: lockCheck.acquire.status,
    lockReleaseStatus: lockCheck.release.status,
    lockAcquireMessage: lockCheck.acquire.message,
    lockReleaseMessage: lockCheck.release.message,
    staleJobs,
  };

  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);

  process.exit(criticalIssues > 0 ? 1 : 0);
}

main().catch(async (error) => {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/backup-restore-readiness.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/backup-restore-readiness.telegram.html");
  const reason = error instanceof Error ? error.message : String(error);
  const payload = {
    checkedAt: new Date().toISOString(),
    lookbackHours: 48,
    mode: "critical",
    criticalIssues: 1,
    warningIssues: 0,
    missingTables: [],
    missingMigrations: [],
    tableErrors: [{ table: "global", error: reason }],
    lockAcquireStatus: "error",
    lockReleaseStatus: "error",
    staleJobs: [],
    failureReason: reason,
  };
  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);
  process.exit(1);
});
