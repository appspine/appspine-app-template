# Data Dictionary

> Auto-generated from Prisma schema on 2026-08-05.
> Do not edit manually — run your app's schema:docs script to regenerate.

---

## Enums

### AuditAction

> The kind of data-modification action recorded against an AuditLog entity.

| Value | Description |
|-------|-------------|
| `CREATE` |  |
| `UPDATE` |  |
| `DELETE` |  |
| `RESTORE` |  |
| `MOVE` |  |

### Permission

> Granular permission assignable to a custom Role. ADMIN bypasses all checks; these values are only evaluated for non-ADMIN roles. Embedded in the JWT at login.

| Value | Description |
|-------|-------------|
| `USERS_READ` |  |
| `USERS_CREATE` |  |
| `USERS_UPDATE` |  |
| `USERS_DELETE` |  |
| `API_KEYS_READ` |  |
| `API_KEYS_CREATE` |  |
| `API_KEYS_DELETE` |  |

### DomainEventOperation

> Technical operation kind for a DomainEvent.

| Value | Description |
|-------|-------------|
| `CREATE` |  |
| `UPDATE` |  |
| `DELETE` |  |

### DomainEventDeliveryStatus

> Processing state of one domain event delivery.

| Value | Description |
|-------|-------------|
| `PENDING` |  |
| `PROCESSING` |  |
| `PROCESSED` |  |
| `DEAD_LETTER` |  |
| `IGNORED` |  |

### PermissionPolicy

> Default policy controlling how permission checks behave for a role. DENY_ALL: only explicitly granted permissions pass (default for all new roles). READ_ALL: all *_READ permissions pass automatically; writes/deletes require explicit grants. ALLOW_ALL: every permission check passes — custom ADMIN-level bypass for non-system roles.

| Value | Description |
|-------|-------------|
| `DENY_ALL` |  |
| `READ_ALL` |  |
| `ALLOW_ALL` |  |

## Models

### ApiKey

> Machine-to-machine API key for external integrations (n8n, AI agents). Created by ADMIN only. Raw key is shown once at creation and never stored. @internal

**DB table:** `api_keys`

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `id` | String | ✓ | ✓ |  |
| `name` | String | ✓ |  | Human-readable label, e.g. "n8n production" or "AI agent read-only". |
| `prefix` | String | ✓ |  | First chars of the raw key, shown in lists for identification (e.g. "an_live_a1b2c3d4"). |
| `hashedKey` | String | ✓ | ✓ | SHA-256 hash of the raw key. The raw key is never persisted. |
| `roleId` | String | ✓ |  | Role this key authenticates as; FK to roles table. |
| `actingUserId` | String |  |  | User this key acts as for identity-bound writes (createdById, ownership checks). Must be a dedicated service-account user, never a real employee's personal account — see policy note below. Null = no bound identity; endpoints requiring a real user must reject such calls. onDelete: Restrict — deleting a bound user is blocked; unbind or deactivate the key first. (In practice Users are never hard-deleted in this framework, only soft-disabled via `isActive`; Restrict is defense-in-depth, not the primary safeguard — see the isActive check in the guard.) |
| `scopes` | String[] | ✓ |  | Module-level scopes, e.g. ["users:read","users:*"]. "*" = all scopes. Empty = deny all. |
| `rateLimit` | Int |  |  | Requests per minute. null = system default (60). |
| `isActive` | Boolean | ✓ |  | Whether this key can be used. Set false to revoke without deleting. |
| `expiresAt` | DateTime |  |  | Optional expiry. null = never expires. |
| `createdBy` | String |  |  | Email of the ADMIN who created this key. Snapshot string, no FK. |
| `lastUsedAt` | DateTime |  |  | Timestamp of last successful authentication with this key. |
| `createdAt` | DateTime | ✓ |  |  |
| `updatedAt` | DateTime | ✓ |  |  |

### AuditLog

> Audit log record for tracking data modification actions. @internal

**DB table:** `audit_logs`

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `id` | String | ✓ | ✓ |  |
| `entityType` | String | ✓ |  |  |
| `entityId` | String | ✓ |  |  |
| `action` | AuditAction | ✓ |  |  |
| `actorId` | String | ✓ |  |  |
| `actorEmail` | String | ✓ |  | Snapshot email of the user/agent who performed the action. |
| `appName` | String | ✓ |  |  |
| `isAiOperation` | Boolean | ✓ |  | True when the operation was initiated by an AI agent via MCP. |
| `mcpTool` | String |  |  | MCP tool name that triggered this log entry. Null for human operations. |
| `actingApiKeyId` | String |  |  | Id of the API key that performed this action, when the actor was an API key acting as a bound user. Snapshot string, no FK. Null for direct human actions. |
| `workflowId` | String |  |  | Caller-supplied correlation id from the X-Appspine-Workflow-Id request header (dev_docs 002/023 §2.5). Untrusted, debugging/cross-app-workflow-tracing use only -- never used for authorization or attribution decisions. Null when the caller didn't send the header. |
| `createdAt` | DateTime | ✓ |  |  |

### DomainEvent

> Immutable business fact log for transaction-bound domain events. INSERT-only; all processing state lives on DomainEventDelivery.

**DB table:** `domain_events`

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `id` | String | ✓ | ✓ |  |
| `seq` | BigInt | ✓ | ✓ | Monotonic dispatch order; cuid is unsortable and createdAt can collide. |
| `aggregateType` | String | ✓ |  | Business object type, e.g. "Invoice". |
| `aggregateId` | String | ✓ |  |  |
| `eventType` | String | ✓ |  | Semantic event type, e.g. "invoice.approved". Define as an `as const` object per app — see docs/domain-events.md. |
| `operation` | DomainEventOperation | ✓ |  |  |
| `schemaVersion` | Int | ✓ |  | Payload shape version for before/after snapshots. |
| `actorUserId` | String |  |  |  |
| `correlationId` | String |  |  | Request-level correlation id. |
| `workflowId` | String |  |  | Workflow-level correlation id using the X-Appspine-Workflow-Id convention. |
| `before` | Json |  |  |  |
| `after` | Json |  |  |  |
| `changedFields` | String[] | ✓ |  |  |
| `metadata` | Json |  |  | Free-form handler context, including audit metadata. |
| `createdAt` | DateTime | ✓ |  |  |

### DomainEventDelivery

> Per-handler processing state for one DomainEvent.

**DB table:** `domain_event_deliveries`

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `id` | String | ✓ | ✓ |  |
| `eventId` | String | ✓ |  |  |
| `handlerKey` | String | ✓ |  | Stable handler identity, e.g. "webhook.post" or "webhook.post:<subscriptionId>". |
| `status` | DomainEventDeliveryStatus | ✓ |  |  |
| `attempts` | Int | ✓ |  |  |
| `nextAttemptAt` | DateTime |  |  |  |
| `lockedAt` | DateTime |  |  |  |
| `lockedBy` | String |  |  |  |
| `lastError` | String |  |  |  |
| `processedAt` | DateTime |  |  |  |
| `createdAt` | DateTime | ✓ |  |  |

### Notification

**DB table:** `notifications`

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `id` | String | ✓ | ✓ |  |
| `recipientUserId` | String | ✓ |  |  |
| `idempotencyKey` | String | ✓ |  |  |
| `type` | String | ✓ |  |  |
| `category` | String |  |  |  |
| `severity` | String | ✓ |  |  |
| `title` | String | ✓ |  |  |
| `body` | String |  |  |  |
| `sourceApp` | String | ✓ |  |  |
| `sourceEventId` | String |  |  |  |
| `sourceEntityType` | String |  |  |  |
| `sourceEntityId` | String |  |  |  |
| `targetPath` | String |  |  |  |
| `readAt` | DateTime |  |  |  |
| `archivedAt` | DateTime |  |  |  |
| `createdAt` | DateTime | ✓ |  |  |
| `updatedAt` | DateTime | ✓ |  |  |

### Role

> System role or custom role. ADMIN and USER are seeded system roles and cannot be deleted. Excluded from the API-key scope catalog by MetaService. @internal

**DB table:** `roles`

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `id` | String | ✓ | ✓ |  |
| `name` | String | ✓ | ✓ | Unique machine name, e.g. "ADMIN", "USER", "EDITOR". Used in JWT roleName field. |
| `displayName` | String | ✓ |  | Human-readable label shown in UI. |
| `isSystem` | Boolean | ✓ |  | System roles (ADMIN / USER) cannot be deleted or renamed. |
| `permissionPolicy` | PermissionPolicy | ✓ |  | Default deny; explicit permissions in RolePermission are additive on top of the policy. |
| `createdAt` | DateTime | ✓ |  |  |
| `updatedAt` | DateTime | ✓ |  |  |

### RolePermission

> Junction table between Role and the app's own Permission enum values. Excluded from the auto-derived scope catalog by MetaService. @internal

**DB table:** `role_permissions`

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `id` | String | ✓ | ✓ |  |
| `roleId` | String | ✓ |  |  |
| `permission` | Permission | ✓ |  |  |

### UserRole

> Junction table supporting many-to-many User <-> Role assignment. @internal

**DB table:** `user_roles`

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `userId` | String | ✓ |  |  |
| `roleId` | String | ✓ |  |  |
| `createdAt` | DateTime | ✓ |  |  |

### User

> System user account. Identity is verified via the external IdP's JWKS (dev_docs/framework/035); this record only carries local RBAC grants. @internal

**DB table:** `users`

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `id` | String | ✓ | ✓ |  |
| `email` | String | ✓ | ✓ | Login email, must be unique across the system. |
| `password` | String |  |  | Local auth is retired (dev_docs/framework/035) — never read by any current code path (there is no local login/register endpoint). Optional, hashed by @appspine/auth's UsersController before UsersService.create() writes it (not written unhashed by any current code path) — retained for schema compatibility with a deliberately password-protected break-glass account; not used by the OIDC login flow. Kept nullable rather than dropped: deleting the column is a breaking migration across 9 apps for a nullable field that costs nothing to leave. Any pre-035 hash values are cleared by each app's Group D database reset, not by a data migration. |
| `name` | String |  |  | Display name shown in UI; optional. |
| `employeeNumber` | String |  | ✓ | Cross-app link key for looking up this person's canonical record in apps/org (Enterprise Master Data). Null for accounts with no corresponding org record (service accounts, contractors not yet onboarded in apps/org, etc.) — a null value must not be treated as an error, only as "no org context available for this account". |
| `isActive` | Boolean | ✓ |  | Soft-disable without deleting — preserves audit history. |
| `isServiceAccount` | Boolean | ✓ |  | Marks a dedicated machine/integration account (not a real person's login). Only service accounts may be bound as an API key's acting user — see the actingUserId policy on ApiKey. @internal |
| `createdAt` | DateTime | ✓ |  |  |
| `updatedAt` | DateTime | ✓ |  |  |
