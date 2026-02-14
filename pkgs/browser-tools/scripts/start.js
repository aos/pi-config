#!/usr/bin/env node

import { spawn, execSync } from "node:child_process";
import {
  existsSync,
  accessSync,
  constants,
  readFileSync,
  writeFileSync,
} from "node:fs";

const useProfile = process.argv[2] === "--profile";
const debug = process.env["DEBUG"] === "1";

if (process.argv[2] && process.argv[2] !== "--profile") {
  console.log("Usage: start.js [--profile]");
  console.log("\nOptions:");
  console.log(
    "  --profile  Copy your default Chrome/Chromium profile (cookies, logins)",
  );
  console.log("\nExamples:");
  console.log("  start.js            # Start with fresh profile");
  console.log("  start.js --profile  # Start with your browser profile");
  process.exit(1);
}

function logDebug(message) {
  if (debug) console.error(`[browser-tools] ${message}`);
}

function isExecutable(path) {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function readPreferredBrowser(cacheFile) {
  if (!existsSync(cacheFile)) return null;

  try {
    const bin = readFileSync(cacheFile, "utf8").trim();
    if (!bin) return null;
    if (!isExecutable(bin)) return null;
    return bin;
  } catch {
    return null;
  }
}

function writePreferredBrowser(cacheFile, browserBin) {
  try {
    writeFileSync(cacheFile, `${browserBin}\n`);
  } catch (e) {
    logDebug(`Failed to cache preferred browser: ${e.message}`);
  }
}

// Find available Chrome/Chromium binaries in preferred order.
function findChromeBinaries(preferredBin = null) {
  const candidates = [
    // Linux (prefer Google Chrome over Chromium)
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];

  const found = [];
  const seen = new Set();

  for (const bin of candidates) {
    let resolved = null;
    try {
      resolved = execSync(`which "${bin}"`, {
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8",
      })
        .trim()
        .split("\n")[0];
    } catch {
      if (existsSync(bin)) resolved = bin;
    }

    if (resolved && !seen.has(resolved)) {
      seen.add(resolved);
      found.push(resolved);
    }
  }

  if (preferredBin) {
    if (!seen.has(preferredBin) && isExecutable(preferredBin)) {
      found.unshift(preferredBin);
      seen.add(preferredBin);
    } else {
      const idx = found.indexOf(preferredBin);
      if (idx > 0) {
        found.splice(idx, 1);
        found.unshift(preferredBin);
      }
    }
  }

  if (found.length === 0) {
    throw new Error("Could not find Chrome or Chromium");
  }

  return found;
}

// Find profile directory
function findProfileDir() {
  const home = process.env["HOME"];
  const candidates = [
    // Linux (prefer Google Chrome profile first)
    `${home}/.config/google-chrome`,
    `${home}/.config/chromium`,
    // macOS
    `${home}/Library/Application Support/Google/Chrome`,
    `${home}/Library/Application Support/Chromium`,
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return null;
}

function isProcessAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForChromeReady(pid, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    for (const host of ["127.0.0.1", "localhost"]) {
      try {
        const response = await fetch(`http://${host}:9222/json/version`);
        if (response.ok) return true;
      } catch {}
    }

    if (!isProcessAlive(pid)) {
      return false;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return false;
}

// Kill existing Chrome with remote debugging
try {
  execSync("pkill -f 'remote-debugging-port=9222'", { stdio: "ignore" });
} catch {}

// Wait a bit for processes to fully die
await new Promise((r) => setTimeout(r, 1000));

// Setup profile directory
const cacheDir = `${process.env["HOME"]}/.cache/web-browser-cdp`;
const preferredBinFile = `${cacheDir}/browser-bin`;
execSync(`mkdir -p "${cacheDir}"`, { stdio: "ignore" });

if (useProfile) {
  const profileDir = findProfileDir();
  if (profileDir) {
    execSync(`rsync -a --delete "${profileDir}/" "${cacheDir}/"`, {
      stdio: "pipe",
    });
  } else {
    console.error("Warning: Could not find browser profile to copy");
  }
}

const preferredBin = readPreferredBrowser(preferredBinFile);
if (preferredBin) {
  logDebug(`Trying cached preferred browser first: ${preferredBin}`);
}

const chromeBins = findChromeBinaries(preferredBin);
let connected = false;
let selectedBin = null;

for (const chromeBin of chromeBins) {
  logDebug(`Trying browser binary: ${chromeBin}`);

  const child = spawn(
    chromeBin,
    [
      "--remote-debugging-port=9222",
      `--user-data-dir=${cacheDir}`,
      "--profile-directory=Default",
      "--disable-search-engine-choice-screen",
      "--no-first-run",
      "--disable-features=ProfilePicker",
    ],
    { detached: true, stdio: "ignore" },
  );

  child.unref();

  connected = await waitForChromeReady(child.pid);
  if (connected) {
    selectedBin = chromeBin;
    break;
  }

  logDebug(`Failed to start with: ${chromeBin}`);

  try {
    process.kill(child.pid, "SIGTERM");
  } catch {}

  try {
    execSync("pkill -f 'remote-debugging-port=9222'", { stdio: "ignore" });
  } catch {}

  await new Promise((r) => setTimeout(r, 500));
}

if (!connected) {
  console.error(
    `✗ Failed to connect to Chrome (tried: ${chromeBins.join(", ")})`,
  );
  process.exit(1);
}

writePreferredBrowser(preferredBinFile, selectedBin);
logDebug(`Connected using: ${selectedBin}`);
console.log(
  `✓ Chrome started on :9222${useProfile ? " with your profile" : ""}`,
);
