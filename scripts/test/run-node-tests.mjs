import { readdirSync } from "node:fs";
import { resolve, relative, join } from "node:path";
import { spawnSync } from "node:child_process";

function collectTestFiles(dirAbs, rootAbs, acc) {
  const entries = readdirSync(dirAbs, { withFileTypes: true });
  for (const entry of entries) {
    const entryAbs = join(dirAbs, entry.name);
    if (entry.isDirectory()) {
      collectTestFiles(entryAbs, rootAbs, acc);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    if (entry.name.endsWith(".test.ts")) {
      const rel = relative(rootAbs, entryAbs).split("\\").join("/");
      acc.push(rel);
    }
  }
}

const [targetDir] = process.argv.slice(2);
if (!targetDir) {
  console.error("Usage: node scripts/test/run-node-tests.mjs <tests-dir>");
  process.exit(1);
}

const rootAbs = process.cwd();
const targetAbs = resolve(rootAbs, targetDir);
const files = [];

collectTestFiles(targetAbs, rootAbs, files);
files.sort((a, b) => a.localeCompare(b));

if (files.length === 0) {
  console.error(`No .test.ts files found under: ${targetDir}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...files], {
  stdio: "inherit",
  cwd: rootAbs,
  env: process.env,
});

if (typeof result.status === "number") {
  process.exit(result.status);
}
process.exit(1);
