# appspine-app-template

Combined frontend (Next.js + shadcn/ui) + backend (NestJS + Prisma) starting point for new appspine business
systems. Use GitHub's "Use this template" to create a new business system repo from this one.

See the appspine workspace `CLAUDE.md` and `dev_docs/001-app-framework-plan.md` / `dev_docs/002-app-dev-conventions.md`
for the framework plan and conventions this template follows. For agent/AI-assisted development, see [docs/agent-guide.md](docs/agent-guide.md).

## What's included

- **Frontend** — [blank_shadcn_app](https://github.com/antonylu0826/blank_shadcn_app) (Next.js + Tailwind CSS + shadcn/ui),
  running on port 3901.
- **Backend** — NestJS + Prisma, running on port 3900, with the following `@appspine/*` packages pre-wired:
  - Auth: local (bcrypt + HS256 JWT) and OIDC (Keycloak) — controlled by `AUTH_MODE` env var
  - RBAC: role/permission management, `AdminGuard`, `PermissionGuard`, `RequirePermissions` decorator
  - M2M API Key: `ApiKeyGuard`, `JwtOrApiKeyGuard`, `ScopeGuard`, `@Scopes()` decorator, rate limiting
  - Audit Log: local `AuditLog` table writes via `AuditLogService`
  - Health Check: `GET /health` (Terminus + Prisma ping)
  - Metadata Schema API: `GET /metadata/schema` (DMMF-derived, M2M API Key `metadata:read` scope)
  - MCP Server: `POST /mcp` (Streamable HTTP, M2M API Key auth, app registers its own tools via `@McpTool`)

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

For local development the defaults work out of the box. Change `JWT_SECRET` before deploying to any shared
environment.

### 4. Authenticate to GitHub Packages

`.npmrc` reads the registry token from the `GITHUB_TOKEN` environment variable. Export it before installing:

```bash
export GITHUB_TOKEN=<your PAT with read:packages scope>
```

Add this to your shell profile so it persists across sessions.

### 5. Install dependencies

```bash
pnpm install
```

### 6. First-time database setup

```bash
pnpm -C backend prisma:migrate   # applies the committed migration
pnpm -C backend prisma:seed      # creates ADMIN + USER system roles and a seed admin account
```

> **Note**: the seeded admin account (`SEED_USER_EMAIL` in `.env`) is created without a password — it's intended
> for OIDC mode where the IdP handles authentication. In `AUTH_MODE=local`, create your first real account via
> `POST /auth/register`, then promote it to ADMIN by assigning the ADMIN role in the database (e.g. via
> `prisma:studio`).

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

1. Use GitHub's "Use this template" to create your new business system repo.
2. Initialize the application using the scaffold script:
   ```bash
   node scripts/scaffold-init.mjs --name <your-app-name> --display-name "<Your App Display Name>"
   ```
   This automatically updates the application name, environment configuration, headers, and metadata configs.
3. Add your own Prisma models to `backend/prisma/schema/` and define the matching `Permission` enum values
   in `backend/prisma/schema/base.prisma`.
4. Run `pnpm -C backend prisma:migrate` to generate a migration for your new schema.
5. Run `pnpm -C backend schema:docs` to regenerate `docs/data-dictionary.md`.
6. Fill in the "App Positioning" description inside `docs/agent-guide.md` to describe the business domain.
