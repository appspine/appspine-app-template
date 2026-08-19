import { GUARDS_METADATA } from "@nestjs/common/constants";
import { describe, expect, it } from "vitest";
import { PluginCatalogController } from "@appspine/health-check";
import { InteractiveAuthGuard, SystemAdminGuard } from "@appspine/plugin-host-nest";

describe("Plugin Catalog Admin Page & Security (PL3-10 Remediation)", () => {
  it("protects PluginCatalogController with InteractiveAuthGuard and SystemAdminGuard", () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PluginCatalogController,
    ) as unknown[];

    expect(guards).toBeDefined();
    expect(guards).toContain(InteractiveAuthGuard);
    expect(guards).toContain(SystemAdminGuard);
  });

  it("ensures secret configs remain redacted in catalog describe output", () => {
    const mockHost = {
      describe: () => ({
        outcome: "ready" as const,
        order: ["identity-core", "oidc-auth", "health-check"],
        shutdownOrder: ["health-check", "oidc-auth", "identity-core"],
        resolutionDigest: "sha256:digest123",
        authenticationStrategies: [],
        hostCapabilities: ["appspine.prisma"],
        plugins: [
          {
            key: "oidc-auth",
            pluginId: "oidc-auth",
            instanceId: "default",
            package: "@appspine/oidc-auth@1.0.0",
            digest: "sha256:oidcdigest",
            status: "ready" as const,
            required: true,
            provides: ["appspine.interactive-auth-provider"],
            requires: ["appspine.prisma"],
            unresolvedOptional: [],
            startupMs: 12,
            config: {
              clientId: "test-client",
              clientSecret: "[REDACTED]",
              privateKey: "[REDACTED]",
            },
          },
        ],
        disabled: [],
      }),
    };

    const controller = new PluginCatalogController(mockHost as never);
    const catalog = controller.getCatalog();

    expect(catalog.outcome).toBe("ready");
    expect(catalog.plugins).toHaveLength(1);
    const pluginConfig = catalog.plugins[0].config as Record<string, string>;
    expect(pluginConfig.clientSecret).toBe("[REDACTED]");
    expect(pluginConfig.privateKey).toBe("[REDACTED]");
    expect(pluginConfig.clientId).toBe("test-client");
  });
});
