import assert from "node:assert/strict";
import test from "node:test";
import { buildTelegramMessage } from "../../jobs/_shared/telegram";
import type { JobResult } from "../../jobs/_shared/types";

const sampleResult: JobResult = {
  jobName: "security/daily-signals-digest",
  status: "success",
  success: true,
  message: "Digest created",
  metrics: {
    processed: 5,
    failed: 0,
    skipped: 0,
    warnings: 1,
    duration: 1234,
    memoryMb: 88.4,
    apiCallsRemaining: 42,
  },
  details: {
    key: "value",
  },
};

test("buildTelegramMessage includes core sections", () => {
  const message = buildTelegramMessage(sampleResult);
  assert.match(message, /CRON JOB: security\/daily-signals-digest/);
  assert.match(message, /<b>Status:<\/b> SUCCESS/);
  assert.match(message, /<b>Processed:<\/b> 5/);
  assert.match(message, /<b>Warnings:<\/b> 1/);
  assert.match(message, /<b>API calls remaining:<\/b> 42/);
  assert.match(message, /<b>Details<\/b>/);
  assert.match(message, /<pre>/);
});
