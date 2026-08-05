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
  into another system's database. This applies to `apps/master-data` too: reference
  them by stable id and store a display snapshot, don't FK into their database.
- Use the default Prisma Client output path — never set a custom `output`
- **`User.employeeNumber`**: cross-app link key to `apps/master-data`'s canonical person record. Nullable —
  most apps won't populate or use it unless they need org context (department, manager chain,
  delegation). Don't remove it even if unused. See "Consuming apps/master-data" below for how to actually use it.

## Consuming apps/master-data

`apps/master-data` owns the canonical "who works where, who reports to whom" data — organization
units, employee profiles, delegations. If your app needs any of that (department, manager chain,
proxy delegation), consume master-data through one of the two supported patterns below. Do not
rebuild org tables locally as a writable source of truth.

- **Link key, not a DB relation**: `apps/master-data` identifies people by a unique `employeeNumber`. Your
  app's local `User` model already has an `employeeNumber` column (see above) — populate it for any
  account that needs org context, then look `apps/master-data` up by that value. Never a cross-DB foreign key
  (see "No cross-app foreign keys" above).
- **Auth is a scoped M2M API Key, never a JWT/human login**: your backend calls `apps/master-data` as a
  service, not as an impersonated admin. Create a dedicated M2M API Key in `apps/master-data` with only the
  read (or write, for delegation management) scopes you actually need, store it in your own `.env`
  (e.g. `ORG_APP_BASE_URL`/`ORG_APP_API_KEY`), and send it via the `x-api-key` header. Logging in with
  `apps/master-data`'s admin credentials from your app's runtime code is a real security regression that's
  already been made and fixed once — don't reintroduce it.
- **`apps/master-data` returns facts, not decisions — the selection logic is yours**: the org-chain endpoint
  (an employee's ancestor org-unit chain) returns the raw chain — each unit's level and head, head
  possibly `null` — and deliberately does not pick a "manager" for you. Which ancestor level counts as
  an escalation checkpoint, how you handle a headless unit, self-approval, or a resolved person with no
  local account in your own app — that's your app's own business rule, reconstructed on your side. This
  design was arrived at after real bugs from baking selection logic into the wrong layer; don't move it
  back into `apps/master-data` or copy someone else's selection logic assuming it fits your rules too.
- **Snapshot org context at decision time**: once your app makes a decision based on `apps/master-data` data
  (e.g. computing an approval route), store a display snapshot (name, org unit name) alongside the
  stable id on your own records. A later org rename or reorg shouldn't rewrite what a past decision was
  based on.
- **Use Sync/Cache mirrors for browsing and filters**: if your app needs fast local reads for org
  browsing, dropdowns, or filters, define local `*Mirror` tables and consume
  `@appspine/master-data-client`. Mirror tables are read-only caches maintained by webhooks plus
  reconciliation; they have `sourceId`, `seq`, `syncedAt`, display fields, and hard-delete semantics.
  They do not replace snapshots on historical business records.
- **Two different failure modes for two different situations — don't default to one everywhere**:
  - A read that's incidental to just *viewing* your own data (e.g. "list my delegations") should
    degrade gracefully — no `employeeNumber` bound yet, or `apps/master-data` briefly unreachable, means
    "no result" or the last mirrored state, not a hard error. Nobody should see a broken page just because
    they haven't been linked into master-data yet.
  - A read that's load-bearing for a business decision (e.g. computing who approves a request) should
    fail loudly instead — silently falling back to a stale local cache or a fabricated default route is
    a worse outcome than a rejected submission, because the person shown as "having approved" it may not
    actually have been notified, or the ordering to the correct final approver may be structurally
    incorrect (skipping intermediate approvers), not merely stale.
  Conflating these two (making a view crash, or making a business decision silently degrade) is a real
  bug class already found once — think about which situation you're in before picking a failure mode.

## Third-Party Credential Storage

If a module needs to store a credential for calling *another* system (an API key, an OAuth
token, an LLM provider key — not this app's own M2M API Keys, which are hashed one-way for
verification and never need to be read back): only the operational UX is borrowed from the M2M
API Key convention, the storage mechanism itself is different because a third-party credential
must be recoverable to actually use it, while an M2M key never is.

- **Application-layer encryption**: encrypt the credential at rest with a master key before
  storing it — never store it in plaintext. The master key comes from an env var at deploy time;
  don't introduce a KMS or other new infrastructure unless there's a concrete need for it.
- **Plaintext shown once**: same UX as M2M API Keys — show the plaintext value only at creation
  time, mask it afterward (e.g. last few characters).
- **Rotation**: support the old and new value coexisting for a period, to allow zero-downtime
  rotation — same as M2M API Keys.
- **Master-key rotation** (re-encrypting every stored credential) is a rare, high-risk
  operational task, not a self-service feature — document it as a runbook, run it only when
  actually needed.

## Discovery Service Catalog Push

Source: `dev_docs/023-external-interconnect-agent-team-plan.md` §2.1 (workspace root), T-9700.
To let external integrators (n8n, AI agents) find this app through the 023 discovery service,
set three env vars in `.env`/`.env.example` — `@appspine/mcp-server`'s `DiscoveryPushService`
pushes the catalog automatically on boot, no other code needed:

- `DISCOVERY_PUSH_URL`: the discovery service's base URL.
- `DISCOVERY_PUSH_TOKEN`: a per-app push token, minted once by a discovery-service admin via
  `POST /discovery/apps` (shown in plaintext only at registration time). **Only put the real
  value in your local, gitignored `.env` — leave `.env.example` blank.**
- `PUBLIC_BASE_URL`: this app's own externally-reachable base URL. `mcpEndpointUrl` and
  `metadataEndpointUrl` are derived from it as `<PUBLIC_BASE_URL>/mcp` and
  `<PUBLIC_BASE_URL>/metadata/schema`.

Leaving any of the three unset disables the push entirely (opt-in, no effect on existing
behavior). A failed push only logs a warning — the discovery catalog is a convenience
directory, not something this app's own requests should ever depend on. The push runs once, at
`OnApplicationBootstrap` — not on a schedule, since a deploy already restarts the process,
which is the cadence 023 §2.1 calls for.

## Domain Events

Source: `dev_docs/026-domain-events-approve-plan.md`, `dev_docs/028-domain-events-standardization-plan.md`,
and `dev_docs/future_plans/Z20-domain-events-outbox.md` (workspace root). `@appspine/domain-events`
is already wired into this template (`backend/src/domain-events/domain-events.module.ts`, imported
into `AppModule`, plus `DomainEventsAdminModule.forRoot(DomainEventsModule)` exposing
`GET /domain-events/catalog` and the rest of the admin API) but the handler registry starts empty
— see [domain-events.md](domain-events.md) for a full walkthrough of adding your first event. It's
an **opt-in pattern**, not something every module needs:

- Use it only for **derived** side effects (webhooks, cross-system notifications, future workflow
  signals) that must be reliably delivered (retry/dead-letter) but don't need to block the
  request. Keep anything that must be strictly synchronous with the write — version locks, other
  writes that must succeed or fail together — in the same transaction, not behind an event.
- `DomainEventsService.record(tx, input)` must be called inside the **same transaction** as the
  business write it describes — that's the one rule that isn't negotiable.
- Handlers run at-least-once; **key any external side effect off the event's id** so re-running a
  handler after a retry or stale-lock reclaim is safe.
- Simple outbound POST webhooks should call `postDomainEventWebhook()` from
  `@appspine/domain-events`; do not duplicate redaction, HMAC signing, timeout, or response-drain
  helpers in app code.
- Event type constants are `as const` objects, never free-form strings — a typo silently breaks a
  subscription match.
- **File layout**: event constants in `backend/src/domain-events/events.ts`, one handler class per
  `backend/src/domain-events/handlers/<name>.handler.ts`, and `domain-events.module.ts` is the only
  file allowed to call `registerDomainEventSubscribers()`/`registry.on()`/`registerPrefix()`/
  `registerHandlerKeyContributor()`.
- **Handlers are decorated**: `@Injectable() @DomainEventSubscriber({ key, eventType, description })`
  on the class, registered via `registerDomainEventSubscribers([handler, ...], registry)` in the
  module's `DomainEventRegistry` factory. `description` is required (empty string throws at boot)
  and shows up in the admin catalog view. The one exception is admin-configured routing (e.g.
  approve's webhook-subscription table) resolved via `registerPrefix()` — that handler is
  deliberately left undecorated, marked with `// @domain-events-undecorated: <reason>` at the top
  of the file. See `dev_docs/future_plans/Z20-domain-events-outbox.md` §8.
- **`check:domain-events-subscribers`** (`backend/scripts/`, wired into `.husky/pre-commit`):
  grep-level check that no file besides `domain-events.module.ts` calls `registry.on(` directly,
  and every `handlers/*.handler.ts` has either the decorator or the exemption marker.
- The package ships no `.prisma` file; `backend/prisma/schema/domain-events.prisma` is this app's
  own copy of the documented pattern, checked against actual drift via
  `pnpm -C backend check:domain-events-schema-drift` (wired into `.husky/pre-commit`, same
  approach as `check:schema-docs`).

## Audit Metadata

- REST controllers that pass caller context into audited service writes should import
  `buildAuditMeta` and `AuditMeta` from `@appspine/audit-log`.
- Do not add a local `backend/src/audit-meta.ts`; the shared helper already supports both JWT and
  API-key callers without coupling app code to package-internal auth types.

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
  - **Scope-only is valid before a domain `Permission` exists**: an endpoint may legitimately run
    `JwtOrApiKeyGuard` → `ScopeGuard` with no permission guard when no `Permission` enum value yet
    expresses "may use this domain" — the scaffold's notification inbox
    (`backend/src/notifications/notifications.controller.ts`) is the shipped example, and requiring one
    of the framework's `USERS_*`/`API_KEYS_*` admin permissions there would lock normal users out of
    their own inbox. Revisit those endpoints once the fork defines its own `Permission` values; see
    README's "## API → Guard chain".
  - **Scope action read/write classification**: for `resource:action` scopes, `action` values
    `read`/`list`/`get` are treated as read-only; every other action (`write`/`create`/`update`/
    `delete`) is treated as a write. If a tool declares multiple scopes mixing read and write
    actions, it's classified as a write if *any* of them is a write. `@appspine/mcp-server`
    derives the MCP `readOnlyHint` tool annotation from this rule automatically at `tools/list`
    time — you don't set it by hand, just declare `requiredScopes` correctly.
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
  (`list_*`/`get_*`/`create_*`/`update_*`/`delete_*`), **prefixed with this app's cross-app tool
  prefix** (the `MCP_TOOL_PREFIX` env var, e.g. `wiki_list_pages`) — this lets external callers
  (n8n, AI agents) tell which app a tool belongs to from a flattened cross-app tool list.
  `@appspine/mcp-server` dual-registers under both the bare and prefixed name and checks the
  prefix format at registration time; forks off this template start with `MCP_TOOL_PREFIX`
  already set, so there's no transition window to manage for a new app. **The framework does not
  auto-generate these tools**; the app registers them itself via `@McpTool()` (see step 3 of the
  CRUD module flow below).
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
  coverage number. Unit tests run on vitest (`pnpm -C backend test`, `backend/vitest.config.ts`,
  `src/**/*.spec.ts`); the scaffold ships `src/notifications/*.spec.ts` as the worked example of the
  lightweight mock-based shape these should take.
- **Seeding data in an E2E spec by calling the backend directly** (bypassing UI forms for setup):
  hit the backend origin, not a frontend-relative path — most apps' frontend API clients are
  server-only (Server Actions/Route Handlers reading the httpOnly auth cookie via `next/headers`),
  so there is no browser-exposed REST proxy to call at all, and per "No global `/api` prefix"
  above the real routes mount at root anyway. Authenticate by reading the `auth_token` cookie from
  `adminContext.cookies()` and sending its value as `Authorization: Bearer <value>` — that cookie's
  value is the same JWT the backend's `JwtStrategy` expects as a Bearer header (it does not accept
  the cookie itself).

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
- **Check `@appspine/frontend-shell` before writing a local component**: its `src/index.ts` is a
  single flat export list — the complete index of every shared component that already exists. If
  you're about to build something another app would plausibly also need (a date/time picker, a
  list search/pagination pattern, an app-shell-level piece), scan that list first and use what's
  there instead of writing a local version "for now." `DateTimePicker`/`DateRangePicker` diverged
  into five different per-repo copies — with the same bug needing five separate fixes — before
  being collapsed into `frontend-shell` (see `dev_docs/019-shared-date-picker-package-plan.md` in
  the appspine monorepo) precisely because nobody checked first.
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
   to register them. **The framework does not auto-generate these tools** — `<prefix>_list_*`/
   `<prefix>_get_*`/`<prefix>_create_*`/`<prefix>_update_*`/`<prefix>_delete_*` (cross-app prefix
   from `MCP_TOOL_PREFIX`, see "API Design" above) is just a suggested naming convention to mirror
   REST; which of the 5 (if any) to expose, the tool names, and `requiredScopes` (`resource:action`
   format, matching the M2M API Key scope design and the read/write classification rule above) are
   entirely up to the app to write by hand.
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
