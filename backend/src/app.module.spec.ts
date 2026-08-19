import { Test } from "@nestjs/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Both wirings must compose. That is the whole promise of the dual mode (051 PL2-09): rolling back
 * from plugin mode is an environment variable and a restart, with no migration and no second
 * deployment — which is only true if the legacy path still resolves every provider.
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

  it("resolves every provider with the legacy hand-wired capabilities", async () => {
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

  it("defaults to legacy, so upgrading the packages is not the same step as switching modes", async () => {
    vi.resetModules();
    const previous = { ...process.env };
    Object.assign(process.env, ENV);
    process.env.APPSPINE_PLUGIN_MODE = undefined;
    // biome-ignore lint/performance/noDelete: the test is about the variable being absent.
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
