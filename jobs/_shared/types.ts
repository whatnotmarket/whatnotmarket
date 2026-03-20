export type CronRunStatus = "success" | "failed" | "skipped";

export type JobMetrics = {
  processed: number;
  failed: number;
  skipped: number;
  warnings: number;
  duration: number;
  memoryMb: number;
  apiCallsRemaining?: number | null;
};

export type JobResult = {
  jobName: string;
  status: CronRunStatus;
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  error?: Error;
  metrics: JobMetrics;
};

export type JobExecutionResult = {
  message: string;
  details?: Record<string, unknown>;
  metrics?: Partial<Omit<JobMetrics, "duration" | "memoryMb">>;
};

export type JobDefinition = {
  name: string;
  description: string;
  leaseSeconds?: number;
  execute: () => Promise<JobResult>;
};

export function createEmptyMetrics(): JobMetrics {
  return {
    processed: 0,
    failed: 0,
    skipped: 0,
    warnings: 0,
    duration: 0,
    memoryMb: 0,
    apiCallsRemaining: null,
  };
}

