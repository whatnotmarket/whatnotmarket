import { randomUUID } from "node:crypto";
import { mkdir,readFile,rm,writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getJobsSupabaseAdminClient } from "./supabase";

type LockProvider = "supabase" | "file";

export type JobLock = {
  acquired: boolean;
  provider: LockProvider;
  token: string;
  owner: string;
  lockUntil: string;
  reason?: string;
};

function sanitizeJobName(jobName: string) {
  return jobName.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
}

function getOwner() {
  return (
    process.env.CRON_LOCK_OWNER ||
    process.env.GITHUB_RUN_ID ||
    `${process.env.USER || process.env.USERNAME || "local"}-${process.pid}`
  );
}

function lockDir() {
  return join(tmpdir(), "openlymarket-cron-locks");
}

function lockPath(jobName: string) {
  return join(lockDir(), `${sanitizeJobName(jobName)}.json`);
}

async function acquireFileLock(jobName: string, leaseSeconds: number): Promise<JobLock> {
  const owner = getOwner();
  const token = randomUUID();
  const now = Date.now();
  const untilMs = now + leaseSeconds * 1000;
  const targetPath = lockPath(jobName);

  await mkdir(lockDir(), { recursive: true });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await writeFile(
        targetPath,
        JSON.stringify({
          owner,
          token,
          lockUntil: new Date(untilMs).toISOString(),
          acquiredAt: new Date(now).toISOString(),
        }),
        { encoding: "utf8", flag: "wx" }
      );
      return {
        acquired: true,
        provider: "file",
        owner,
        token,
        lockUntil: new Date(untilMs).toISOString(),
      };
    } catch (error) {
      const message = String((error as { message?: string }).message || "").toLowerCase();
      if (!message.includes("exist")) {
        throw error;
      }

      try {
        const raw = await readFile(targetPath, "utf8");
        const parsed = JSON.parse(raw) as { lockUntil?: string };
        const lockUntilMs = parsed.lockUntil ? new Date(parsed.lockUntil).getTime() : 0;
        if (!Number.isFinite(lockUntilMs) || lockUntilMs <= Date.now()) {
          await rm(targetPath, { force: true });
          continue;
        }
        return {
          acquired: false,
          provider: "file",
          owner,
          token: "",
          lockUntil: parsed.lockUntil || "",
          reason: "Lock already active (file lock).",
        };
      } catch {
        if (attempt === 2) {
          return {
            acquired: false,
            provider: "file",
            owner,
            token: "",
            lockUntil: "",
            reason: "Unable to parse existing file lock.",
          };
        }
      }
    }
  }

  return {
    acquired: false,
    provider: "file",
    owner,
    token: "",
    lockUntil: "",
    reason: "Lock acquisition failed.",
  };
}

async function acquireSupabaseLock(jobName: string, leaseSeconds: number): Promise<JobLock | null> {
  const client = await getJobsSupabaseAdminClient();
  if (!client) return null;

  const owner = getOwner();
  const token = randomUUID();
  const { data, error } = await client.rpc("acquire_cron_job_lock", {
    p_job_name: jobName,
    p_owner: owner,
    p_lease_seconds: leaseSeconds,
    p_lock_token: token,
  });

  if (error) {
    const message = String(error.message || "").toLowerCase();
    const hint = String((error as { hint?: string }).hint || "").toLowerCase();
    const details = String((error as { details?: string }).details || "").toLowerCase();
    const code = String((error as { code?: string }).code || "").toLowerCase();
    const missingRpc =
      (message.includes("function") && message.includes("does not exist")) ||
      (message.includes("could not find the function") && message.includes("schema cache")) ||
      code === "pgrst202" ||
      hint.includes("schema cache") ||
      details.includes("schema cache");
    if (missingRpc) {
      return null;
    }
    throw new Error(`Unable to acquire Supabase lock: ${error.message}`);
  }

  const payload = (data || {}) as {
    acquired?: boolean;
    token?: string;
    owner?: string;
    lock_until?: string;
  };

  return {
    acquired: Boolean(payload.acquired),
    provider: "supabase",
    owner: String(payload.owner || owner),
    token: String(payload.token || ""),
    lockUntil: String(payload.lock_until || ""),
    reason: payload.acquired ? undefined : "Lock already active (Supabase lock).",
  };
}

export async function acquireJobLock(jobName: string, leaseSeconds = 900): Promise<JobLock> {
  const lease = Math.max(30, leaseSeconds);
  const supabaseLock = await acquireSupabaseLock(jobName, lease);
  if (supabaseLock) {
    return supabaseLock;
  }
  return acquireFileLock(jobName, lease);
}

export async function releaseJobLock(jobName: string, lock: JobLock): Promise<void> {
  if (!lock.token) return;

  if (lock.provider === "supabase") {
    const client = await getJobsSupabaseAdminClient();
    if (!client) return;
    await client.rpc("release_cron_job_lock", {
      p_job_name: jobName,
      p_lock_token: lock.token,
    });
    return;
  }

  const targetPath = lockPath(jobName);
  try {
    const raw = await readFile(targetPath, "utf8");
    const parsed = JSON.parse(raw) as { token?: string };
    if (parsed.token === lock.token) {
      await rm(targetPath, { force: true });
    }
  } catch {
    // Ignore lock release errors.
  }
}
