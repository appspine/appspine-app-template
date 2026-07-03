#!/usr/bin/env node
// Automatically initializes a new business system forked from appspine-app-template.
// Usage: node scripts/scaffold-init.mjs --name <kebab-case> --display-name "<Display Name>" [--description "<Description>"] [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function printUsage() {
  console.log(`Usage: node scripts/scaffold-init.mjs --name <kebab-case> --display-name "<Display Name>" [options]

Required:
  --name              The technical identifier for the business app (kebab-case, e.g. "hr-portal")
  --display-name      The human-readable name of the app (e.g. "HR Portal")

Optional:
  --description       A one-sentence description of the app. Falls back to display-name.
  --dry-run           Verify all rules and output replacement plan without writing files
`);
}

function parseArgs(argv) {
  const args = {
    name: null,
    displayName: null,
    description: null,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--name':
        args.name = argv[++i];
        break;
      case '--display-name':
        args.displayName = argv[++i];
        break;
      case '--description':
        args.description = argv[++i];
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) fail(`Unknown flag: ${arg}`);
    }
  }

  return args;
}

function validateName(name) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    fail(
      `Invalid name "${name}" — must match kebab-case /^[a-z0-9]+(-[a-z0-9]+)*$/ ` +
        `(e.g., "hr-portal", "document-collaboration")`,
    );
  }
}

// Reads a file, normalizing CRLF -> LF so replacement patterns can assume \n.
// Returns the original EOL style so writeText can restore it.
function readText(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  return { content: eol === '\r\n' ? raw.replace(/\r\n/g, '\n') : raw, eol };
}

function writeText(filePath, content, eol) {
  fs.writeFileSync(filePath, eol === '\r\n' ? content.replace(/\n/g, '\r\n') : content);
}

// Applies a list of {pattern, replacement, expectedCount, description} rules to a file.
// Fails loudly if a pattern's match count doesn't equal expectedCount.
function replaceInFile(filePath, rules, dryRun = false) {
  const { content: original, eol } = readText(filePath);
  let content = original;
  for (const { pattern, replacement, expectedCount, description } of rules) {
    const matches = content.match(pattern);
    const count = matches ? (pattern.flags.includes('g') ? matches.length : 1) : 0;
    if (count !== expectedCount) {
      fail(
        `${path.relative(REPO_ROOT, filePath)}: expected ${expectedCount} match(es) for ` +
          `"${description}", found ${count}. This script is non-idempotent and may have already been run.`,
      );
    }
    content = content.replace(pattern, replacement);
  }
  if (!dryRun) {
    writeText(filePath, content, eol);
  } else {
    console.log(`  [dry-run] Verified ${rules.length} replacement rules for ${path.relative(REPO_ROOT, filePath)}`);
  }
}

function applyReplacements(ctx) {
  const { name, displayName, description, dryRun } = ctx;

  // 1. frontend/package.json
  replaceInFile(path.join(REPO_ROOT, 'frontend', 'package.json'), [
    {
      pattern: /"name": "studio-admin"/,
      replacement: `"name": "${name}"`,
      expectedCount: 1,
      description: 'frontend package name',
    },
  ], dryRun);

  // 2. backend/package.json
  replaceInFile(path.join(REPO_ROOT, 'backend', 'package.json'), [
    {
      pattern: /"name": "@app\/backend"/,
      replacement: `"name": "@app/${name}"`,
      expectedCount: 1,
      description: 'backend package name',
    },
  ], dryRun);

  // 3. .env.example
  replaceInFile(path.join(REPO_ROOT, '.env.example'), [
    {
      pattern: /^APP_NAME=.+$/m,
      replacement: `APP_NAME=${name}`,
      expectedCount: 1,
      description: 'APP_NAME env key',
    },
  ], dryRun);

  // 4. frontend/src/config/app-config.ts
  replaceInFile(path.join(REPO_ROOT, 'frontend', 'src', 'config', 'app-config.ts'), [
    {
      pattern: /name: "Appspine App Template"/,
      replacement: `name: "${displayName}"`,
      expectedCount: 1,
      description: 'APP_CONFIG name',
    },
    {
      pattern: /copyright: `© \${currentYear}, Appspine App Template\.`/,
      replacement: `copyright: \`© \${currentYear}, ${displayName}.\``,
      expectedCount: 1,
      description: 'APP_CONFIG copyright',
    },
    {
      pattern: /title: "Appspine App Template"/,
      replacement: `title: "${displayName}"`,
      expectedCount: 1,
      description: 'APP_CONFIG meta title',
    },
    {
      pattern: /description:\s*\n?\s*"Appspine App Template is a fully customizable starter for business systems built with Next\.js 16, Tailwind CSS v4, and shadcn\/ui\."/,
      replacement: `description:\n      "${description}"`,
      expectedCount: 1,
      description: 'APP_CONFIG meta description',
    },
  ], dryRun);

  // 5. README.md (template root README)
  replaceInFile(path.join(REPO_ROOT, 'README.md'), [
    {
      pattern: /^# appspine-app-template$/m,
      replacement: `# ${name}`,
      expectedCount: 1,
      description: 'README title',
    },
  ], dryRun);

  // 6. CLAUDE.md & AGENTS.md
  replaceInFile(path.join(REPO_ROOT, 'CLAUDE.md'), [
    {
      pattern: /^# appspine-app-template — Agent Guide$/m,
      replacement: `# ${name} — Agent Guide`,
      expectedCount: 1,
      description: 'CLAUDE title',
    },
  ], dryRun);

  replaceInFile(path.join(REPO_ROOT, 'AGENTS.md'), [
    {
      pattern: /^# appspine-app-template — Agent Guide$/m,
      replacement: `# ${name} — Agent Guide`,
      expectedCount: 1,
      description: 'AGENTS title',
    },
  ], dryRun);

  // 7. docs/agent-guide.md
  replaceInFile(path.join(REPO_ROOT, 'docs', 'agent-guide.md'), [
    {
      pattern: /^# appspine-app-template — Agent Guide$/m,
      replacement: `# ${name} — Agent Guide`,
      expectedCount: 1,
      description: 'agent-guide title',
    },
    {
      pattern: /## App Positioning\n\n[\s\S]*?\n\n---/,
      replacement: `## App Positioning\n\n<!-- TODO(scaffold): Fill in the "App Positioning" description for ${name} (business domain, core module overview). -->\n\n---`,
      expectedCount: 1,
      description: 'agent-guide App Positioning placeholder',
    },
  ], dryRun);
}

function printChecklist(ctx) {
  console.log(`\n✅ App "${ctx.name}" initialized successfully!`);
  console.log('\nNext Manual Steps:');
  console.log('  1. Add your business models in "backend/prisma/schema/".');
  console.log('  2. Define the matching "Permission" enum values in "backend/prisma/schema/base.prisma".');
  console.log('  3. Run backend prisma migration to apply changes to database:');
  console.log('     pnpm -C backend prisma:migrate');
  console.log('  4. Regenerate the data dictionary documentation:');
  console.log('     pnpm -C backend schema:docs');
  console.log('  5. Fill in the "App Positioning" description inside "docs/agent-guide.md" (business domain, core module overview).');
  console.log('  6. Copy .env.example to .env and configure database parameters and JWT secrets.');
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.name || !args.displayName) {
    printUsage();
    process.exit(1);
  }

  validateName(args.name);

  const ctx = {
    name: args.name,
    displayName: args.displayName,
    description: args.description ?? args.displayName,
    dryRun: args.dryRun,
  };

  console.log(`[${args.dryRun ? 'dry-run' : 'scaffold'}] Initializing "${ctx.name}"...`);
  console.log(`  Display Name: ${ctx.displayName}`);
  console.log(`  Description: ${ctx.description}`);
  console.log('');

  applyReplacements(ctx);

  if (!ctx.dryRun) {
    printChecklist(ctx);
  } else {
    console.log('\n✅ Dry run validation passed successfully. No files were written.');
  }
}

main();
