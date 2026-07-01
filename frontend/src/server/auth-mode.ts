// Server-only: reads process.env.AUTH_MODE directly, so this must only be called
// from Server Components/Actions, never a "use client" component (unprefixed env
// vars aren't available in the client bundle — see dev_docs 001 "身份/權限細節").
//
// The frontend doesn't declare its own AUTH_MODE — it shares the app's single root
// .env with the backend (`pnpm dev` loads it via dotenv-cli before spawning both
// processes), so this always mirrors whatever @appspine/auth is actually running
// under.
export type AuthMode = "local" | "oidc";

export function getAuthMode(): AuthMode {
  return process.env.AUTH_MODE === "oidc" ? "oidc" : "local";
}

// AUTH_MODE=local shows account-management UI (create user, change password);
// AUTH_MODE=oidc hides it since identity is owned by the external IdP. Role
// assignment UI is shown in both modes (dev_docs 001 "身份/權限細節").
export function isLocalAuthMode(): boolean {
  return getAuthMode() === "local";
}
