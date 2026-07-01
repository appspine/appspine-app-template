// Mirrors @appspine/rbac's RolesService.mapRole() output
// (packages/rbac/src/roles/roles.service.ts). Defined locally — the frontend
// doesn't depend on backend packages.
export interface RoleRow {
  id: string;
  name: string;
  displayName: string;
  isSystem: boolean;
  permissionPolicy: string;
  permissions: string[];
  userCount: number;
  apiKeyCount: number;
}

export const PERMISSION_POLICIES = ["DENY_ALL", "READ_ALL", "ALLOW_ALL"] as const;

// Mirrors the app-specific `enum Permission` in backend/prisma/schema/base.prisma.
// Not fetched at runtime — no endpoint currently exposes the raw enum values (the
// M2M scope catalog from @appspine/metadata-schema is a different, derived format,
// resource:action rather than these enum members). Keep in sync manually when
// adding a new CRUD module's permissions (dev_docs/002 "新增 CRUD 模組標準流程").
export const PERMISSION_OPTIONS = [
  "USERS_READ",
  "USERS_CREATE",
  "USERS_UPDATE",
  "USERS_DELETE",
  "API_KEYS_READ",
  "API_KEYS_CREATE",
  "API_KEYS_DELETE",
] as const;
