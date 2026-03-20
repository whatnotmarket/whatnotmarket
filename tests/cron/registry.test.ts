import test from "node:test";
import assert from "node:assert/strict";
import { JOB_GROUPS, JOB_LOADERS } from "../../jobs/registry";

test("every group references existing jobs", () => {
  const jobs = new Set(Object.keys(JOB_LOADERS));

  for (const [group, groupJobs] of Object.entries(JOB_GROUPS)) {
    assert.ok(groupJobs.length > 0, `${group} should include at least one job`);
    for (const job of groupJobs) {
      assert.ok(jobs.has(job), `${group} references unknown job ${job}`);
    }
  }
});

test("registry jobs are unique across groups where intended", () => {
  const seen = new Set<string>();
  for (const groupJobs of Object.values(JOB_GROUPS)) {
    for (const job of groupJobs) {
      assert.ok(!seen.has(job), `job ${job} is duplicated across groups`);
      seen.add(job);
    }
  }
});

test("every registered job is assigned to exactly one group", () => {
  const grouped = new Set<string>();
  for (const jobs of Object.values(JOB_GROUPS)) {
    for (const job of jobs) {
      grouped.add(job);
    }
  }

  const registered = Object.keys(JOB_LOADERS).sort();
  const scheduled = Array.from(grouped).sort();
  assert.deepEqual(scheduled, registered);
});
