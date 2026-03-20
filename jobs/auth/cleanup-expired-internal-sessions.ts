import { runJobWithLifecycle } from "../_shared/run-job";
import { requireJobsSupabaseAdminClient } from "../_shared/supabase";
import type { JobResult } from "../_shared/types";

type SessionRow = {
  id: string;
};

export async function executeJob(): Promise<JobResult> {
  return runJobWithLifecycle({
    jobName: "auth/cleanup-expired-internal-sessions",
    leaseSeconds: 20 * 60,
    execute: async () => {
      const admin = await requireJobsSupabaseAdminClient();
      const batchSize = Math.max(100, Math.min(Number(process.env.CRON_SESSION_CLEANUP_BATCH || "1000"), 5000));
      const nowIso = new Date().toISOString();

      let processed = 0;
      let rounds = 0;

      while (rounds < 25) {
        rounds += 1;

        const selectResponse = await admin
          .from("internal_identity_sessions")
          .select("id")
          .lt("expires_at", nowIso)
          .order("expires_at", { ascending: true })
          .limit(batchSize);

        const selectError = selectResponse.error as { message: string } | null;

        if (selectError) {
          throw new Error(`Unable to load expired internal sessions: ${selectError.message}`);
        }

        const rows = (selectResponse.data || []) as SessionRow[];
        if (!rows || rows.length === 0) {
          break;
        }

        const ids = rows.map((row) => row.id);
        const { error: deleteError } = await admin.from("internal_identity_sessions").delete().in("id", ids);

        if (deleteError) {
          throw new Error(`Unable to delete expired sessions: ${deleteError.message}`);
        }

        processed += ids.length;
        if (rows.length < batchSize) {
          break;
        }
      }

      return {
        message: processed > 0 ? "Expired internal sessions cleaned up." : "No expired internal sessions found.",
        details: {
          rounds,
          batch_size: batchSize,
        },
        metrics: {
          processed,
          skipped: processed === 0 ? 1 : 0,
        },
      };
    },
  });
}
