import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const nextBin = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");

if (!existsSync(nextBin)) {
  console.error("Cannot start dev server: Next.js binary not found.");
  process.exit(1);
}

const env = { ...process.env };

// Polling improves file change detection reliability in Windows/editor setups.
env.WATCHPACK_POLLING ||= "true";
env.CHOKIDAR_USEPOLLING ||= "true";

const args = [nextBin, "dev", "--webpack", ...process.argv.slice(2)];
const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env,
});

child.on("exit", (code, signal) => {
  if (typeof code === "number") {
    process.exit(code);
  }
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(1);
});

