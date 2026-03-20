import test from "node:test";
import assert from "node:assert/strict";
import { withRetry } from "../../jobs/_shared/retry";

test("withRetry retries and eventually succeeds", async () => {
  let attempts = 0;

  const value = await withRetry(
    async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error("transient");
      }
      return "ok";
    },
    { attempts: 4, baseDelayMs: 5, jitterMs: 0 }
  );

  assert.equal(value, "ok");
  assert.equal(attempts, 3);
});

test("withRetry stops when shouldRetry returns false", async () => {
  let attempts = 0;

  await assert.rejects(
    withRetry(
      async () => {
        attempts += 1;
        throw new Error("fatal");
      },
      {
        attempts: 4,
        baseDelayMs: 5,
        jitterMs: 0,
        shouldRetry: () => false,
      }
    ),
    /fatal/
  );

  assert.equal(attempts, 1);
});

