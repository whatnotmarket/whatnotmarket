import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { exec } from "node:child_process";
import { join } from "node:path";
import { runJobWithLifecycle } from "../_shared/run-job";
import type { JobResult } from "../_shared/types";

function buildSafeChildEnv() {
  const safeEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }
    if (typeof value === "string") {
      safeEnv[key] = value;
    }
  }
  return safeEnv;
}

function runNpmScript(scriptName: string) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    exec(`npm run ${scriptName}`, {
      cwd: process.cwd(),
      env: buildSafeChildEnv() as unknown as NodeJS.ProcessEnv,
      windowsHide: true,
      maxBuffer: 5 * 1024 * 1024,
    }, (error, stdout, stderr) => {
      if (!error) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`npm run ${scriptName} failed. ${stderr || stdout || error.message}`));
    });
  });
}

async function ensureFileExists(targetPath: string) {
  await access(targetPath, constants.F_OK);
}

export async function executeJob(): Promise<JobResult> {
  return runJobWithLifecycle({
    jobName: "seo/weekly-internal-link-audit",
    leaseSeconds: 30 * 60,
    execute: async () => {
      const result = await runNpmScript("seo:internal-links:audit");

      const mainReport = join(process.cwd(), "reports", "internal-link-audit.csv");
      const unknownReport = join(process.cwd(), "reports", "internal-link-unknown-paths.csv");
      await Promise.all([ensureFileExists(mainReport), ensureFileExists(unknownReport)]);

      return {
        message: "Weekly internal link audit completed.",
        details: {
          reports: [mainReport, unknownReport],
          command_stdout_preview: result.stdout.trim().split(/\r?\n/).slice(-8),
        },
        metrics: {
          processed: 1,
        },
      };
    },
  });
}
