# appspine-app-template

Combined frontend (Next.js + shadcn/ui) + backend (NestJS + Prisma) starting point for new appspine business
systems. Use GitHub's "Use this template" to create a new business system repo from this one.

See the appspine workspace `CLAUDE.md` and [001-app-framework-plan.md](https://github.com/appspine/appspine-workspace/blob/main/knowledge/decisions/001-app-framework-plan.md) / [002-app-dev-conventions.md](https://github.com/appspine/appspine-workspace/blob/main/knowledge/topics/002-app-dev-conventions.md)
for the framework plan and conventions this template follows. For agent/AI-assisted development, see [docs/agent-guide.md](docs/agent-guide.md).

## What's included

- **Frontend** — [blank_shadcn_app](https://github.com/antonylu0826/blank_shadcn_app) (Next.js + Tailwind CSS + shadcn/ui),
  running on port 3901.
- **Backend** — NestJS + Prisma, running on port 3900, with the following `@appspine/*` packages pre-wired:
  - Auth: OIDC-only (Keycloak) — local email/password auth is retired (https://github.com/appspine/appspine-workspace/blob/main/knowledge/decisions/035-oidc-only-auth-plan.md); identity
    comes from the external IdP, RBAC grants stay local
  - RBAC: role/permission management, `AdminGuard`, `PermissionGuard`, `RequirePermissions` decorator
  - M2M API Key: `ApiKeyGuard`, `JwtOrApiKeyGuard`, `ScopeGuard`, `@Scopes()` decorator, rate limiting
  - Audit Log: local `AuditLog` table writes via `AuditLogService`
  - Health Check: `GET /health` (Terminus + Prisma ping)
  - Metadata Schema API: `GET /metadata/schema` (DMMF-derived, M2M API Key `metadata:read` scope)
  - MCP Server: `POST /mcp` (Streamable HTTP, M2M API Key auth, app registers its own tools via `@McpTool`)

## API

<!-- TODO(scaffold): Document this app's own REST API surface here as you build it out — one table per
     domain area, grouped the way `docs/conventions.md`'s CRUD flow groups modules. Note any guard
     requirements that differ from the standard `JwtOrApiKeyGuard` + `PermissionGuard` (+ `ScopeGuard`
     for API-key callers) chain. See the wiki app's README (github.com/appspine/wiki) for a worked
     example of this section once it's filled in. -->

## MCP tools

<!-- TODO(scaffold): If this app registers custom `@McpTool`s (see docs/conventions.md's "Standard Flow
     for Adding a New CRUD Module", step 3), document them here as a table: tool name | required scope |
     purpose. Note the fail-closed behavior for write tools (calling API key must have a bound
     `actingUserId`) and that MCP tool-execution errors surface as `isError:true` in the JSON-RPC result,
     not as an HTTP error status — this trips people up when they test with curl expecting a 403.
     Delete this section entirely if the app exposes no tools beyond the framework's built-ins. -->

## Quick Start

### 1. Prerequisites

- **Node.js** 22+ and **pnpm** 11+
- **Docker** (for the local Postgres)
- **GitHub Packages access** — a GitHub Personal Access Token (classic) with the `read:packages` scope and
  membership in the `appspine` org. The `@appspine/*` packages this template depends on are private packages
  published to `npm.pkg.github.com`; see step 4 below.

### 2. Start the local database

```bash
docker compose up -d db
```

Postgres will be available at `localhost:23900`. Data is persisted in the `db_data` volume across restarts.

### 3. Configure environment

```bash
cp .env.example .env
```

Most defaults work out of the box against the shared dev Keycloak (`dev-infra/README.md`), but `AUTH_SECRET`,
`AUTH_KEYCLOAK_ID`, `AUTH_KEYCLOAK_SECRET`, and `OIDC_AUDIENCE` ship as literal placeholders (`<client-id>` /
`<client-secret>` / `<generate with npx auth secret>`) — fill them in before `pnpm dev`:

```bash
npx auth secret   # prints a value for AUTH_SECRET
```

Set `OIDC_AUDIENCE` and `AUTH_KEYCLOAK_ID` to this app's client ID and `AUTH_KEYCLOAK_SECRET` to its client
secret — for the shared dev Keycloak, register a client following `dev-infra/README.md` "Adding a 10th app"
(client ID = this app's folder name, secret = `dev-secret-<client-id>` by dev-infra's own convention).
Skipping any of these makes next-auth throw `MissingSecret` on your first login attempt.

### 4. Authenticate to GitHub Packages

`.npmrc` reads the registry token from the `GITHUB_TOKEN` environment variable. Export it before installing:

```bash
export GITHUB_TOKEN=<your PAT with read:packages scope>
```

Add this to your shell profile so it persists across sessions.

> **If `pnpm install` still returns `403 Forbidden`**: some environments don't expand `${GITHUB_TOKEN}`
> from a committed project `.npmrc`. Set the token in pnpm's own config instead:
> `pnpm config set "//npm.pkg.github.com/:_authToken" <PAT>`. A `preinstall` check
> (`scripts/check-registry-auth.mjs`) fails fast with these instructions when neither is configured.

### 5. Install dependencies

```bash
pnpm install
```

### 6. First-time database setup

```bash
pnpm -C backend prisma:migrate   # applies the committed migration
pnpm -C backend prisma:seed      # creates ADMIN + USER system roles and a seed admin account
```

> **Note**: local auth is retired (https://github.com/appspine/appspine-workspace/blob/main/knowledge/decisions/035-oidc-only-auth-plan.md) — the IdP handles authentication.
> With the `.env.example` defaults, `SEED_USER_EMAIL` is pre-assigned ADMIN and has no password;
> it is matched locally by email against the OIDC identity on first login.

### 7. Start the dev servers

```bash
pnpm dev
```

This runs both servers concurrently with hot-reload:

| Service | URL |
|---|---|
| Backend (NestJS) | http://localhost:3900 |
| Frontend (Next.js) | http://localhost:3901 |

### 8. Verify

```bash
curl http://localhost:3900/health
# → {"status":"ok","info":{"database":{"status":"up"}},...}
```

## Daily workflow

```bash
docker compose up -d db   # if not already running
pnpm dev
```

## Adding a new CRUD module

See [docs/conventions.md](docs/conventions.md#standard-flow-for-adding-a-new-crud-module) for the standard CRUD module flow.

## Forking this template

### Day 0 — initial setup

1. Use GitHub's "Use this template" to create your new business system repo.
2. **Always pass `--db-port`/`--backend-port`/`--frontend-port`.** Every fork defaults to the same
   23900/3900/3901 this template itself uses — skip the flags and your app silently collides with the
   template checkout (or any other fork that also skipped them) the moment both try to run locally. Check
   the workspace's `docs/agent-guide.md` "Local Dev Ports" table for ports already claimed by other apps,
   pick an unused block, and add a row for your app in the same commit:
   ```bash
   node scripts/scaffold-init.mjs --name <your-app-name> --display-name "<Your App Display Name>" \
     --db-port <unused-2xxxx> --backend-port <unused-3xxx> --frontend-port <unused-3xxx+1>
   ```
   This also updates the application name, environment configuration, headers, and metadata configs.
   The port flags update `.env.example`, `DATABASE_URL`, CORS, `NEXT_PUBLIC_API_URL`, the frontend dev
   script, and this README's Quick Start port mentions together (Postgres line, dev-server table, health
   check curl). If you ever change ports again *after* scaffold-init, those README mentions go back to
   being manual fix-ups.
3. In the new repo's GitHub settings, add a `PACKAGES_READ_TOKEN` Actions secret (a PAT with
   `read:packages` scope) — the E2E workflow authenticates to GitHub Packages with it, and the very first
   PR's CI fails without it.
4. Register a Keycloak client for the fork and fill in the OIDC/next-auth env vars — this template's
   `.env.example` ships them as literal placeholders, and skipping this makes next-auth throw
   `MissingSecret` at your very first login attempt:
   - Generate `AUTH_SECRET` with `npx auth secret`.
   - Register a client (client ID = your app's folder name, secret = `dev-secret-<client-id>` on the
     shared dev Keycloak) following `dev-infra/README.md` "Adding a 10th app", then set `OIDC_AUDIENCE`
     and `AUTH_KEYCLOAK_ID` to the client ID and `AUTH_KEYCLOAK_SECRET` to its secret.
   - Also update `e2e/test-env.ts`'s `E2E_KEYCLOAK_CLIENT_ID`/`E2E_KEYCLOAK_CLIENT_SECRET` fallback
     defaults (see the `FORK REQUIREMENT` comment there) — `scripts/scaffold-init.mjs` rewrites these to
     match your app's name automatically, but verify them if you registered a differently-named client.
5. Add your own Prisma models to `backend/prisma/schema/` and define the matching `Permission` enum values
   in `backend/prisma/schema/base.prisma`.
6. Fill in `USER_DEFAULT_PERMISSIONS` in `backend/prisma/seed.ts` with the grants a normal user needs
   (then re-run `prisma:seed`). Until you do, a freshly registered user gets 403 on every
   permission-guarded endpoint — the app works for the seeded ADMIN only.
7. Run `pnpm -C backend prisma:migrate --name init-domain-models` to generate a migration for your new
   schema (pass `--name` directly after the script name — inserting `--` first makes Prisma fall back to
   an interactive prompt).

### Before you ship — documentation checklist

This template's own docs are all placeholders (`README.md` still reads like a template, `docs/agent-guide.md`
has a literal `App Positioning` TODO). None of this is regenerated automatically as you build — go through
this list once your domain model and API surface have stabilized, and again before each major feature adds
new endpoints/tools:

- [ ] **`README.md`** — replace the generic "What's included" framing with what your app actually does
  (a couple of sentences on the domain, a bullet list of core entities). Fill in the `## API` and
  `## MCP tools` placeholder sections added above with real endpoint/tool tables — delete `## MCP tools`
  entirely if you never call `@McpTool`. Verify the port/URL mentions in `## Quick Start` — scaffold-init
  rewrites them at fork time, but any port change made by hand afterwards is yours to propagate.
- [ ] **`docs/agent-guide.md`** — fill in the `## App Positioning` section (business domain, core modules).
  This is what an agent reads first when picking up work in your fork; a TODO there means every session
  starts context-blind.
- [ ] **`docs/data-dictionary.md`** — regenerate with `pnpm -C backend schema:docs` after every schema
  change, not just once at fork time. It's auto-generated but not auto-*run*.
- [ ] **Workspace `docs/agent-guide.md` "Local Dev Ports" table** — if you changed any port after the
  initial fork (a later collision, a new local app needing the block you picked), update your app's row
  there too, not just your own `.env`/`.env.example`/`README.md`. This table is the only cross-app source
  of truth — if it's stale, the next fork picks a port you're already using.
- [ ] **This "Forking this template" section** — once your app is a live business system rather than
  something meant to be re-forked, either delete this whole section or repoint step 2's example command
  at your own app's conventions. Leaving generic scaffold instructions in a production app's README reads
  as unmaintained.

See the `wiki` app (github.com/appspine/wiki) for a forked repo that's been through this checklist —
its README/agent-guide/data-dictionary are a reference example of the "done" state.
