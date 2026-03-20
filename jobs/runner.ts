import { JOB_GROUPS, JOB_LOADERS, type RegisteredJobName } from "./registry";

function printHelp() {
  const jobs = Object.keys(JOB_LOADERS).sort();
  const groups = Object.keys(JOB_GROUPS).sort();
  console.log("Openly cron runner");
  console.log("");
  console.log("Usage:");
  console.log("  npx tsx jobs/runner.ts --list");
  console.log("  npx tsx jobs/runner.ts --job <job-name>");
  console.log("  npx tsx jobs/runner.ts --group <hourly|daily|weekly|monthly>");
  console.log("  npx tsx jobs/runner.ts <job-name>");
  console.log("");
  console.log("Jobs:");
  for (const job of jobs) {
    console.log(`  - ${job}`);
  }
  console.log("");
  console.log("Groups:");
  for (const group of groups) {
    const list = JOB_GROUPS[group].join(", ");
    console.log(`  - ${group}: ${list}`);
  }
}

function parseArg(name: string) {
  const idx = process.argv.findIndex((arg) => arg === name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

async function runSingleJob(jobName: RegisteredJobName) {
  try {
    const loader = JOB_LOADERS[jobName];
    const jobModule = await loader();
    if (!jobModule || typeof jobModule.executeJob !== "function") {
      console.error(`[cron:${jobName}] Invalid job module: missing executeJob export.`);
      return 1;
    }

    const result = await jobModule.executeJob();
    return result.success ? 0 : 1;
  } catch (error) {
    const details = error instanceof Error ? error.stack || error.message : String(error);
    console.error(`[cron:${jobName}] Job crashed before lifecycle completion.`);
    console.error(details);
    return 1;
  }
}

async function runGroup(groupName: string) {
  const jobs = JOB_GROUPS[groupName];
  if (!jobs || jobs.length === 0) {
    console.error(`Unknown or empty group: ${groupName}`);
    return 1;
  }

  let failures = 0;
  for (const jobName of jobs) {
    const exitCode = await runSingleJob(jobName);
    if (exitCode !== 0) {
      failures += 1;
    }
  }
  return failures > 0 ? 1 : 0;
}

async function main() {
  const hasListFlag = process.argv.includes("--list");
  const group = parseArg("--group");
  const explicitJob = parseArg("--job");
  const positionalJob = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null;
  const selectedJob = (explicitJob || positionalJob) as RegisteredJobName | null;

  if (hasListFlag) {
    printHelp();
    return;
  }

  if (group) {
    const exitCode = await runGroup(group);
    process.exit(exitCode);
    return;
  }

  if (!selectedJob) {
    printHelp();
    process.exit(1);
    return;
  }

  if (!JOB_LOADERS[selectedJob]) {
    console.error(`Unknown job: ${selectedJob}`);
    printHelp();
    process.exit(1);
    return;
  }

  const exitCode = await runSingleJob(selectedJob);
  process.exit(exitCode);
}

main().catch((error) => {
  console.error("Cron runner crashed:", error);
  process.exit(1);
});
