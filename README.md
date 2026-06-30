# appspine-app-template

Combined frontend (Next.js + shadcn/ui) + backend (NestJS + Prisma) starting point for new appspine business
systems. Use GitHub's "Use this template" to create a new business system repo from this one.

See the appspine workspace `CLAUDE.md` and `dev_docs/001-app-framework-plan.md` / `dev_docs/002-app-dev-conventions.md`
for the framework plan and conventions this template follows.

## Status

This is currently a minimal skeleton:

- `frontend/` — sourced from [blank_shadcn_app](https://github.com/antonylu0826/blank_shadcn_app), unmodified.
- `backend/` — sourced from the `auranest` project's `apps/auranest-app-template/backend`, with the `sync` module
  removed and all `@auranest/backend-core` references stripped (it boots NestJS + Prisma only).

**Not yet wired**: Auth, RBAC, M2M API Key, Audit Log, Metadata Schema API, MCP Server, Health Check. These will be
added once the `@appspine/*` shared packages (github.com/appspine/appspine) exist.

## Quick Start

```bash
cp .env.example .env   # fill in DATABASE_URL etc.
pnpm install            # run inside frontend/ and backend/ separately — not a single workspace
pnpm -C backend prisma:generate
pnpm -C backend prisma:migrate
pnpm dev                 # runs backend + frontend concurrently
```
