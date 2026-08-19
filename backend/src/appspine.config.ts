/**
 * The App developer's half of the plugin configuration (051 decision 10).
 *
 * The CLI owns `appspine.plugins.json` — which plugins run, under which instance IDs. This file
 * owns the values they read, and nothing else: no package versions (pnpm-lock.yaml has those), no
 * credentials (the operator's environment has those), no list of plugins (that would be a second
 * answer to a question the inventory already answers).
 *
 * `runtime` is keyed by each plugin's `configSchema.configRef`. Values here are non-secret;
 * anything sensitive is read from the environment by the plugin itself, which is why
 * `appspine build` can validate this whole setup in CI with no secrets available.
 */

import { defineAppspineConfig } from "@appspine/plugin-host-nest";

import { composition } from "../.appspine/generated/backend/composition";

export const appspineConfig = defineAppspineConfig({
  // Generated from appspine.plugins.json by `appspine build`. Hand-editing either half is what the
  // drift check exists to catch.
  inventory: composition.inventory,
  plugins: composition.plugins,

  /**
   * Capabilities this App supplies without a plugin.
   *
   * The values are markers, and that is not a shortcut: the resolver only needs the capability
   * *names* to be satisfiable, while the actual objects reach plugins through Nest. `PrismaModule`
   * and `RbacModule` are both `@Global()` during the transition window, so `PrismaService` and the
   * `RBAC_POLICY` token are already in scope for every module the host composes. When 051 decision
   * 3 removes those globals in Phase 4, this is the line that has to become a real provider bridge.
   */
  hostCapabilities: {
    "appspine.prisma": true,
    "appspine.rbac-policy": true,
  },

  runtime: {
    /**
     * @appspine/oidc-auth.
     *
     * The manifest declares these three as environment keys, and the plugin's config schema
     * requires them as values — that is not a contradiction, it is the split working: the operator
     * sets the environment, the App decides which config branch they land in, and the plugin
     * validates the result at boot. Forwarding them here is the App's job precisely because it is
     * the App that knows its own deployment.
     *
     * All three are declared `secret: false`. A real credential would never appear in this file at
     * all; the plugin would read it from the environment itself.
     */
    oidc: {
      issuer: process.env.OIDC_ISSUER,
      audience: process.env.OIDC_AUDIENCE,
      jwksUrl: process.env.OIDC_JWKS_URL,
    },
  },
});

export default appspineConfig;
