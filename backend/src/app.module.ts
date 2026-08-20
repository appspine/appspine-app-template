import { LoggingModule, PrismaModule } from "@appspine/common";
import { DomainEventsAdminModule } from "@appspine/domain-events/admin";
import { createAppspineModule } from "@appspine/plugin-host-nest";
import { Module } from "@nestjs/common";

import { appspineConfig } from "./appspine.config";
import { DomainEventsModule } from "./domain-events/domain-events.module";
import { NotificationsModule } from "./notifications/notifications.module";

/**
 * Capabilities this App owns and always wires itself.
 *
 * Nothing here is a plugin: `LoggingModule` and `PrismaModule` are platform foundation, and the
 * remaining entries are this App's own business modules.
 */
const APP_OWNED = [
  LoggingModule,
  PrismaModule,
  DomainEventsModule,
  NotificationsModule,
  DomainEventsAdminModule.forRoot(DomainEventsModule),
];

/**
 * Standard capabilities are composed by the plugin host from `appspine.plugins.json`.
 *
 * `createAppspineModule` resolves the inventory before Nest sees anything: engine ranges,
 * conflicts, cardinality, required capabilities, duplicate routes and the registration order are
 * all settled at composition time, so a misconfigured App fails at boot with a diagnostic rather
 * than at the first request with a missing provider.
 *
 * With the complete preset-standard in Phase 4 (PL4-10) and Phase 5 (PL5-03), all standard
 * capability plugins are composed by the host without any hand-wiring.
 */
@Module({
  imports: [...APP_OWNED, createAppspineModule(appspineConfig)],
})
export class AppModule {}
