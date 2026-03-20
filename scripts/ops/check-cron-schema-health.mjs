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

const REQUIRED_TABLES = [
  "cron_job_locks",
  "cron_job_runs",
  "invite_codes",
  "listing_payments",
  "maintenance_early_access_leads",
  "payment_intents",
  "security_abuse_events",
  "seller_verifications",
  "trust_moderation_cases",
  "trust_reports",
  "trust_security_events",
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

function isMissingRelationError(message) {
  const normalized = String(message || "").toLowerCase();
  return (
    (normalized.includes("could not find the table") && normalized.includes("schema cache")) ||
    (normalized.includes("could not find the column") && normalized.includes("schema cache")) ||
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

async function checkRequiredTables(client) {
  const checks = [];
  for (const table of REQUIRED_TABLES) {
    const { count, error } = await client.from(table).select("*", { count: "exact", head: true }).limit(1);
    if (!error) {
      checks.push({
        table,
        present: true,
        row_count: Number(count || 0),
      });
      continue;
    }
    if (isMissingRelationError(error.message)) {
      checks.push({
        table,
        present: false,
        reason: error.message,
      });
      continue;
    }
    checks.push({
      table,
      present: null,
      reason: error.message,
    });
  }
  return checks;
}

async function checkLockFunctions(client) {
  const lockName = `cron-schema-health-${Date.now()}`;
  const lockOwner = `workflow:${process.env.GITHUB_RUN_ID || "local"}`;
  const lockToken = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const results = {
    acquire_cron_job_lock: {
      status: "ok",
      message: "Function is available.",
    },
    release_cron_job_lock: {
      status: "ok",
      message: "Function is available.",
    },
  };

  const acquire = await client.rpc("acquire_cron_job_lock", {
    p_job_name: lockName,
    p_owner: lockOwner,
    p_lease_seconds: 60,
    p_lock_token: lockToken,
  });

  if (acquire.error) {
    if (isMissingFunctionError(acquire.error.message)) {
      results.acquire_cron_job_lock = {
        status: "missing",
        message: acquire.error.message,
      };
      results.release_cron_job_lock = {
        status: "missing",
        message: "Skipped because acquire_cron_job_lock is missing.",
      };
      return results;
    }

    results.acquire_cron_job_lock = {
      status: "error",
      message: acquire.error.message,
    };
    results.release_cron_job_lock = {
      status: "error",
      message: "Skipped because acquire_cron_job_lock returned an unexpected error.",
    };
    return results;
  }

  const release = await client.rpc("release_cron_job_lock", {
    p_job_name: lockName,
    p_lock_token: lockToken,
  });

  if (release.error) {
    if (isMissingFunctionError(release.error.message)) {
      results.release_cron_job_lock = {
        status: "missing",
        message: release.error.message,
      };
      return results;
    }
    results.release_cron_job_lock = {
      status: "error",
      message: release.error.message,
    };
  }

  return results;
}

function statusLabel(status) {
  if (status === "ok") return `${ICONS.green} OK`;
  if (status === "missing") return `${ICONS.red} MISSING`;
  return `${ICONS.orange} ERROR`;
}

function buildTelegramReport(payload) {
  const healthy = Boolean(payload.healthy);
  const checkedAt = String(payload.checkedAt || payload.checked_at || new Date().toISOString());
  const missingTables = Array.isArray(payload.missingTables)
    ? payload.missingTables
    : Array.isArray(payload.missing_tables)
      ? payload.missing_tables
      : [];
  const tableErrors = Array.isArray(payload.tableErrors)
    ? payload.tableErrors
    : Array.isArray(payload.table_errors)
      ? payload.table_errors
      : [];
  const lockFunctions = payload.lockFunctions || payload.lock_functions || {
    acquire_cron_job_lock: { status: "error", message: "unknown" },
    release_cron_job_lock: { status: "error", message: "unknown" },
  };
  const missingFunctionsRaw = Array.isArray(payload.missingFunctions)
    ? payload.missingFunctions
    : Array.isArray(payload.missing_functions)
      ? payload.missing_functions
      : [];
  const functionErrorsRaw = Array.isArray(payload.functionErrors)
    ? payload.functionErrors
    : Array.isArray(payload.function_errors)
      ? payload.function_errors
      : [];

  const missingFunctions = missingFunctionsRaw.map((row) => {
    if (typeof row === "string") {
      return { name: row, message: "Function is missing." };
    }
    return {
      name: String(row?.name || "unknown"),
      message: String(row?.message || "Function is missing."),
    };
  });

  const functionErrors = functionErrorsRaw.map((row) => ({
    name: String(row?.name || "unknown"),
    message: String(row?.message || "Unexpected function error."),
  }));

  const lines = [
    `<b>\u{1F9E9} Ops Cron Schema Health</b>`,
    "",
    `${healthy ? ICONS.green : ICONS.red} <b>Status:</b> ${healthy ? "HEALTHY" : "ACTION REQUIRED"}`,
    `\u{1F551} <b>Checked at:</b> ${escapeHtml(checkedAt)}`,
    "",
    "<b>Summary</b>",
    `\u{1F4CA} <b>Required tables:</b> ${REQUIRED_TABLES.length}`,
    `${ICONS.red} <b>Missing tables:</b> ${missingTables.length}`,
    `${ICONS.orange} <b>Table errors:</b> ${tableErrors.length}`,
    `${ICONS.red} <b>Missing functions:</b> ${missingFunctions.length}`,
    `${ICONS.orange} <b>Function errors:</b> ${functionErrors.length}`,
    "",
    "<b>Function checks</b>",
    `\u{2022} <b>acquire_cron_job_lock:</b> ${escapeHtml(statusLabel(lockFunctions.acquire_cron_job_lock.status))}`,
    `\u{2022} <b>release_cron_job_lock:</b> ${escapeHtml(statusLabel(lockFunctions.release_cron_job_lock.status))}`,
  ];

  if (missingTables.length > 0) {
    lines.push("", "<b>Missing tables</b>");
    for (const table of missingTables) {
      lines.push(`\u{2022} <code>${escapeHtml(table)}</code>`);
    }
  }

  if (tableErrors.length > 0) {
    lines.push("", "<b>Table errors</b>");
    for (const row of tableErrors.slice(0, 6)) {
      lines.push(`\u{2022} <code>${escapeHtml(row.table)}</code>: ${escapeHtml(row.reason)}`);
    }
  }

  if (missingFunctions.length > 0 || functionErrors.length > 0) {
    lines.push("", "<b>Function issues</b>");
    for (const row of [...missingFunctions, ...functionErrors]) {
      lines.push(`\u{2022} <code>${escapeHtml(row.name)}</code>: ${escapeHtml(row.message)}`);
    }
  }

  lines.push("", "<b>How to fix</b>");
  lines.push("\u{2022} Apply migration <code>20260320150000_cron_job_locks_and_runs.sql</code>.");
  lines.push("\u{2022} Apply trust/security/maintenance migrations if required tables are missing.");
  lines.push("\u{2022} Re-run this workflow and then run <code>npm run cron:daily</code>.");

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/cron-schema-health.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/cron-schema-health.telegram.html");

  const supabaseUrl = firstNonEmptyEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const serviceRole = firstNonEmptyEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE");

  if (!supabaseUrl || !serviceRole) {
    const checkedAt = new Date().toISOString();
    const fallback = {
      healthy: false,
      checkedAt,
      required_tables: REQUIRED_TABLES,
      table_checks: [],
      missing_tables: REQUIRED_TABLES,
      table_errors: [],
      lock_functions: {
        acquire_cron_job_lock: {
          status: "error",
          message: "Supabase credentials are missing.",
        },
        release_cron_job_lock: {
          status: "error",
          message: "Supabase credentials are missing.",
        },
      },
      missing_functions: ["acquire_cron_job_lock", "release_cron_job_lock"],
      function_errors: [],
      failure_reason:
        "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY).",
    };

    await Promise.all([
      writeOutputFile(jsonOutput, `${JSON.stringify(fallback, null, 2)}\n`),
      writeOutputFile(telegramOutput, buildTelegramReport(fallback)),
    ]);
    process.exit(1);
  }

  const client = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const checkedAt = new Date().toISOString();
  const tableChecks = await checkRequiredTables(client);
  const lockFunctions = await checkLockFunctions(client);

  const missingTables = tableChecks.filter((row) => row.present === false).map((row) => row.table);
  const tableErrors = tableChecks.filter((row) => row.present === null);

  const functionRows = [
    { name: "acquire_cron_job_lock", ...lockFunctions.acquire_cron_job_lock },
    { name: "release_cron_job_lock", ...lockFunctions.release_cron_job_lock },
  ];
  const missingFunctions = functionRows.filter((row) => row.status === "missing");
  const functionErrors = functionRows.filter((row) => row.status === "error");

  const healthy =
    missingTables.length === 0 &&
    tableErrors.length === 0 &&
    missingFunctions.length === 0 &&
    functionErrors.length === 0;

  const payload = {
    healthy,
    checkedAt,
    required_tables: REQUIRED_TABLES,
    table_checks: tableChecks,
    missing_tables: missingTables,
    table_errors: tableErrors,
    lock_functions: lockFunctions,
    missing_functions: missingFunctions.map((row) => row.name),
    function_errors: functionErrors.map((row) => ({ name: row.name, message: row.message })),
  };

  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);

  process.exit(healthy ? 0 : 1);
}

main().catch(async (error) => {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/cron-schema-health.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/cron-schema-health.telegram.html");
  const failureMessage = error instanceof Error ? error.message : String(error);
  const checkedAt = new Date().toISOString();

  const payload = {
    healthy: false,
    checkedAt,
    required_tables: REQUIRED_TABLES,
    table_checks: [],
    missing_tables: [],
    table_errors: [],
    lock_functions: {
      acquire_cron_job_lock: { status: "error", message: failureMessage },
      release_cron_job_lock: { status: "error", message: failureMessage },
    },
    missing_functions: [],
    function_errors: [{ name: "global", message: failureMessage }],
    failure_reason: failureMessage,
  };

  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);

  process.exit(1);
});
