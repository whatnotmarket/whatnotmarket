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

function summarizeRows(rows, idField = "id") {
  return (rows || []).slice(0, 8).map((row) => ({
    id: String(row?.[idField] || "unknown"),
    status: String(row?.status || "unknown"),
    created_at: String(row?.created_at || ""),
  }));
}

function buildTelegramReport(payload) {
  const checkedAt = String(payload.checkedAt || new Date().toISOString());
  const staleHours = Number(payload.staleHours || 24);
  const criticalIssues = Number(payload.criticalIssues || 0);
  const warningIssues = Number(payload.warningIssues || 0);
  const mode = String(payload.mode || "critical");
  const missingSchema = Array.isArray(payload.missingSchema) ? payload.missingSchema : [];

  const listingPendingStaleCount = Number(payload.listingPendingStaleCount || 0);
  const listingEscrowMissingTxInCount = Number(payload.listingEscrowMissingTxInCount || 0);
  const listingReleasedMissingTxOutCount = Number(payload.listingReleasedMissingTxOutCount || 0);
  const paymentPendingStaleCount = Number(payload.paymentPendingStaleCount || 0);
  const paymentFundedMissingDetectedTxCount = Number(payload.paymentFundedMissingDetectedTxCount || 0);

  const modeIcon = mode === "healthy" ? ICONS.green : mode === "warning" ? ICONS.orange : ICONS.red;
  const modeLabel = mode === "healthy" ? "HEALTHY" : mode === "warning" ? "WARNING" : "CRITICAL";

  const lines = [
    `<b>\u{1F4B3} Payments Reconciliation Watchdog</b>`,
    "",
    `${modeIcon} <b>Status:</b> ${modeLabel}`,
    `\u{1F551} <b>Checked at:</b> ${escapeHtml(checkedAt)}`,
    "",
    "<b>Summary</b>",
    `${ICONS.red} <b>Critical issues:</b> ${criticalIssues}`,
    `${ICONS.orange} <b>Warnings:</b> ${warningIssues}`,
    `\u{23F1} <b>Stale threshold:</b> ${staleHours}h`,
    "",
    "<b>Detections</b>",
    `\u{2022} <b>listing_payments stale in-flight:</b> ${listingPendingStaleCount}`,
    `\u{2022} <b>listing_payments escrow/released without tx_hash_in:</b> ${listingEscrowMissingTxInCount}`,
    `\u{2022} <b>listing_payments released without tx_hash_out:</b> ${listingReleasedMissingTxOutCount}`,
    `\u{2022} <b>payment_intents stale in-flight:</b> ${paymentPendingStaleCount}`,
    `\u{2022} <b>payment_intents funded/released without detected_tx_hash:</b> ${paymentFundedMissingDetectedTxCount}`,
  ];

  if (missingSchema.length > 0) {
    lines.push("", "<b>Missing schema</b>");
    for (const item of missingSchema) {
      lines.push(`\u{2022} <code>${escapeHtml(item)}</code>`);
    }
  }

  const samples = Array.isArray(payload.samples) ? payload.samples : [];
  if (samples.length > 0) {
    lines.push("", "<b>Top samples</b>");
    for (const sample of samples.slice(0, 8)) {
      lines.push(`\u{2022} <code>${escapeHtml(sample.label)}</code>: ${escapeHtml(sample.value)}`);
    }
  }

  lines.push("", "<b>How to fix</b>");
  lines.push("\u{2022} Reconcile missing tx hashes before moving statuses to funded/released.");
  lines.push("\u{2022} Investigate stale in-flight rows older than SLA.");
  lines.push("\u{2022} Re-run payment workers and verify upstream chain indexers.");

  return lines.join("\n");
}

async function countQuery(queryPromise) {
  const { count, error } = await queryPromise;
  if (error) throw error;
  return Number(count || 0);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/payments-reconciliation-watchdog.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/payments-reconciliation-watchdog.telegram.html");
  const staleHours = Math.max(1, numberOrDefault(args["stale-hours"] || process.env.PAYMENTS_STALE_HOURS, 24));
  const detailLimit = Math.max(5, Math.min(numberOrDefault(args["detail-limit"] || process.env.PAYMENTS_DETAIL_LIMIT, 50), 200));
  const checkedAt = new Date().toISOString();
  const staleCutoffIso = new Date(Date.now() - staleHours * 60 * 60 * 1000).toISOString();

  const supabaseUrl = firstNonEmptyEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const serviceRole = firstNonEmptyEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE");

  if (!supabaseUrl || !serviceRole) {
    const payload = {
      checkedAt,
      staleHours,
      mode: "critical",
      criticalIssues: 1,
      warningIssues: 0,
      missingSchema: [],
      failureReason:
        "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY).",
      listingPendingStaleCount: 0,
      listingEscrowMissingTxInCount: 0,
      listingReleasedMissingTxOutCount: 0,
      paymentPendingStaleCount: 0,
      paymentFundedMissingDetectedTxCount: 0,
      samples: [],
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

  const listingPendingStatuses = ["pending", "funded_to_escrow", "awaiting_release"];
  const paymentPendingStatuses = ["created", "awaiting_payment", "detected", "confirming"];
  const paymentFundedStatuses = ["funded", "released", "refunded", "disputed"];

  let listingPendingStaleRows = [];
  let listingEscrowMissingTxInRows = [];
  let listingReleasedMissingTxOutRows = [];
  let paymentPendingStaleRows = [];
  let paymentFundedMissingDetectedTxRows = [];

  let listingPendingStaleCount = 0;
  let listingEscrowMissingTxInCount = 0;
  let listingReleasedMissingTxOutCount = 0;
  let paymentPendingStaleCount = 0;
  let paymentFundedMissingDetectedTxCount = 0;

  try {
    listingPendingStaleCount = await countQuery(
      client
        .from("listing_payments")
        .select("id", { count: "exact", head: true })
        .in("status", listingPendingStatuses)
        .lt("created_at", staleCutoffIso)
    );

    const listingPendingStaleRes = await client
      .from("listing_payments")
      .select("id,status,created_at")
      .in("status", listingPendingStatuses)
      .lt("created_at", staleCutoffIso)
      .order("created_at", { ascending: true })
      .limit(detailLimit);
    if (listingPendingStaleRes.error) throw listingPendingStaleRes.error;
    listingPendingStaleRows = listingPendingStaleRes.data || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isSchemaMissingError(message)) missingSchema.push("listing_payments");
    else throw error;
  }

  try {
    listingEscrowMissingTxInCount = await countQuery(
      client
        .from("listing_payments")
        .select("id", { count: "exact", head: true })
        .in("status", ["funded_to_escrow", "awaiting_release", "released"])
        .is("tx_hash_in", null)
    );

    const listingEscrowMissingTxInRes = await client
      .from("listing_payments")
      .select("id,status,created_at")
      .in("status", ["funded_to_escrow", "awaiting_release", "released"])
      .is("tx_hash_in", null)
      .order("created_at", { ascending: true })
      .limit(detailLimit);
    if (listingEscrowMissingTxInRes.error) throw listingEscrowMissingTxInRes.error;
    listingEscrowMissingTxInRows = listingEscrowMissingTxInRes.data || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isSchemaMissingError(message)) missingSchema.push("listing_payments");
    else throw error;
  }

  try {
    listingReleasedMissingTxOutCount = await countQuery(
      client
        .from("listing_payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "released")
        .is("tx_hash_out", null)
    );

    const listingReleasedMissingTxOutRes = await client
      .from("listing_payments")
      .select("id,status,created_at")
      .eq("status", "released")
      .is("tx_hash_out", null)
      .order("created_at", { ascending: true })
      .limit(detailLimit);
    if (listingReleasedMissingTxOutRes.error) throw listingReleasedMissingTxOutRes.error;
    listingReleasedMissingTxOutRows = listingReleasedMissingTxOutRes.data || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isSchemaMissingError(message)) missingSchema.push("listing_payments");
    else throw error;
  }

  try {
    paymentPendingStaleCount = await countQuery(
      client
        .from("payment_intents")
        .select("id", { count: "exact", head: true })
        .in("status", paymentPendingStatuses)
        .lt("created_at", staleCutoffIso)
    );

    const paymentPendingStaleRes = await client
      .from("payment_intents")
      .select("id,status,created_at")
      .in("status", paymentPendingStatuses)
      .lt("created_at", staleCutoffIso)
      .order("created_at", { ascending: true })
      .limit(detailLimit);
    if (paymentPendingStaleRes.error) throw paymentPendingStaleRes.error;
    paymentPendingStaleRows = paymentPendingStaleRes.data || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isSchemaMissingError(message)) missingSchema.push("payment_intents");
    else throw error;
  }

  try {
    paymentFundedMissingDetectedTxCount = await countQuery(
      client
        .from("payment_intents")
        .select("id", { count: "exact", head: true })
        .in("status", paymentFundedStatuses)
        .is("detected_tx_hash", null)
    );

    const paymentFundedMissingDetectedTxRes = await client
      .from("payment_intents")
      .select("id,status,created_at")
      .in("status", paymentFundedStatuses)
      .is("detected_tx_hash", null)
      .order("created_at", { ascending: true })
      .limit(detailLimit);
    if (paymentFundedMissingDetectedTxRes.error) throw paymentFundedMissingDetectedTxRes.error;
    paymentFundedMissingDetectedTxRows = paymentFundedMissingDetectedTxRes.data || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isSchemaMissingError(message)) missingSchema.push("payment_intents");
    else throw error;
  }

  const criticalIssues =
    listingEscrowMissingTxInCount + listingReleasedMissingTxOutCount + paymentFundedMissingDetectedTxCount + (missingSchema.length > 0 ? 1 : 0);
  const warningIssues = listingPendingStaleCount + paymentPendingStaleCount;
  const mode = criticalIssues > 0 ? "critical" : warningIssues > 0 ? "warning" : "healthy";

  const samples = [
    ...summarizeRows(listingEscrowMissingTxInRows).map((row) => ({
      label: "listing missing tx_hash_in",
      value: `${row.id} (${row.status})`,
    })),
    ...summarizeRows(listingReleasedMissingTxOutRows).map((row) => ({
      label: "listing missing tx_hash_out",
      value: `${row.id} (${row.status})`,
    })),
    ...summarizeRows(paymentFundedMissingDetectedTxRows).map((row) => ({
      label: "payment missing detected_tx_hash",
      value: `${row.id} (${row.status})`,
    })),
    ...summarizeRows(listingPendingStaleRows).map((row) => ({
      label: "listing stale",
      value: `${row.id} (${row.status})`,
    })),
    ...summarizeRows(paymentPendingStaleRows).map((row) => ({
      label: "payment stale",
      value: `${row.id} (${row.status})`,
    })),
  ].slice(0, 20);

  const payload = {
    checkedAt,
    staleHours,
    mode,
    criticalIssues,
    warningIssues,
    missingSchema: Array.from(new Set(missingSchema)),
    listingPendingStaleCount,
    listingEscrowMissingTxInCount,
    listingReleasedMissingTxOutCount,
    paymentPendingStaleCount,
    paymentFundedMissingDetectedTxCount,
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
  const jsonOutput = String(args["json-output"] || "reports/ops/payments-reconciliation-watchdog.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/payments-reconciliation-watchdog.telegram.html");
  const reason = error instanceof Error ? error.message : String(error);
  const payload = {
    checkedAt: new Date().toISOString(),
    staleHours: 24,
    mode: "critical",
    criticalIssues: 1,
    warningIssues: 0,
    missingSchema: [],
    failureReason: reason,
    listingPendingStaleCount: 0,
    listingEscrowMissingTxInCount: 0,
    listingReleasedMissingTxOutCount: 0,
    paymentPendingStaleCount: 0,
    paymentFundedMissingDetectedTxCount: 0,
    samples: [{ label: "error", value: reason }],
  };
  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);
  process.exit(1);
});
