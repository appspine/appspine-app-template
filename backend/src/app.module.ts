import { AuditLogModule } from "@appspine/audit-log";
import { AuthModule } from "@appspine/auth";
import { LoggingModule, PrismaModule } from "@appspine/common";
import { DomainEventsAdminModule } from "@appspine/domain-events/admin";
import { HealthModule } from "@appspine/health-check";
import { ApiKeysModule } from "@appspine/m2m-api-key";
import { McpModule } from "@appspine/mcp-server";
import { MetaModule } from "@appspine/metadata-schema";
import { createAppspineModule } from "@appspine/plugin-host-nest";
import { RbacModule } from "@appspine/rbac";
import { Module, type ModuleMetadata } from "@nestjs/common";

import { appspineConfig } from "./appspine.config";
import { DomainEventsModule } from "./domain-events/domain-events.module";
import { NotificationsModule } from "./notifications/notifications.module";

/**
 * Capabilities this App owns and always wires itself.
 *
 * Nothing here is a plugin, and nothing here changes between the two modes: `LoggingModule` and
 * `PrismaModule` are platform foundation, and the last three are this App's own business modules.
 * Keeping them in one list is what makes the diff between the modes readable — the *only* thing
 * that varies is which capabilities come from where.
 */
const APP_OWNED = [
  LoggingModule,
  PrismaModule,
  DomainEventsModule,
  NotificationsModule,
  DomainEventsAdminModule.forRoot(DomainEventsModule),
];

/**
 * Capability modules imported by hand — the wiring this template used before 051.
 *
 * Kept, and kept working, for the whole transition window (051 decision 6). Rolling back from
 * plugin mode is `APPSPINE_PLUGIN_MODE=0` and a restart: no migration, no data change, no second
 * deployment. That is the property the dual mode exists to provide, and it is worth more than the
 * tidiness of deleting this list.
 */
const LEGACY_CAPABILITIES = [
  AuthModule,
  RbacModule,
  ApiKeysModule,
  AuditLogModule,
  HealthModule,
  MetaModule,
  McpModule,
];

/**
 * The same capabilities, composed by the plugin host from `appspine.plugins.json`.
 *
 * `createAppspineModule` resolves the inventory before Nest sees anything: engine ranges,
 * conflicts, cardinality, required capabilities, duplicate routes and the registration order are
 * all settled at composition time, so a misconfigured App fails at boot with a diagnostic rather
 * than at the first request with a missing provider.
 *
 * With the complete preset-standard in Phase 4 (PL4-10) and Phase 5 (PL5-03), all standard
 * capability plugins are composed by the host without any hand-wiring.
 */
function pluginMode(): NonNullable<ModuleMetadata["imports"]> {
  return [createAppspineModule(appspineConfig)];
}

/**
 * Plugin mode is now the DEFAULT in Phase 5 (`APPSPINE_PLUGIN_MODE !== "0"`).
 * Setting `APPSPINE_PLUGIN_MODE=0` serves as the legacy escape hatch during the transition window.
 */
const usePluginMode = process.env.APPSPINE_PLUGIN_MODE !== "0";

@Module({
  imports: [...APP_OWNED, ...(usePluginMode ? pluginMode() : LEGACY_CAPABILITIES)],
})
export class AppModule {}
