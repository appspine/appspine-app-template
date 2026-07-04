#!/usr/bin/env node
// Runs as the root `preinstall` hook: verifies GitHub Packages auth is available
// before pnpm hits npm.pkg.github.com for the private @appspine/* packages, so a
// missing token fails fast with setup instructions instead of a 403 mid-install.
//
// Accepted auth paths (any one passes):
//   1. GITHUB_TOKEN env var — expanded by the committed project .npmrc.
//   2. A literal `//npm.pkg.github.com/:_authToken=...` in the user/global npmrc
//      chain (~/.npmrc, NPM_CONFIG_USERCONFIG, or pnpm's own config file — where
//      `pnpm config set` writes). Scanned directly instead of via `pnpm config get`,
//      which aborts with "Failed to replace env in config" when GITHUB_TOKEN is
//      unset because of the project .npmrc's ${GITHUB_TOKEN} reference.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const TOKEN_LINE = /^\/\/npm\.pkg\.github\.com\/:_authToken=(.+)$/m;

function hasUsableToken(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return false;
  }
  const match = content.match(TOKEN_LINE);
  if (!match) return false;
  const value = match[1].trim();
  // ${VAR} references only count when the referenced env var is actually set.
  const envRef = value.match(/^\$\{([^}]+)\}$/);
  if (envRef) return Boolean(process.env[envRef[1]]);
  return value.length > 0;
}

if (process.env.GITHUB_TOKEN) process.exit(0);

const home = os.homedir();
const candidates = [
  process.env.NPM_CONFIG_USERCONFIG,
  path.join(home, ".npmrc"),
  // pnpm global config locations (`pnpm config set` writes here).
  process.env.XDG_CONFIG_HOME && path.join(process.env.XDG_CONFIG_HOME, "pnpm", "rc"),
  path.join(home, ".config", "pnpm", "rc"),
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "pnpm", "config", "rc"),
].filter(Boolean);

if (candidates.some(hasUsableToken)) process.exit(0);

console.error(`
ERROR: GitHub Packages auth is not configured — installing the private
@appspine/* packages will fail with 403 Forbidden.

Fix it with either of:

  export GITHUB_TOKEN=<PAT with read:packages scope>     # see README "Quick Start" step 4

or, if your environment does not expand \${GITHUB_TOKEN} from the project .npmrc:

  pnpm config set "//npm.pkg.github.com/:_authToken" <PAT>

then re-run pnpm install.
`);
process.exit(1);
