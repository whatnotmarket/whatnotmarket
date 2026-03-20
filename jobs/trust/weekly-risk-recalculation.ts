import { runJobWithLifecycle } from "../_shared/run-job";
import type { JobResult } from "../_shared/types";

export async function executeJob(): Promise<JobResult> {
  return runJobWithLifecycle({
    jobName: "trust/weekly-risk-recalculation",
    leaseSeconds: 60 * 60,
    execute: async () => {
      const { runTrustRiskRecalculationWorker } = await import("../../src/lib/trust/workers/recalculate-risk");
      const limit = Math.max(50, Math.min(Number(process.env.CRON_TRUST_RECALC_LIMIT || "250"), 1000));
      const worker = await runTrustRiskRecalculationWorker(limit);

      return {
        message: "Trust risk recalculation completed.",
        details: {
          limit,
          processed_users: worker.processedUsers,
          worker_failures: worker.failures,
        },
        metrics: {
          processed: worker.processedUsers,
          failed: worker.failures,
          warnings: worker.failures > 0 ? 1 : 0,
        },
      };
    },
  });
}
