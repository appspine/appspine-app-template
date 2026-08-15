#!/usr/bin/env node
// Automatically initializes a new business system forked from appspine-app-template.
// Usage: node scripts/scaffold-init.mjs --name <kebab-case> --display-name "<Display Name>" [--description "<Description>"] [--db-port <port>] [--backend-port <port>] [--frontend-port <port>] [--dry-run]

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

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
  --db-port           Host port for Postgres. Defaults to 23900.
  --backend-port      Host port for the Nest backend. Defaults to 3900.
  --frontend-port     Host port for the Next.js frontend. Defaults to 3901.
  --dry-run           Verify all rules and output replacement plan without writing files
`);
}

function parseArgs(argv) {
  const args = {
    name: null,
    displayName: null,
    description: null,
    dbPort: "23900",
    backendPort: "3900",
    frontendPort: "3901",
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--name":
        args.name = argv[++i];
        break;
      case "--display-name":
        args.displayName = argv[++i];
        break;
      case "--description":
        args.description = argv[++i];
        break;
      case "--db-port":
        args.dbPort = argv[++i];
        break;
      case "--backend-port":
        args.backendPort = argv[++i];
        break;
      case "--frontend-port":
        args.frontendPort = argv[++i];
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("--")) fail(`Unknown flag: ${arg}`);
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

function validateDisplayText(value, flagName) {
  if (!/^[\w\s.,'()&-]{1,80}$/.test(value)) {
    fail(
      `${flagName} contains characters outside the allowed set (letters, numbers, spaces, ` +
        `.,'()&-, max 80 chars): "${value}"`,
    );
  }
}

function validatePort(value, flagName) {
  if (!/^\d+$/.test(value)) {
    fail(`${flagName} must be a numeric TCP port.`);
  }
  const port = Number(value);
  if (port < 1 || port > 65535) {
    fail(`${flagName} must be between 1 and 65535.`);
  }
}

function validatePorts(args) {
  validatePort(args.dbPort, "--db-port");
  validatePort(args.backendPort, "--backend-port");
  validatePort(args.frontendPort, "--frontend-port");

  const ports = [args.dbPort, args.backendPort, args.frontendPort];
  if (new Set(ports).size !== ports.length) {
    fail("--db-port, --backend-port, and --frontend-port must be distinct.");
  }
}

// Reads a file, normalizing CRLF -> LF so replacement patterns can assume \n.
// Returns the original EOL style so writeText can restore it.
function readText(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return { content: eol === "\r\n" ? raw.replace(/\r\n/g, "\n") : raw, eol };
}

function writeText(filePath, content, eol) {
  fs.writeFileSync(filePath, eol === "\r\n" ? content.replace(/\n/g, "\r\n") : content);
}

// Applies a list of {pattern, replacement, expectedCount, description} rules to a file.
// Fails loudly if a pattern's match count doesn't equal expectedCount.
function replaceInFile(filePath, rules, dryRun = false) {
  const { content: original, eol } = readText(filePath);
  let content = original;
  for (const { pattern, replacement, expectedCount, description } of rules) {
    const matches = content.match(pattern);
    const count = matches ? (pattern.flags.includes("g") ? matches.length : 1) : 0;
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
  const { name, displayName, description, dbPort, backendPort, frontendPort, dryRun } = ctx;
  // Generated fresh per fork so every downstream app gets its own dev-database credential
  // instead of inheriting the template's literal placeholder.
  const dbPassword = crypto.randomBytes(16).toString("hex");

  // 1. frontend/package.json
  replaceInFile(
    path.join(REPO_ROOT, "frontend", "package.json"),
    [
      {
        pattern: /"name": "studio-admin"/,
        replacement: `"name": "${name}"`,
        expectedCount: 1,
        description: "frontend package name",
      },
    ],
    dryRun,
  );

  // 2. backend/package.json
  replaceInFile(
    path.join(REPO_ROOT, "backend", "package.json"),
    [
      {
        pattern: /"name": "@app\/backend"/,
        replacement: `"name": "@app/${name}"`,
        expectedCount: 1,
        description: "backend package name",
      },
    ],
    dryRun,
  );

  // 3. .env.example
  replaceInFile(
    path.join(REPO_ROOT, ".env.example"),
    [
      {
        pattern: /^APP_NAME=.+$/m,
        replacement: `APP_NAME=${name}`,
        expectedCount: 1,
        description: "APP_NAME env key",
      },
      {
        pattern: /^DB_PORT=.+$/m,
        replacement: `DB_PORT=${dbPort}`,
        expectedCount: 1,
        description: "DB_PORT env key",
      },
      {
        pattern: /^POSTGRES_PASSWORD='<set-a-strong-password>'$/m,
        replacement: `POSTGRES_PASSWORD='${dbPassword}'`,
        expectedCount: 1,
        description: "POSTGRES_PASSWORD env key",
      },
      {
        pattern: /^DATABASE_URL='postgresql:\/\/postgres:<set-a-strong-password>@localhost:\d+\/app_db'$/m,
        replacement: `DATABASE_URL='postgresql://postgres:${dbPassword}@localhost:${dbPort}/app_db'`,
        expectedCount: 1,
        description: "DATABASE_URL env key",
      },
      {
        pattern: /^CORS_ORIGINS=http:\/\/localhost:\d+$/m,
        replacement: `CORS_ORIGINS=http://localhost:${frontendPort}`,
        expectedCount: 1,
        description: "CORS_ORIGINS env key",
      },
      {
        pattern: /^PORT=.+$/m,
        replacement: `PORT=${backendPort}`,
        expectedCount: 1,
        description: "PORT env key",
      },
      {
        pattern: /^BACKEND_PORT=.+$/m,
        replacement: `BACKEND_PORT=${backendPort}`,
        expectedCount: 1,
        description: "BACKEND_PORT env key",
      },
      {
        pattern: /^FRONTEND_PORT=.+$/m,
        replacement: `FRONTEND_PORT=${frontendPort}`,
        expectedCount: 1,
        description: "FRONTEND_PORT env key",
      },
      {
        pattern: /^NEXT_PUBLIC_API_URL=http:\/\/localhost:\d+$/m,
        replacement: `NEXT_PUBLIC_API_URL=http://localhost:${backendPort}`,
        expectedCount: 1,
        description: "NEXT_PUBLIC_API_URL env key",
      },
    ],
    dryRun,
  );

  // 4. frontend/src/config/app-config.ts
  replaceInFile(
    path.join(REPO_ROOT, "frontend", "src", "config", "app-config.ts"),
    [
      {
        pattern: /name: "Appspine App Template"/,
        replacement: `name: "${displayName}"`,
        expectedCount: 1,
        description: "APP_CONFIG name",
      },
      {
        pattern: /copyright: `© \${currentYear}, Appspine App Template\.`/,
        replacement: `copyright: \`© \${currentYear}, ${displayName}.\``,
        expectedCount: 1,
        description: "APP_CONFIG copyright",
      },
      {
        pattern: /title: "Appspine App Template"/,
        replacement: `title: "${displayName}"`,
        expectedCount: 1,
        description: "APP_CONFIG meta title",
      },
      {
        pattern:
          /description:\s*\n?\s*"Appspine App Template is a fully customizable starter for business systems built with Next\.js 16, Tailwind CSS v4, and shadcn\/ui\."/,
        replacement: `description:\n      "${description}"`,
        expectedCount: 1,
        description: "APP_CONFIG meta description",
      },
    ],
    dryRun,
  );

  // 4b. frontend/package.json dev port
  replaceInFile(
    path.join(REPO_ROOT, "frontend", "package.json"),
    [
      {
        pattern: /"dev": "dotenv -e \.\.\/\.env -- next dev -p \d+"/,
        replacement: `"dev": "dotenv -e ../.env -- next dev -p ${frontendPort}"`,
        expectedCount: 1,
        description: "frontend dev server port",
      },
    ],
    dryRun,
  );

  // 5. README.md (template root README) — title plus every hardcoded port/URL in the prose,
  // so Quick Start stays correct without the manual fix-ups the fork checklist used to require.
  replaceInFile(
    path.join(REPO_ROOT, "README.md"),
    [
      {
        pattern: /^# appspine-app-template$/m,
        replacement: `# ${name}`,
        expectedCount: 1,
        description: "README title",
      },
      {
        pattern: /Postgres will be available at `localhost:\d+`/,
        replacement: `Postgres will be available at \`localhost:${dbPort}\``,
        expectedCount: 1,
        description: "README Quick Start Postgres port",
      },
      {
        pattern: /\| Backend \(NestJS\) \| http:\/\/localhost:\d+ \|/,
        replacement: `| Backend (NestJS) | http://localhost:${backendPort} |`,
        expectedCount: 1,
        description: "README dev server table backend URL",
      },
      {
        pattern: /\| Frontend \(Next\.js\) \| http:\/\/localhost:\d+ \|/,
        replacement: `| Frontend (Next.js) | http://localhost:${frontendPort} |`,
        expectedCount: 1,
        description: "README dev server table frontend URL",
      },
      {
        pattern: /curl http:\/\/localhost:\d+\/health/,
        replacement: `curl http://localhost:${backendPort}/health`,
        expectedCount: 1,
        description: "README health check curl URL",
      },
    ],
    dryRun,
  );

  // 6. CLAUDE.md & AGENTS.md
  replaceInFile(
    path.join(REPO_ROOT, "CLAUDE.md"),
    [
      {
        pattern: /^# appspine-app-template — Agent Guide$/m,
        replacement: `# ${name} — Agent Guide`,
        expectedCount: 1,
        description: "CLAUDE title",
      },
    ],
    dryRun,
  );

  replaceInFile(
    path.join(REPO_ROOT, "AGENTS.md"),
    [
      {
        pattern: /^# appspine-app-template — Agent Guide$/m,
        replacement: `# ${name} — Agent Guide`,
        expectedCount: 1,
        description: "AGENTS title",
      },
    ],
    dryRun,
  );

  // 7b. e2e/test-env.ts — Keycloak client fallback defaults (only used if
  // E2E_KEYCLOAK_CLIENT_ID/_SECRET aren't set). dev-infra's own convention (dev-infra/README.md
  // "Adding a 10th app") is client ID = app folder name, secret = `dev-secret-<client-id>` — so
  // this is derivable at scaffold time for the common case of registering a new client on the
  // shared dev Keycloak. Still verify manually if you registered a differently-named client.
  replaceInFile(
    path.join(REPO_ROOT, "e2e", "test-env.ts"),
    [
      {
        pattern: /readOptionalEnv\("E2E_KEYCLOAK_CLIENT_ID", "template"\)/,
        replacement: `readOptionalEnv("E2E_KEYCLOAK_CLIENT_ID", "${name}")`,
        expectedCount: 1,
        description: "E2E_KEYCLOAK_CLIENT_ID fallback",
      },
      {
        pattern: /readOptionalEnv\("E2E_KEYCLOAK_CLIENT_SECRET", "dev-secret-template"\)/,
        replacement: `readOptionalEnv("E2E_KEYCLOAK_CLIENT_SECRET", "dev-secret-${name}")`,
        expectedCount: 1,
        description: "E2E_KEYCLOAK_CLIENT_SECRET fallback",
      },
    ],
    dryRun,
  );

  // Notification API scopes ("notifications:read/write") are intentionally NOT rewritten per
  // fork: they're table-derived (matching @@map("notifications") and @appspine/metadata-schema's
  // MetaService.deriveScopes(), which keys the API-key admin UI's grantable scope list off the
  // Prisma db table name), the same convention every other module in this template already uses.
  // An app-name prefix would just recreate the catalog mismatch this naming was changed to avoid.

  // 7. docs/agent-guide.md
  replaceInFile(
    path.join(REPO_ROOT, "docs", "agent-guide.md"),
    [
      {
        pattern: /^# appspine-app-template — Agent Guide$/m,
        replacement: `# ${name} — Agent Guide`,
        expectedCount: 1,
        description: "agent-guide title",
      },
      {
        // Bounded by the NEXT "## " heading, not by the next "---" rule. The "---" nearest to
        // App Positioning sits at the very end of the document, so an "up to ---" match swallowed
        // every section in between (notably "## Shared notifications") and every fork silently
        // lost that documentation.
        pattern: /## App Positioning\n\n[\s\S]*?\n\n(?=## )/,
        replacement: `## App Positioning\n\n<!-- TODO(scaffold): Fill in the "App Positioning" description for ${name} (business domain, core module overview). -->\n\n`,
        expectedCount: 1,
        description: "agent-guide App Positioning placeholder",
      },
    ],
    dryRun,
  );
}

function printChecklist(ctx) {
  console.log(`\n✅ App "${ctx.name}" initialized successfully!`);
  console.log("\nNext Manual Steps:");
  console.log('  1. Add your business models in "backend/prisma/schema/".');
  console.log('  2. Define the matching "Permission" enum values in "backend/prisma/schema/base.prisma".');
  console.log('  3. Fill in USER_DEFAULT_PERMISSIONS in "backend/prisma/seed.ts" — until you do,');
  console.log("     freshly registered users get 403 on every permission-guarded endpoint.");
  console.log("  4. Run backend prisma migration to apply changes to database:");
  console.log("     pnpm -C backend prisma:migrate --name init-domain-models");
  console.log("  5. Regenerate the data dictionary documentation:");
  console.log("     pnpm -C backend schema:docs");
  console.log(
    '  6. Fill in the "App Positioning" description inside "docs/agent-guide.md" (business domain, core module overview).',
  );
  console.log("  7. Copy .env.example to .env and configure database parameters, ports, and");
  console.log("     OIDC_JWKS_URL/OIDC_ISSUER/OIDC_AUDIENCE for the shared dev Keycloak (dev-infra/README.md).");
  console.log("  7b. Also fill in AUTH_SECRET (npx auth secret), AUTH_KEYCLOAK_ID, AUTH_KEYCLOAK_SECRET, and");
  console.log("      AUTH_KEYCLOAK_ISSUER for next-auth — these ship as placeholders and next-auth throws");
  console.log('      MissingSecret on first login if left unset (README "Forking this template" step 4).');
  console.log("  8. Add a PACKAGES_READ_TOKEN Actions secret (PAT with read:packages) to the new GitHub repo,");
  console.log("     or the E2E workflow fails on its first run.");
  console.log('  9. Register the ports in the appspine workspace docs/agent-guide.md "Local Dev Ports" table:');
  console.log(`     | \`${ctx.name}\` | ${ctx.dbPort} | ${ctx.backendPort} | ${ctx.frontendPort} |`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.name || !args.displayName) {
    printUsage();
    process.exit(1);
  }

  validateName(args.name);
  validateDisplayText(args.displayName, "--display-name");
  if (args.description) validateDisplayText(args.description, "--description");
  validatePorts(args);

  const ctx = {
    name: args.name,
    displayName: args.displayName,
    description: args.description ?? args.displayName,
    dbPort: args.dbPort,
    backendPort: args.backendPort,
    frontendPort: args.frontendPort,
    dryRun: args.dryRun,
  };

  console.log(`[${args.dryRun ? "dry-run" : "scaffold"}] Initializing "${ctx.name}"...`);
  console.log(`  Display Name: ${ctx.displayName}`);
  console.log(`  Description: ${ctx.description}`);
  console.log(`  DB Port: ${ctx.dbPort}`);
  console.log(`  Backend Port: ${ctx.backendPort}`);
  console.log(`  Frontend Port: ${ctx.frontendPort}`);
  console.log("");

  applyReplacements(ctx);

  if (!ctx.dryRun) {
    printChecklist(ctx);
  } else {
    console.log("\n✅ Dry run validation passed successfully. No files were written.");
  }
}

main();
