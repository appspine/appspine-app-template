#!/usr/bin/env node
// Pre-commit guard: blocks commits that introduce hardcoded secrets.
//
// This is a small, dependency-free pattern scanner, not a real gitleaks
// install — the actual `gitleaks` tool is a Go binary with no official npm
// distribution (the "gitleaks" npm package is an unrelated, unmaintained
// single-file project, not the real tool), so requiring it would mean every
// dev machine and CI runner needs a separate OS-level binary install on top
// of this framework's plain `pnpm install` setup. This script covers the
// concrete patterns that actually matter here instead.
//
// Triggered by an incident (2026-07-22, see the 033 execution review in the
// appspine workspace dev_docs): a real-format M2M API key
// (`an_live_<32 hex chars>`) was hardcoded into `.env.example` and a service
// default, and only caught by manual code review before it reached a shared
// remote. This scan only looks at ADDED lines in the staged diff (via
// `git diff --cached -U0`), so it won't flag pre-existing content.
import { execFileSync } from "node:child_process";

const PATTERNS = [
  ["appspine M2M API key (an_live_...)", /\ban_live_[0-9a-f]{32}\b/g],
  ["AWS Access Key ID", /\bAKIA[0-9A-Z]{16}\b/g],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g],
  ["Private key block", /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g],
  ["Discovery push token", /\bdisc_push_[0-9a-f]{20,}\b/g],
  // Catches *_SECRET=/*_TOKEN= assignments whose value looks like a real generated credential
  // rather than a placeholder — added after an audit found AUTH_SECRET, AUTH_KEYCLOAK_SECRET, and
  // DISCOVERY_PUSH_TOKEN values in a local .env matching none of the patterns above. Excludes
  // values starting with "<" (this repo's placeholder convention, e.g. "<set-a-strong-password>")
  // and the "dev-secret-<client>" convention used for the shared ephemeral dev Keycloak realm.
  [
    "high-entropy *_SECRET/*_TOKEN value",
    /\b[A-Z][A-Z0-9_]*_(?:SECRET|TOKEN)=(?!['"]?<)(?!['"]?dev-secret-)['"]?[A-Za-z0-9+/=_-]{16,}\b/g,
  ],
];

// Paths that must never be staged at all, regardless of content — untracked-by-convention files
// that hold live local secrets (see .gitignore). Checked against the staged file list, not diff
// content, so `git add -f` can't bypass this the way it can bypass the content patterns above.
const BLOCKED_PATHS = [
  [/(^|\/)\.env$/, ".env (local secrets — never commit; .env.example is the tracked template)"],
  [/\.auth\/.*\.json$/, "e2e/.auth/*.json (live auth session state)"],
];

// Escape hatch for confirmed false positives (e.g. a doc example like
// "an_live_a1b2c3d4", which is short enough to not match the pattern above
// anyway, but kept for any future pattern that's more prone to noise).
const ALLOW_COMMENT = /(gitleaks:allow|secret-scan:allow)/;

function getStagedDiff() {
  try {
    return execFileSync("git", ["diff", "--cached", "-U0", "--diff-filter=ACM"], {
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 64,
    });
  } catch (error) {
    console.error("check-secrets: failed to read staged diff:", error.message);
    process.exit(1);
  }
}

function getStagedFiles() {
  try {
    return execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACM"], {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);
  } catch (error) {
    console.error("check-secrets: failed to read staged file list:", error.message);
    process.exit(1);
  }
}

function scanBlockedPaths(files) {
  const findings = [];
  for (const file of files) {
    for (const [pattern, description] of BLOCKED_PATHS) {
      if (pattern.test(file)) {
        findings.push({ file, description });
      }
    }
  }
  return findings;
}

function scan(diff) {
  const findings = [];
  let currentFile = null;
  let lineNo = 0;

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) {
      currentFile = line.slice(6).replace(/^b\//, "");
      continue;
    }
    if (line.startsWith("@@")) {
      const match = line.match(/\+(\d+)/);
      lineNo = match ? Number(match[1]) : 0;
      continue;
    }
    if (!line.startsWith("+") || line.startsWith("+++")) continue;

    const content = line.slice(1);
    if (!ALLOW_COMMENT.test(content)) {
      for (const [name, pattern] of PATTERNS) {
        pattern.lastIndex = 0;
        const found = content.match(pattern);
        if (found) {
          findings.push({ file: currentFile, line: lineNo, name, sample: found[0] });
        }
      }
    }
    lineNo += 1;
  }

  return findings;
}

const blockedPathFindings = scanBlockedPaths(getStagedFiles());

if (blockedPathFindings.length > 0) {
  console.error("\ncheck-secrets: staged file(s) that must never be committed:\n");
  for (const f of blockedPathFindings) {
    console.error(`  ${f.file}  [${f.description}]`);
  }
  console.error("\nUnstage this file (git restore --staged <file>) — it holds local-only secrets.\n");
  process.exit(1);
}

const findings = scan(getStagedDiff());

if (findings.length > 0) {
  console.error("\ncheck-secrets: possible hardcoded secret(s) in staged changes:\n");
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  [${f.name}]  ${f.sample}`);
  }
  console.error(
    "\nIf this is a confirmed false positive (a placeholder/example value), add a" +
      "\n`// secret-scan:allow` comment on that line and re-commit." +
      "\nOtherwise: remove the value, rotate the real credential if it was ever live," +
      "\nand read it from an environment variable instead.\n",
  );
  process.exit(1);
}
