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

function numberOrDefault(value, defaultValue) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
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

function isMissingFunctionError(message) {
  const normalized = String(message || "").toLowerCase();
  return (
    (normalized.includes("could not find the function") && normalized.includes("schema cache")) ||
    (normalized.includes("function") && normalized.includes("does not exist")) ||
    normalized.includes("pgrst202")
  );
}

function isPermissionDeniedError(message) {
  const normalized = String(message || "").toLowerCase();
  return normalized.includes("permission denied") || normalized.includes("42501");
}

async function writeOutputFile(targetPath, content) {
  const resolved = resolve(targetPath);
  await mkdir(dirname(resolved), { recursive: true });
  await writeFile(resolved, content, "utf8");
}

function buildTelegramReport(payload) {
  const checkedAt = String(payload.checkedAt || new Date().toISOString());
  const success = Boolean(payload.success);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const totalDeleted = Number(payload.totalDeleted || 0);
  const searchRetentionDays = Number(payload.searchRetentionDays || 120);
  const abuseRetentionDays = Number(payload.abuseRetentionDays || 180);
  const batchSize = Number(payload.batchSize || 10000);
  const failureReason = payload.failureReason ? String(payload.failureReason) : "";
  const recommendedSql = payload.recommendedSql ? String(payload.recommendedSql) : "";

  const lines = [
    `<b>\u{1F9F9} Operational Telemetry Retention</b>`,
    "",
    `${success ? ICONS.green : ICONS.red} <b>Status:</b> ${success ? "SUCCESS" : "FAILED"}`,
    `\u{1F551} <b>Executed at:</b> ${escapeHtml(checkedAt)}`,
    "",
    "<b>Parameters</b>",
    `\u{2022} <b>search retention:</b> ${searchRetentionDays} days`,
    `\u{2022} <b>abuse retention:</b> ${abuseRetentionDays} days`,
    `\u{2022} <b>batch size:</b> ${batchSize}`,
    "",
    "<b>Result</b>",
    `\u{2022} <b>Total deleted rows:</b> ${totalDeleted}`,
  ];

  if (rows.length > 0) {
    for (const row of rows) {
      lines.push(`\u{2022} <code>${escapeHtml(row.table_name)}</code>: ${Number(row.deleted_rows || 0)} deleted`);
    }
  }

  if (failureReason) {
    lines.push("", "<b>Error</b>");
    lines.push(`\u{2022} ${escapeHtml(failureReason)}`);
  }

  if (recommendedSql) {
    lines.push("", "<b>Immediate SQL Fix</b>");
    lines.push(`<code>${escapeHtml(recommendedSql)}</code>`);
  }

  lines.push("", "<b>How to fix if red</b>");
  lines.push("\u{2022} Apply migration <code>20260320123000_operational_telemetry_retention_cron.sql</code>.");
  lines.push("\u{2022} Verify SUPABASE URL/service role secrets in GitHub Actions.");
  lines.push("\u{2022} Re-run this workflow manually after the fix.");

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/operational-retention.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/operational-retention.telegram.html");
  const searchRetentionDays = Math.max(1, numberOrDefault(args["search-days"] || process.env.TELEMETRY_SEARCH_RETENTION_DAYS, 120));
  const abuseRetentionDays = Math.max(1, numberOrDefault(args["abuse-days"] || process.env.TELEMETRY_ABUSE_RETENTION_DAYS, 180));
  const batchSize = Math.max(100, numberOrDefault(args["batch-size"] || process.env.TELEMETRY_BATCH_SIZE, 10000));
  const checkedAt = new Date().toISOString();

  const supabaseUrl = firstNonEmptyEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const serviceRole = firstNonEmptyEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE");

  if (!supabaseUrl || !serviceRole) {
    const payload = {
      success: false,
      checkedAt,
      searchRetentionDays,
      abuseRetentionDays,
      batchSize,
      totalDeleted: 0,
      rows: [],
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

  const rpc = await client.rpc("cleanup_operational_telemetry", {
    p_search_retention: `${searchRetentionDays} days`,
    p_abuse_retention: `${abuseRetentionDays} days`,
    p_batch_size: batchSize,
  });

  if (rpc.error) {
    const permissionHint =
      "Grant required: GRANT EXECUTE ON FUNCTION public.cleanup_operational_telemetry(interval, interval, integer) TO service_role;";
    const needsGrant = isPermissionDeniedError(rpc.error.message);

    const payload = {
      success: false,
      checkedAt,
      searchRetentionDays,
      abuseRetentionDays,
      batchSize,
      totalDeleted: 0,
      rows: [],
      recommendedSql: needsGrant
        ? "GRANT EXECUTE ON FUNCTION public.cleanup_operational_telemetry(interval, interval, integer) TO service_role;"
        : null,
      failureReason: isMissingFunctionError(rpc.error.message)
        ? `${rpc.error.message} (migration 20260320123000_operational_telemetry_retention_cron.sql not applied).`
        : needsGrant
          ? `${rpc.error.message} (${permissionHint})`
        : rpc.error.message,
    };
    await Promise.all([
      writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
      writeOutputFile(telegramOutput, buildTelegramReport(payload)),
    ]);
    process.exit(1);
  }

  const rows = Array.isArray(rpc.data) ? rpc.data : rpc.data ? [rpc.data] : [];
  const sanitizedRows = rows.map((row) => ({
    table_name: String(row?.table_name || "unknown_table"),
    deleted_rows: Number(row?.deleted_rows || 0),
  }));
  const totalDeleted = sanitizedRows.reduce((sum, row) => sum + row.deleted_rows, 0);

  const payload = {
    success: true,
    checkedAt,
    searchRetentionDays,
    abuseRetentionDays,
    batchSize,
    totalDeleted,
    rows: sanitizedRows,
  };

  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);

  process.exit(0);
}

main().catch(async (error) => {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/operational-retention.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/operational-retention.telegram.html");
  const checkedAt = new Date().toISOString();
  const reason = error instanceof Error ? error.message : String(error);
  const payload = {
    success: false,
    checkedAt,
    searchRetentionDays: 120,
    abuseRetentionDays: 180,
    batchSize: 10000,
    totalDeleted: 0,
    rows: [],
    failureReason: reason,
  };
  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);
  process.exit(1);
});
