import { acquireJobLock,releaseJobLock } from "./lock";
import { createJobLogger } from "./logger";
import { recordJobRun } from "./persistence";
import { sendTelegramNotification } from "./telegram";
import { createEmptyMetrics,type JobExecutionResult,type JobResult } from "./types";

export async function runJobWithLifecycle(config: {
  jobName: string;
  leaseSeconds?: number;
  notifyOnComplete?: boolean;
  execute: (helpers: { logger: ReturnType<typeof createJobLogger> }) => Promise<JobExecutionResult>;
}): Promise<JobResult> {
  const logger = createJobLogger(config.jobName);
  const startedAt = Date.now();
  const leaseSeconds = config.leaseSeconds ?? 900;

  let finalResult: JobResult | null = null;
  let lockOwner: string | null = null;
  let lockToken: string | null = null;

  const lock = await acquireJobLock(config.jobName, leaseSeconds);
  if (!lock.acquired) {
    const metrics = createEmptyMetrics();
    metrics.skipped = 1;
    metrics.duration = Date.now() - startedAt;
    metrics.memoryMb = Number((process.memoryUsage().rss / 1024 / 1024).toFixed(2));

    finalResult = {
      jobName: config.jobName,
      status: "skipped",
      success: true,
      message: lock.reason || "Skipped because another execution is already running.",
      details: {
        lock_provider: lock.provider,
        lock_until: lock.lockUntil,
      },
      metrics,
    };
  } else {
    lockOwner = lock.owner;
    lockToken = lock.token;
    logger.info("Lock acquired", {
      provider: lock.provider,
      lockUntil: lock.lockUntil,
    });

    try {
      const execution = await config.execute({ logger });
      const metrics = {
        ...createEmptyMetrics(),
        ...execution.metrics,
      };
      metrics.duration = Date.now() - startedAt;
      metrics.memoryMb = Number((process.memoryUsage().rss / 1024 / 1024).toFixed(2));

      finalResult = {
        jobName: config.jobName,
        status: "success",
        success: true,
        message: execution.message,
        details: execution.details,
        metrics,
      };
    } catch (error) {
      const metrics = createEmptyMetrics();
      metrics.failed = 1;
      metrics.duration = Date.now() - startedAt;
      metrics.memoryMb = Number((process.memoryUsage().rss / 1024 / 1024).toFixed(2));

      const normalizedError =
        error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown job failure");

      finalResult = {
        jobName: config.jobName,
        status: "failed",
        success: false,
        message: `Job failed: ${normalizedError.message}`,
        error: normalizedError,
        metrics,
      };
    } finally {
      await releaseJobLock(config.jobName, lock).catch((lockError) => {
        logger.warn("Unable to release lock", {
          error: lockError instanceof Error ? lockError.message : String(lockError),
        });
      });
    }
  }

  if (!finalResult) {
    throw new Error("Unable to finalize cron job result.");
  }

  await recordJobRun(finalResult, lockOwner, lockToken).catch((persistError) => {
    logger.warn("Unable to persist cron run result", {
      error: persistError instanceof Error ? persistError.message : String(persistError),
    });
  });

  if (config.notifyOnComplete !== false) {
    const telegramOutcome = await sendTelegramNotification(finalResult).catch((notifyError) => ({
      sent: false,
      reason: notifyError instanceof Error ? notifyError.message : String(notifyError),
    }));

    if (!telegramOutcome.sent) {
      logger.warn("Telegram notification not sent", {
        reason: telegramOutcome.reason || "unknown",
      });
    }
  }

  if (!finalResult.success) {
    logger.error("Job execution failed", {
      message: finalResult.message,
    });
  } else {
    logger.info("Job execution completed", {
      status: finalResult.status,
      duration: finalResult.metrics.duration,
      processed: finalResult.metrics.processed,
      failed: finalResult.metrics.failed,
      skipped: finalResult.metrics.skipped,
    });
  }

  return finalResult;
}
