import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    // Dummy, non-secret values — files under test transitively import @appspine/oidc-auth, which
    // fails loud when its auth env vars are unset. Unit tests never sign or verify a real
    // token, so real secrets aren't needed here.
    env: {
      AUTH_MODE: "oidc",
      OIDC_ISSUER: "http://localhost:8180/realms/appspine-dev",
      OIDC_AUDIENCE: "template",
      OIDC_JWKS_URL: "http://localhost:8180/realms/appspine-dev/protocol/openid-connect/certs",
      JWT_SECRET: "unit-test-only-not-a-real-secret",
    },
  },
});
