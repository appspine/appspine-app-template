// Mirrors @appspine/m2m-api-key's ApiKeysService.ApiKeyRecord shape
// (packages/m2m-api-key/src/api-keys.service.ts), with Date fields as ISO
// strings since they cross the wire as JSON. Defined locally — the frontend
// doesn't depend on backend packages.
export interface RoleRef {
  id: string;
  name: string;
  displayName: string;
}

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  roleId: string;
  role: RoleRef;
  scopes: string[];
  rateLimit: number | null;
  isActive: boolean;
  expiresAt: string | null;
  createdBy: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// The one-time creation response — `key` is only ever present here, never on
// ApiKeyRow (list/detail responses only return the non-secret `prefix`).
export interface CreateApiKeyResponse {
  id: string;
  key: string;
  prefix: string;
  name: string;
  roleId: string;
  role: RoleRef;
  scopes: string[];
  createdAt: string;
}

export interface RoleOption {
  id: string;
  name: string;
  displayName: string;
}

// No scope catalog endpoint exists yet (the M2M scope format is
// resource:action, a different shape than the app-specific Permission enum —
// dev_docs/003 defers a real catalog to a future metadata-schema extension).
// Mirrors the resources implied by the current Permission enum in
// backend/prisma/schema/base.prisma. Keep in sync manually.
export const SCOPE_RESOURCES = ["users", "api-keys"] as const;
export const SCOPE_ACTIONS = ["read", "write"] as const;
