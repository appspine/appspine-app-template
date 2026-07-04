# Development Conventions

Self-contained coding conventions for building business features in this repo. Ported from the
appspine framework's internal planning docs, trimmed to what applies to any forked business-system
repo — framework-internal conventions (how the `@appspine/*` packages themselves are versioned and
released) are out of scope here.

## Naming

- **Files**: kebab-case (e.g. `leave-request.controller.ts`)
- **Classes / Types**: PascalCase (e.g. `LeaveRequestController`)
- **Functions / variables**: camelCase (e.g. `createLeaveRequest`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g. `MAX_RETRY`)
- **Env vars**: SCREAMING_SNAKE_CASE (e.g. `DATABASE_URL`, `AUTH_MODE`)
- Never hardcode `localhost`, hosts, ports, or secrets in source — always read from env vars

## Directory Structure

```
frontend/        Next.js app (src/app, src/components, src/lib, ...)
backend/
  src/            NestJS modules, one folder per business module (e.g. src/my-module/)
  prisma/         schema/ + migrations/
  scripts/        gen-data-dictionary.ts and other dev tooling
docs/             agent-guide.md, conventions.md, data-dictionary.md (auto-generated)
e2e/              E2E tests (presence alone triggers the CI e2e job)
docker-compose.yml
```

## Lint

- Biome, one `biome.json` at the repo root covering both `frontend/` and `backend/`
- `biome check` and `tsc --noEmit` (both workspaces) must pass before every commit

## Prisma

- **Model names**: PascalCase singular (e.g. `User`)
- **Table names**: snake_case plural, via `@@map("users")`
- **Fields**: camelCase, via `@map("snake_case")`
- No cross-app foreign keys — business systems talk to each other via events/APIs, never a direct FK
  into another system's database
- Use the default Prisma Client output path — never set a custom `output`

## Comments & Documentation

- All code comments (`//`, `/* */`, JSDoc, Prisma `///`) in English; write one only when the WHY
  isn't obvious (a hidden constraint, a workaround, counter-intuitive behavior) — never restate the
  WHAT, good naming already does that
- All docs and commit messages in English
- **Prisma `///` doc comments are required** on every model and enum — they're the source of truth
  for the Metadata Schema API (`GET /metadata/schema`) and `docs/data-dictionary.md`, which is how
  AI agents and future developers understand the schema without reading migrations
- `docs/data-dictionary.md` is auto-generated via `pnpm -C backend schema:docs` — never edit by hand

## Enum / i18n

- Frontend enum option lists must come from `GET /metadata/schema`, not from hardcoded mirror arrays such as
  `const OPTIONS = [...]`.
- Enum translation keys live in the top-level `enums` namespace of each locale file, using the fixed dotted format
  `enums.<EnumName>.<VALUE>` (for example `enums.PermissionPolicy.DENY_ALL`).
- Add translations for every Prisma enum value, even if the enum is not rendered in the UI yet. Schema-first coverage
  prevents future drift.
- Enum translation drift must fail loudly before commit: if a Prisma enum value is added, removed, or renamed, update the
  `enums` keys in every locale file in the same change.
- M2M API Key `resource:action` scopes are not part of this enum translation mechanism. They are derived scopes, not raw
  Prisma enum values.

## Error Response Format

Every API error returns this shape:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "traceId": "abc-123",
  "timestamp": "2026-06-30T10:30:00Z",
  "path": "/users"
}
```

## API Design

- **Controller convention**: `@Controller(prefix)` + a class-level `@UseGuards(...)` + Zod-based DTO
  validation (`ZodValidationPipe`). Don't stack extra guards on individual methods unless that method
  genuinely needs stricter access than the class default.
- **Guard chain order**: `JwtOrApiKeyGuard` (API Key takes priority, falls back to JWT) →
  `AdminGuard` or `PermissionGuard` (pick one per endpoint) → `ScopeGuard` (constrains API-key
  callers only; JWT users are unaffected).
- **RBAC model**: `roleNames: string[]`, `permissionPolicy: DENY_ALL | READ_ALL | ALLOW_ALL`
  (coarse-grained), `permissions: Permission[]` (fine-grained, via `RolePermission`).
  `PermissionGuard` uses OR logic: ADMIN role always passes → `ALLOW_ALL` passes → `READ_ALL` and
  the requirement is only `*_READ` passes → an explicit `permissions` match passes → otherwise 403.
- **Pagination**: the shared `paginationQuerySchema` (page-based, `limit` capped at 100) plus the
  `paginate()` / `toPrismaPage()` / `toPrismaOrderBy()` / `toPrismaSortDirection()` helpers from
  `@appspine/common`. If a list needs to sort by something `toPrismaOrderBy()` can't express (e.g. a
  relation `_count`), resolve that field's `orderBy` shape locally rather than bypassing the shared
  allow-list/direction-mapping logic for the fields it can already handle.
- **RESTful routes**: standard resources expose 5 endpoints (`GET /` list, `GET /:id`, `POST /`,
  `PATCH /:id`, `DELETE /:id`). If a module also exposes an MCP tool, name it to match
  (`list_*`/`get_*`/`create_*`/`update_*`/`delete_*`) — **the framework does not auto-generate these
  tools**; the app registers them itself via `@McpTool()` (see step 3 of the CRUD module flow below).
- **No global `/api` prefix** — routes mount directly at root (`/users`, `/api-keys`, `/mcp`,
  `/metadata/schema`).

## Git / Commit Conventions

- **Trunk-based**: `main` always stays deployable; develop on short-lived branches (`feat/<desc>`,
  `fix/<desc>`, prefix matching the commit type), squash-merge PRs into `main`. No long-lived
  `develop`/`release` branches. Small changes (docs, config) may push directly to `main`.
- Commit messages follow **Conventional Commits**: `<type>(<scope>): <description>` — common types
  `feat`, `fix`, `chore`, `refactor`.
- Never use `git add -A` (stage files explicitly — avoids accidentally committing `.env` or binaries).
- Never use `--no-verify` to skip commit hooks.
- `tsc --noEmit` must pass before every commit.

## Testing

- **Business-system app** (this repo): the primary verification is the E2E golden-path regression
  suite (login, RBAC blocking unauthorized routes, M2M API Key auth) + `tsc --noEmit`/lint +
  `/code-review` + manual browser verification. Add unit tests only for genuinely complex business
  logic (non-obvious calculations, state machines, permission logic) — there's no mandated overall
  coverage number.

## Frontend Component Conventions

- Before building a form/UI control, check for an existing shadcn/ui primitive
  (`frontend/src/components/ui/`) first — never reach for a raw native HTML control
  (`<input type="date">`, `<select>`, `<input type="checkbox">`, etc.) when a shadcn equivalent
  exists. These primitives come with correct ARIA/keyboard behavior baked in; native controls are
  an easy way to end up with an inaccessible UI.
- Use shadcn's `Select` as-is for both static option lists (hardcoded constants, e.g. gender, tier)
  and dynamically-loaded ones (e.g. an API-backed role/user list) — no extra wrapper component is
  needed on top of it.
- Avoid the `useEffect(() => reset(defaultValues), [defaultValues])` pattern for populating a form:
  a re-fetch producing a new-but-equivalent `defaultValues` object reference re-runs the effect and
  clobbers whatever the user is mid-editing. Pick based on context instead:
  - Standalone edit page: gate on the loading state, then mount the form with `defaultValues` set
    once — no effect needed.
  - Dialog fed by a prop already in memory: call `reset()` inside `onOpenChange`.
  - Dialog that fetches on open: guard with an `initialized` state to avoid a re-fetch race.
- **Theming**: controlled via `data-*` attributes on `<html>` — `data-theme-mode` (light/dark),
  `data-theme-preset` (one of `brutalist`/`soft-pop`/`tangerine`), `data-font` (8 font options). The
  actual color/font definitions live in `frontend/src/app/globals.css`. Chart colors use the
  `--chart-1` through `--chart-5` CSS variables (also defined there) — don't hardcode chart colors
  in a component.
- **Icons**: use `lucide-react` for general UI icons (the shadcn/ui default). Use `simple-icons`
  (via `components/simple-icon.tsx`) only for brand/product logos — never for generic UI icons.
- **Custom component placement & when to extract**: reusable non-shadcn components live under
  `frontend/src/components/` (flat — no need for further subfolders). Extract a piece of markup
  into its own component once it's reused in ≥2 places or a single page's markup exceeds roughly 50
  lines; otherwise keep it inline in the page file. Don't extract preemptively for "might be reused
  later."
- **Promoting a component into `@appspine/frontend-shell`**: only promote a component into the
  shared package when it meets both (a) it's genuinely framework-level (auth/nav/theme chrome, not
  business-domain UI) and (b) it carries no app-specific business logic or copy. When unsure, keep
  it local — promoting too early saddles a component only one app ever needed with ongoing
  published-package versioning overhead (same caution as `dev_docs/003`'s shared-package reuse
  plan in the appspine workspace).

## Standard Flow for Adding a New CRUD Module

- Extra reminder for step 1: when a schema change adds or edits a Prisma enum, the work is not done at migration time.
  Plan the matching `/metadata/schema` consumer updates and the `enums.<EnumName>.<VALUE>` translations in the same task.
- Extra reminder for step 5: enum work is not just page-copy i18n. If step 1 changed a Prisma enum, update the `enums`
  namespace and make sure the enum i18n pre-commit check passes.

1. **Backend – Schema**: add the model/enum under `backend/prisma/schema/`, with `///` doc comments;
   stop the dev server, then run `prisma generate` / `prisma migrate dev`. To name the migration
   non-interactively, pass the flag directly after the script name —
   `pnpm -C backend prisma:migrate --name add-my-models`. Do **not** insert `--` before `--name`:
   pnpm forwards the `--` literally to Prisma, which then ignores the flag and falls back to an
   interactive name prompt (deadlocks agent/CI runs).
2. **Backend – Module**: build in order — `dto` (Zod schema) → `service`
   (`findAll`/`findOne`/`create`/`update`/`remove`) → `controller` (with guards) → `module`,
   registered in `app.module.ts`.
3. **Backend – MCP tools (optional)**: if this module should be callable by AI agents or M2M
   clients, add `@McpTool({ name, description, inputSchema, requiredScopes })` (from
   `@appspine/mcp-server`) to the service methods you want to expose, then have the module implement
   `OnModuleInit`, inject `McpToolRegistry`, and call `registerMcpToolsFromInstance(this, registry)`
   to register them. **The framework does not auto-generate these tools** — `list_*`/`get_*`/
   `create_*`/`update_*`/`delete_*` is just a suggested naming convention to mirror REST; which of
   the 5 (if any) to expose, the tool names, and `requiredScopes` (`resource:action` format, matching
   the M2M API Key scope design) are entirely up to the app to write by hand.
4. **Frontend – API**: a `server/<entity>-api.ts`-style module exporting types and CRUD functions.
5. **Frontend – i18n**: add translation keys alongside any new UI text.
6. **Frontend – Sidebar**: add the nav item and its breadcrumb mapping.
7. **Frontend – Pages**: list / new / edit pages — a standalone page when there are more than ~8
   fields, a Dialog when there are fewer.
8. **TypeScript check**: `tsc --noEmit` must pass on both `frontend/` and `backend/`.
9. **Browser verification**: golden path (create/list/edit/delete) + edge cases (empty state,
   validation errors) + regression check on nearby features.
10. **Code review**: run `/code-review`, focusing on auth guards, IDOR, N+1 queries, and sensitive
    field leaks.
11. Fix review findings, re-run typecheck.
12. **Commit & push** per the Git conventions above.
