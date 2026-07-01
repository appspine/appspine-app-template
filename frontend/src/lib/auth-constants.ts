// Zero-dependency leaf module (no next/headers import) so it can be safely shared
// by both server-only code (src/server/auth-cookie.ts) and Edge middleware
// (src/middleware.ts) without pulling next/headers into the middleware bundle.
export const AUTH_COOKIE_NAME = "auth_token";
