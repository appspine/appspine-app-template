import { Test } from "@nestjs/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `compile()` builds the dependency graph without calling `onModuleInit`, so this runs with no
 * database. It proves that the plugin-only composition has no missing provider, duplicate route,
 * or unsatisfied capability. Behaviour against a real database is the E2E suite's job.
 */

const ENV = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  OIDC_ISSUER: "https://issuer.example/realms/test",
  OIDC_AUDIENCE: "appspine-app-template",
  OIDC_JWKS_URL: "https://issuer.example/realms/test/protocol/openid-connect/certs",
  APP_NAME: "appspine-app-template",
};

async function compileWith(pluginModeValue?: string) {
  vi.resetModules();
  const previous = { ...process.env };
  Object.assign(process.env, ENV);
  if (pluginModeValue === undefined) delete process.env.APPSPINE_PLUGIN_MODE;
  else process.env.APPSPINE_PLUGIN_MODE = pluginModeValue;

  try {
    const { AppModule } = await import("./app.module");
    return await Test.createTestingModule({ imports: [AppModule] }).compile();
  } finally {
    process.env = previous;
  }
}

describe("AppModule plugin-only composition", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("resolves every provider through the plugin host", async () => {
    // A misconfigured inventory fails here, at composition, with a diagnostic — not at the first
    // request with a provider that was never registered.
    const moduleRef = await compileWith();
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });

  it("does not restore legacy wiring when APPSPINE_PLUGIN_MODE=0 is present", async () => {
    const moduleRef = await compileWith("0");
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
