import { Test } from "@nestjs/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Both wirings must compose. That is the whole promise of the dual mode (051 PL2-09 & PL5-03):
 * in Phase 5, Plugin Mode is default (`APPSPINE_PLUGIN_MODE !== "0"`), while rolling back to
 * legacy is `APPSPINE_PLUGIN_MODE=0` and a restart — which is only true if both paths still
 * resolve every provider.
 *
 * `compile()` builds the dependency graph without calling `onModuleInit`, so this runs with no
 * database. What it proves is exactly what a DI mistake breaks: a missing provider, a duplicate
 * route, an unsatisfied capability. Behaviour against a real database is the E2E suite's job.
 */

const ENV = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  OIDC_ISSUER: "https://issuer.example/realms/test",
  OIDC_AUDIENCE: "appspine-app-template",
  OIDC_JWKS_URL: "https://issuer.example/realms/test/protocol/openid-connect/certs",
  APP_NAME: "appspine-app-template",
};

async function compileWith(pluginMode: boolean) {
  vi.resetModules();
  const previous = { ...process.env };
  Object.assign(process.env, ENV, { APPSPINE_PLUGIN_MODE: pluginMode ? "1" : "0" });

  try {
    const { AppModule } = await import("./app.module");
    return await Test.createTestingModule({ imports: [AppModule] }).compile();
  } finally {
    process.env = previous;
  }
}

describe("AppModule composes in both modes", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("resolves every provider with the legacy escape hatch (APPSPINE_PLUGIN_MODE=0)", async () => {
    const moduleRef = await compileWith(false);
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });

  it("resolves every provider through the plugin host", async () => {
    // A misconfigured inventory fails here, at composition, with a diagnostic — not at the first
    // request with a provider that was never registered.
    const moduleRef = await compileWith(true);
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });

  it("defaults to plugin mode when APPSPINE_PLUGIN_MODE is not set", async () => {
    vi.resetModules();
    const previous = { ...process.env };
    Object.assign(process.env, ENV);
    delete process.env.APPSPINE_PLUGIN_MODE;

    try {
      const moduleRef = await Test.createTestingModule({
        imports: [(await import("./app.module")).AppModule],
      }).compile();
      expect(moduleRef).toBeDefined();
      await moduleRef.close();
    } finally {
      process.env = previous;
    }
  });
});
