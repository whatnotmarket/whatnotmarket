import test from "node:test";
import assert from "node:assert/strict";
import { JOB_LOADERS } from "../../jobs/registry";

test("every job loader resolves a module exporting executeJob", async (t) => {
  for (const [jobName, loader] of Object.entries(JOB_LOADERS)) {
    await t.test(jobName, async () => {
      const loadedModule = await loader();
      assert.equal(typeof loadedModule.executeJob, "function", `${jobName} must export executeJob()`);
    });
  }
});
