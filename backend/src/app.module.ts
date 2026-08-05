import { AuditLogModule } from "@appspine/audit-log";
import { AuthModule } from "@appspine/auth";
import { LoggingModule, PrismaModule } from "@appspine/common";
import { DomainEventsAdminModule } from "@appspine/domain-events/admin";
import { HealthModule } from "@appspine/health-check";
import { ApiKeysModule } from "@appspine/m2m-api-key";
import { McpModule } from "@appspine/mcp-server";
import { MetaModule } from "@appspine/metadata-schema";
import { RbacModule } from "@appspine/rbac";
import { Module } from "@nestjs/common";

import { DomainEventsModule } from "./domain-events/domain-events.module";
import { NotificationsModule } from "./notifications/notifications.module";

@Module({
  imports: [
    LoggingModule,
    PrismaModule,
    AuthModule,
    RbacModule,
    ApiKeysModule,
    AuditLogModule,
    HealthModule,
    MetaModule,
    McpModule,
    DomainEventsModule,
    NotificationsModule,
    DomainEventsAdminModule.forRoot(DomainEventsModule),
  ],
})
export class AppModule {}
