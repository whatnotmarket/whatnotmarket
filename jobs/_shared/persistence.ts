import { getJobsSupabaseAdminClient } from "./supabase";
import type { JobResult } from "./types";

function toErrorText(error: Error | undefined) {
  if (!error) return null;
  return error.stack || error.message;
}

export async function recordJobRun(result: JobResult, owner: string | null, runToken: string | null) {
  const client = await getJobsSupabaseAdminClient();
  if (!client) {
    return {
      persisted: false,
      reason: "Supabase admin not configured",
    };
  }

  const detailsPayload = {
    ...(result.details || {}),
    summary_message: result.message,
  };

  const { error } = await client.from("cron_job_runs").insert({
    job_name: result.jobName,
    run_token: runToken,
    owner,
    status: result.status,
    duration_ms: result.metrics.duration,
    processed: result.metrics.processed,
    failed: result.metrics.failed,
    skipped: result.metrics.skipped,
    warnings: result.metrics.warnings,
    memory_mb: result.metrics.memoryMb,
    details: detailsPayload,
    error: toErrorText(result.error),
    finished_at: new Date().toISOString(),
  });

  if (error) {
    const message = String(error.message || "").toLowerCase();
    if (message.includes("relation") && message.includes("does not exist")) {
      return {
        persisted: false,
        reason: "cron_job_runs table not found",
      };
    }

    return {
      persisted: false,
      reason: error.message,
    };
  }

  return { persisted: true };
}
