import test from "node:test";
import assert from "node:assert/strict";
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
  assert.match(message, /STATUS: SUCCESS/);
  assert.match(message, /Processed: 5/);
  assert.match(message, /Warnings: 1/);
  assert.match(message, /API calls remaining: 42/);
});

