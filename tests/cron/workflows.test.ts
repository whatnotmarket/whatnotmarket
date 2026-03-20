import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const WORKFLOW_DIR = join(process.cwd(), ".github", "workflows");

type ExpectedWorkflow = {
  file: string;
  cron: string;
  mustContain: string[];
};

const EXPECTED_WORKFLOWS: ExpectedWorkflow[] = [
  {
    file: "ops-hourly-telegram.yml",
    cron: "20 * * * *",
    mustContain: ["npm run cron:hourly"],
  },
  {
    file: "ops-daily-telegram.yml",
    cron: "10 3 * * *",
    mustContain: ["npm run cron:daily"],
  },
  {
    file: "ops-weekly-telegram.yml",
    cron: "15 4 * * 1",
    mustContain: ["npm run cron:weekly"],
  },
  {
    file: "ops-monthly-telegram.yml",
    cron: "20 2 1 * *",
    mustContain: ["npm run cron:monthly"],
  },
  {
    file: "ops-cron-schema-health.yml",
    cron: "45 2 * * *",
    mustContain: ["node scripts/ops/check-cron-schema-health.mjs"],
  },
  {
    file: "ops-cron-watchdog.yml",
    cron: "50 */3 * * *",
    mustContain: ["node scripts/ops/check-cron-runs-health.mjs"],
  },
  {
    file: "ops-operational-telemetry-retention.yml",
    cron: "35 3 * * *",
    mustContain: ["node scripts/ops/run-operational-retention-cleanup.mjs"],
  },
  {
    file: "ops-payments-reconciliation-watchdog.yml",
    cron: "5 * * * *",
    mustContain: ["node scripts/ops/check-payments-reconciliation.mjs"],
  },
  {
    file: "ops-trust-sla-breach-alert.yml",
    cron: "35 * * * *",
    mustContain: ["node scripts/ops/check-trust-sla-breaches.mjs"],
  },
  {
    file: "ops-backup-restore-readiness.yml",
    cron: "40 4 * * *",
    mustContain: ["node scripts/ops/check-backup-restore-readiness.mjs"],
  },
  {
    file: "ops-storage-orphan-report.yml",
    cron: "5 4 * * *",
    mustContain: ["node scripts/ops/check-storage-orphans.mjs"],
  },
  {
    file: "ops-seo-sitemap-canonical-check.yml",
    cron: "55 5 * * *",
    mustContain: ["node scripts/ops/check-seo-sitemap-canonical.mjs"],
  },
  {
    file: "ops-i18n-drift-guard.yml",
    cron: "10 6 * * 2",
    mustContain: ["node scripts/ops/check-i18n-drift.mjs"],
  },
  {
    file: "maintenance-email-rules-cron.yml",
    cron: "12 */12 * * *",
    mustContain: ["python src/app/maintenance/fetch_domains.py"],
  },
  {
    file: "production-smoke-telegram.yml",
    cron: "10 5 * * *",
    mustContain: ["Run smoke checks"],
  },
  {
    file: "security-scheduled.yml",
    cron: "25 2 * * *",
    mustContain: ["npm run test:security"],
  },
  {
    file: "security-sensitive-access-alerts.yml",
    cron: "*/5 * * * *",
    mustContain: ["npx tsx jobs/runner.ts --job security/sensitive-access-telegram-alerts"],
  },
  {
    file: "security-web-audit-telegram.yml",
    cron: "35 6 * * *",
    mustContain: ["npm run security:web-audit"],
  },
  {
    file: "dependency-security-weekly.yml",
    cron: "40 3 * * 1",
    mustContain: ["npm audit --omit=dev --json"],
  },
];

function toCronRegex(cronExpression: string) {
  const escaped = cronExpression.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`cron:\\s*\"${escaped}\"`);
}

test("scheduled workflows contain expected cron and command hooks", async () => {
  for (const workflow of EXPECTED_WORKFLOWS) {
    const targetPath = join(WORKFLOW_DIR, workflow.file);
    const content = await readFile(targetPath, "utf8");

    assert.match(content, /schedule:/, `${workflow.file} must declare a schedule trigger`);
    assert.match(content, toCronRegex(workflow.cron), `${workflow.file} must keep cron ${workflow.cron}`);

    for (const requiredSnippet of workflow.mustContain) {
      assert.match(
        content,
        new RegExp(requiredSnippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `${workflow.file} must include "${requiredSnippet}"`
      );
    }
  }
});
