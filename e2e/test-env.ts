function readEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalEnv(name: string, fallback: string) {
  return process.env[name]?.trim() || fallback;
}

// admin/user are dev Keycloak identities (dev-infra/README.md), not app-side
// email/password — local auth is retired (dev_docs/framework/035). `admin`'s email must
// match this app's SEED_USER_EMAIL so it lands with the pre-seeded ADMIN role; `user`
// must NOT match any seeded email so it JIT-provisions fresh with the default USER role.
export const testEnv = {
  baseURL: readEnv("E2E_BASE_URL"),
  apiURL: readEnv("E2E_API_URL"),
  adminRoleOptionName: readOptionalEnv("E2E_ADMIN_ROLE_OPTION_NAME", "Administrator"),
  admin: {
    username: readOptionalEnv("E2E_ADMIN_USERNAME", "dev-admin"),
    password: readOptionalEnv("E2E_ADMIN_PASSWORD", "dev-admin-pass"),
    storageStatePath: ".auth/admin.json",
  },
  user: {
    username: readOptionalEnv("E2E_USER_USERNAME", "dev-user"),
    password: readOptionalEnv("E2E_USER_PASSWORD", "dev-user-pass"),
    storageStatePath: ".auth/user.json",
  },
  jitUser: {
    username: readOptionalEnv("E2E_USER_USERNAME", "dev-user"),
    password: readOptionalEnv("E2E_USER_PASSWORD", "dev-user-pass"),
    expectedEmail: readOptionalEnv("E2E_USER_EMAIL", "dev-user@appspine-dev.local"),
  },
  // For specs that need a real Bearer token for direct API calls rather than a browser
  // session — next-auth's own session cookie is an encrypted JWE, not the Keycloak access
  // token the backend accepts, so it can't be read out of the browser context the way the
  // old local `auth_token` cookie could.
  keycloak: {
    issuer: readOptionalEnv("E2E_KEYCLOAK_ISSUER", "http://localhost:8180/realms/appspine-dev"),
    clientId: readOptionalEnv("E2E_KEYCLOAK_CLIENT_ID", "template"),
    clientSecret: readOptionalEnv("E2E_KEYCLOAK_CLIENT_SECRET", "dev-secret-template"),
  },
} as const;
