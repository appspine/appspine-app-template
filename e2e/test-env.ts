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

export const testEnv = {
  baseURL: readEnv("E2E_BASE_URL"),
  apiURL: readEnv("E2E_API_URL"),
  authCookieName: readOptionalEnv("E2E_AUTH_COOKIE_NAME", "auth_token"),
  adminRoleOptionName: readOptionalEnv("E2E_ADMIN_ROLE_OPTION_NAME", "Administrator"),
  admin: {
    email: readOptionalEnv("E2E_ADMIN_EMAIL", readEnv("SEED_USER_EMAIL")),
    password: readOptionalEnv("E2E_ADMIN_PASSWORD", readEnv("SEED_USER_PASSWORD")),
    name: readOptionalEnv("E2E_ADMIN_NAME", process.env.SEED_USER_NAME?.trim() || "Admin"),
    storageStatePath: ".auth/admin.json",
  },
  user: {
    email: readEnv("E2E_USER_EMAIL"),
    password: readEnv("E2E_USER_PASSWORD"),
    name: readOptionalEnv("E2E_USER_NAME", "E2E User"),
    storageStatePath: ".auth/user.json",
    createViaRegisterApi: true,
  },
} as const;
