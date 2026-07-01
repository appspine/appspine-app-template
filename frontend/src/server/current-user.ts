import { ApiError, apiFetch } from "./api-client";

// Mirrors @appspine/auth's JwtPayload (packages/auth/src/decorators/current-user.decorator.ts)
// returned by GET /auth/me. Defined locally rather than imported from @appspine/auth —
// the frontend is a separate deployable and doesn't depend on backend NestJS packages.
export interface CurrentUser {
  sub: string;
  email: string;
  name: string | null;
  roleName: string;
  roleNames: string[];
  permissionPolicy: string;
  permissions: string[];
}

// Returns null (rather than throwing) when the cookie holds an invalid/expired token —
// middleware only checks that the cookie exists, not that it's still valid, so callers
// (dashboard layouts) must handle this as "not actually authenticated".
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await apiFetch<CurrentUser>("/auth/me");
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) return null;
    throw err;
  }
}
