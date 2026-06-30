# Data Dictionary

> Auto-generated from Prisma schema on 2026-06-30.
> Do not edit manually — run your app's schema:docs script to regenerate.

---

## Enums

### AuditAction

| Value | Description |
|-------|-------------|
| `CREATE` |  |
| `UPDATE` |  |
| `DELETE` |  |

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
| `createdAt` | DateTime | ✓ |  |  |

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

> System user account. Used for authentication in local-auth mode. In OIDC mode the password field is unused; identity is verified via JWKS. Contains password hash; not exposed via MCP tools. @internal

**DB table:** `users`

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `id` | String | ✓ | ✓ |  |
| `email` | String | ✓ | ✓ | Login email, must be unique across the system. |
| `password` | String |  |  |  |
| `name` | String |  |  | Display name shown in UI; optional. |
| `isActive` | Boolean | ✓ |  | Soft-disable without deleting — preserves audit history. |
| `createdAt` | DateTime | ✓ |  |  |
| `updatedAt` | DateTime | ✓ |  |  |
