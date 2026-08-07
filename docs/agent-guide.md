# appspine-app-template — Agent Guide

Welcome to the development guide for the business systems built using the appspine template.

For cross-app commands, queries, and events, pin the canonical capability and point-to-point binding
by exact SemVer plus digest. Run the contract CLI validation and generated-artifact drift checks
before committing; the integration workflow owns the workspace-level compatibility gate.

## Technology Stack

This application consists of two main components:
- **Frontend**: A modern dashboard application built with Next.js 16, Tailwind CSS v4, and shadcn/ui.
- **Backend**: A NestJS API framework powered by Prisma ORM for database modeling and access.

For setting up the environment, local database, dependencies, and launching the services, please refer to the Quick Start guide in the root [README.md](../README.md).

## Shared Framework Packages

The backend comes pre-integrated with several `@appspine/*` packages located in the upstream monorepo:
- **Auth (`@appspine/auth`)**: OIDC-only authentication through an external identity provider such as Keycloak; local email/password credentials are retired.
- **RBAC (`@appspine/rbac`)**: Manages custom roles and permission mappings. Offers guards like `AdminGuard` and `PermissionGuard` to enforce access controls.
- **M2M API Key (`@appspine/m2m-api-key`)**: Handles machine-to-machine client API keys, rate-limiting, and scoped endpoint access. API keys may optionally bind `actingUserId` for identity-bound writes, but only to dedicated service-account users (`User.isServiceAccount = true`); use `resolveActingUserId()` from `@appspine/auth` as the fail-closed identity resolver in write paths.
- **Audit Log (`@appspine/audit-log`)**: Records key system events directly to the local database.
- **Health Check (`@appspine/health-check`)**: Exposes system health checks at `GET /health` with DB connection pinging.
- **Metadata Schema (`@appspine/metadata-schema`)**: Generates model-driven schema descriptions from Prisma DMMF, exposed at `GET /metadata/schema`.
- **MCP Server (`@appspine/mcp-server`)**: Runs a Model Context Protocol endpoint at `POST /mcp` that allows the system to register and expose customized AI tools to agents.
- **Notification (`@appspine/notification`)**: A shared per-user notification inbox exposed at
  `/notifications` (list, unread count, mark-read, mark-all-read, archive) with recipient-owned
  mutations — the recipient always comes from the authenticated principal, never from a client-supplied
  id, and mutating someone else's notification answers 404, not 403. Already wired
  (`backend/src/notifications/`) but ships **no** producer; see [Shared notifications](#shared-notifications)
  below for how to emit from your own modules.
- **Domain Events (`@appspine/domain-events`)**: A transaction-bound outbox for derived side effects (webhooks, cross-system notifications, future workflow signals) — business write and event commit together, a background dispatcher delivers with retry/dead-letter. Already wired (`backend/src/domain-events/domain-events.module.ts`) but the handler registry starts empty; see [domain-events.md](domain-events.md) for how to record your first event.

## Development Conventions

Full naming, directory, lint, Prisma, API design, Git/commit, testing, and frontend-component
conventions — plus the standard flow for adding a new CRUD module — live in
[conventions.md](conventions.md). Read it before starting implementation work.

## App Positioning

<!-- TODO(scaffold): Fill in this app's positioning after running scaffold-init.
     Describe the business domain and the core modules this system owns.
     This is one item on a larger list — see README.md's "Before you ship — documentation checklist"
     under "Forking this template" for the rest (API/MCP tools tables, data-dictionary regen, etc). -->

## Shared notifications

The scaffold includes the standard `Notification` schema and generic inbox controller backed by
`@appspine/notification`, with recipient-owned mutations. The dashboard uses
`@appspine/frontend-shell/notification`; forks should keep notification writes synchronous with their
triggering transaction and use stable idempotency keys for each producer. This is plumbing only — the
template deliberately ships **no** notification producer, so writing one is the fork's first job.

### Producing notifications from your own modules

`NotificationsModule` exports the shared `NotificationService` (imported here under the local alias
`SharedNotificationService`). A feature module that needs to emit notifications imports the module and
injects the shared service directly — do **not** re-declare `SharedNotificationService` in your own
module's `providers`:

```ts
// your-feature.module.ts
@Module({
  imports: [NotificationsModule],
  providers: [YourFeatureService],
})
export class YourFeatureModule {}

// your-feature.service.ts
import { NotificationService as SharedNotificationService } from "@appspine/notification";

@Injectable()
export class YourFeatureService {
  constructor(private readonly notifications: SharedNotificationService) {}

  async doThing(tx: Prisma.TransactionClient) {
    // Pass the caller's transaction so the notification commits with the business write.
    await this.notifications.notify({ /* ... */ }, { tx });
  }
}
```

Re-providing `SharedNotificationService` in a consuming module is not *corrupting* — `PrismaModule` is
`@Global()`, so the duplicate instance still resolves the same singleton `PrismaService` and behaves
identically — but it constructs a second, redundant instance of a stateless service and bypasses the
module boundary. Importing `NotificationsModule` is the intended pattern.

### API scope naming

The inbox controller guards its endpoints with `notifications:read` / `notifications:write` — the same
table-derived name `MetaService.deriveScopes()` in `@appspine/metadata-schema` auto-generates from the
`Notification` model's `@@map("notifications")`, and every other module in this template already uses
this convention. Because it matches the catalog exactly, the API-keys admin page (which renders
`meta.availableScopes` as checkboxes) can grant it directly — no wildcard `*` workaround needed. Do
**not** rewrite this to an `<app-name>-` prefixed form; that was the previous convention
(`approve-notifications:*`, `project-notifications:*`) and it could never be granted from the admin UI
for exactly this reason. `scripts/scaffold-init.mjs` intentionally does not touch this scope string at
fork time — it stays `notifications:*` regardless of `--name`.

---
