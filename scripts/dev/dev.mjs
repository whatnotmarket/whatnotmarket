import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const nextBin = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");

if (!existsSync(nextBin)) {
  console.error("Cannot start dev server: Next.js binary not found.");
  process.exit(1);
}

const env = { ...process.env };

const passthroughArgs = process.argv.slice(2);
const forceWebpackViaArg = passthroughArgs.includes("--webpack");
const forceWebpackViaEnv = env.DEV_USE_WEBPACK?.toLowerCase() === "true";
const shouldUseWebpack = forceWebpackViaArg || forceWebpackViaEnv;

const shouldUsePolling = env.DEV_USE_POLLING?.toLowerCase() === "true";
if (shouldUsePolling) {
  env.WATCHPACK_POLLING = "true";
  env.CHOKIDAR_USEPOLLING = "true";
} else {
  delete env.WATCHPACK_POLLING;
  delete env.CHOKIDAR_USEPOLLING;
}

const filteredArgs = passthroughArgs.filter((arg) => arg !== "--webpack");
const args = [nextBin, "dev", ...(shouldUseWebpack ? ["--webpack"] : []), ...filteredArgs];
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
