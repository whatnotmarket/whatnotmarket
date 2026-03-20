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

function normalizeStorageKey(bucket, name) {
  const b = String(bucket || "").trim().replace(/^\/+|\/+$/g, "");
  const n = String(name || "").trim().replace(/^\/+|\/+$/g, "");
  if (!b || !n) return null;
  return `${b}/${n}`;
}

function parseStorageReference(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;

  // Supabase public object URL pattern:
  // .../storage/v1/object/public/<bucket>/<path>
  const publicMatch = raw.match(/\/storage\/v1\/object\/public\/([^/?#]+)\/([^?#]+)/i);
  if (publicMatch) {
    return normalizeStorageKey(publicMatch[1], decodeURIComponent(publicMatch[2]));
  }

  // Signed URL pattern:
  // .../storage/v1/object/sign/<bucket>/<path>?token=...
  const signedMatch = raw.match(/\/storage\/v1\/object\/sign\/([^/?#]+)\/([^?#]+)/i);
  if (signedMatch) {
    return normalizeStorageKey(signedMatch[1], decodeURIComponent(signedMatch[2]));
  }

  // Raw "bucket/path" fallback.
  if (raw.includes("/") && !raw.startsWith("http://") && !raw.startsWith("https://")) {
    const [bucket, ...rest] = raw.split("/");
    return normalizeStorageKey(bucket, rest.join("/"));
  }

  return null;
}

async function fetchStorageObjects(client, cutoffIso, maxObjects) {
  const rows = [];
  const pageSize = 1000;
  let offset = 0;
  while (offset < maxObjects) {
    const upper = Math.min(offset + pageSize - 1, maxObjects - 1);
    const { data, error } = await client
      .schema("storage")
      .from("objects")
      .select("id,bucket_id,name,created_at,updated_at,metadata")
      .lt("created_at", cutoffIso)
      .order("created_at", { ascending: true })
      .range(offset, upper);

    if (error) throw error;
    const batch = data || [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }
  return rows.slice(0, maxObjects);
}

function extractApproxObjectSizeBytes(row) {
  const metadata = row?.metadata;
  if (!metadata || typeof metadata !== "object") return 0;
  const maybeSize = Number(metadata.size || metadata.contentLength || 0);
  return Number.isFinite(maybeSize) ? maybeSize : 0;
}

function buildTelegramReport(payload) {
  const checkedAt = String(payload.checkedAt || new Date().toISOString());
  const mode = String(payload.mode || "critical");
  const graceDays = Number(payload.graceDays || 14);
  const criticalIssues = Number(payload.criticalIssues || 0);
  const warningIssues = Number(payload.warningIssues || 0);
  const candidateOrphans = Number(payload.candidateOrphans || 0);
  const sampledObjects = Number(payload.sampledObjects || 0);
  const approximateBytes = Number(payload.approximateBytes || 0);
  const missingSchema = Array.isArray(payload.missingSchema) ? payload.missingSchema : [];

  const modeIcon = mode === "healthy" ? ICONS.green : mode === "warning" ? ICONS.orange : ICONS.red;
  const modeLabel = mode === "healthy" ? "HEALTHY" : mode === "warning" ? "WARNING" : "CRITICAL";

  const lines = [
    `<b>\u{1F5C2} Storage Orphan Cleanup Report</b>`,
    "",
    `${modeIcon} <b>Status:</b> ${modeLabel}`,
    `\u{1F551} <b>Checked at:</b> ${escapeHtml(checkedAt)}`,
    "",
    "<b>Summary</b>",
    `${ICONS.red} <b>Critical issues:</b> ${criticalIssues}`,
    `${ICONS.orange} <b>Warnings:</b> ${warningIssues}`,
    `\u{2022} <b>Grace window:</b> ${graceDays} days`,
    `\u{2022} <b>Storage objects scanned:</b> ${sampledObjects}`,
    `\u{2022} <b>Orphan candidates:</b> ${candidateOrphans}`,
    `\u{2022} <b>Approx. bytes (candidates):</b> ${approximateBytes}`,
  ];

  if (missingSchema.length > 0) {
    lines.push("", "<b>Missing schema</b>");
    for (const row of missingSchema) {
      lines.push(`\u{2022} <code>${escapeHtml(row)}</code>`);
    }
  }

  const topCandidates = Array.isArray(payload.topCandidates) ? payload.topCandidates : [];
  if (topCandidates.length > 0) {
    lines.push("", "<b>Top orphan candidates</b>");
    for (const item of topCandidates.slice(0, 10)) {
      lines.push(`\u{2022} <code>${escapeHtml(item.key)}</code> (${item.size_bytes} bytes)`);
    }
  }

  lines.push("", "<b>How to fix</b>");
  lines.push("\u{2022} Review top candidates and confirm they are not externally referenced.");
  lines.push("\u{2022} Batch-delete only confirmed orphans older than grace window.");
  lines.push("\u{2022} Keep this check in report mode before enabling destructive cleanup.");

  return lines.join("\n");
}

async function collectReferenceKeys(client, missingSchema) {
  const keys = new Set();

  const profileRefs = await client.from("profiles").select("avatar_url,banner_url").limit(10000);
  if (profileRefs.error) {
    if (isSchemaMissingError(profileRefs.error.message)) {
      missingSchema.push("profiles");
    } else {
      throw profileRefs.error;
    }
  } else {
    for (const row of profileRefs.data || []) {
      const avatarKey = parseStorageReference(row.avatar_url);
      if (avatarKey) keys.add(avatarKey);
      const bannerKey = parseStorageReference(row.banner_url);
      if (bannerKey) keys.add(bannerKey);
    }
  }

  const identitiesRefs = await client.from("internal_identities").select("avatar_url").limit(10000);
  if (identitiesRefs.error) {
    if (isSchemaMissingError(identitiesRefs.error.message)) {
      missingSchema.push("internal_identities");
    } else {
      throw identitiesRefs.error;
    }
  } else {
    for (const row of identitiesRefs.data || []) {
      const key = parseStorageReference(row.avatar_url);
      if (key) keys.add(key);
    }
  }

  const onboardingRefs = await client.from("onboarding_leads").select("avatar_url").limit(10000);
  if (onboardingRefs.error) {
    if (isSchemaMissingError(onboardingRefs.error.message)) {
      missingSchema.push("onboarding_leads");
    } else {
      throw onboardingRefs.error;
    }
  } else {
    for (const row of onboardingRefs.data || []) {
      const key = parseStorageReference(row.avatar_url);
      if (key) keys.add(key);
    }
  }

  return keys;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/storage-orphan-report.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/storage-orphan-report.telegram.html");
  const graceDays = Math.max(1, numberOrDefault(args["grace-days"] || process.env.STORAGE_ORPHAN_GRACE_DAYS, 14));
  const maxObjects = Math.max(100, Math.min(numberOrDefault(args["max-objects"] || process.env.STORAGE_ORPHAN_MAX_OBJECTS, 15000), 50000));
  const failCountThreshold = Math.max(
    1,
    numberOrDefault(args["fail-count-threshold"] || process.env.STORAGE_ORPHAN_FAIL_COUNT, 500)
  );
  const checkedAt = new Date().toISOString();
  const cutoffIso = new Date(Date.now() - graceDays * 24 * 60 * 60 * 1000).toISOString();

  const supabaseUrl = firstNonEmptyEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const serviceRole = firstNonEmptyEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE");

  if (!supabaseUrl || !serviceRole) {
    const payload = {
      checkedAt,
      graceDays,
      mode: "critical",
      criticalIssues: 1,
      warningIssues: 0,
      candidateOrphans: 0,
      sampledObjects: 0,
      approximateBytes: 0,
      missingSchema: [],
      topCandidates: [],
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
  const referenceKeys = await collectReferenceKeys(client, missingSchema);
  let objects = [];

  try {
    objects = await fetchStorageObjects(client, cutoffIso, maxObjects);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isSchemaMissingError(message)) {
      missingSchema.push("storage.objects");
      objects = [];
    } else {
      throw error;
    }
  }

  const orphanCandidates = [];
  for (const row of objects) {
    const key = normalizeStorageKey(row.bucket_id, row.name);
    if (!key) continue;
    if (referenceKeys.has(key)) continue;
    orphanCandidates.push({
      key,
      created_at: String(row.created_at || ""),
      size_bytes: extractApproxObjectSizeBytes(row),
    });
  }

  orphanCandidates.sort((a, b) => b.size_bytes - a.size_bytes);
  const approximateBytes = orphanCandidates.reduce((sum, row) => sum + Number(row.size_bytes || 0), 0);

  const criticalIssues = (missingSchema.length > 0 ? 1 : 0) + (orphanCandidates.length > failCountThreshold ? 1 : 0);
  const warningIssues = orphanCandidates.length > 0 ? 1 : 0;
  const mode = criticalIssues > 0 ? "critical" : warningIssues > 0 ? "warning" : "healthy";

  const payload = {
    checkedAt,
    graceDays,
    mode,
    criticalIssues,
    warningIssues,
    sampledObjects: objects.length,
    candidateOrphans: orphanCandidates.length,
    approximateBytes,
    failCountThreshold,
    missingSchema: Array.from(new Set(missingSchema)),
    topCandidates: orphanCandidates.slice(0, 20),
  };

  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);

  process.exit(criticalIssues > 0 ? 1 : 0);
}

main().catch(async (error) => {
  const args = parseArgs(process.argv.slice(2));
  const jsonOutput = String(args["json-output"] || "reports/ops/storage-orphan-report.json");
  const telegramOutput = String(args["telegram-output"] || "reports/ops/storage-orphan-report.telegram.html");
  const reason = error instanceof Error ? error.message : String(error);
  const payload = {
    checkedAt: new Date().toISOString(),
    graceDays: 14,
    mode: "critical",
    criticalIssues: 1,
    warningIssues: 0,
    sampledObjects: 0,
    candidateOrphans: 0,
    approximateBytes: 0,
    missingSchema: [],
    topCandidates: [],
    failureReason: reason,
  };
  await Promise.all([
    writeOutputFile(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`),
    writeOutputFile(telegramOutput, buildTelegramReport(payload)),
  ]);
  process.exit(1);
});
