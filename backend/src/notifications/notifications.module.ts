import { NotificationService as SharedNotificationService } from "@appspine/notification";
import { AppspineAuthInfrastructureModule } from "@appspine/plugin-host-nest";
import { Module } from "@nestjs/common";

import { AppspinePlatformModule } from "../appspine.module";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [AppspinePlatformModule, AppspineAuthInfrastructureModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, SharedNotificationService],
  // Exported so a fork's own feature modules can `imports: [NotificationsModule]` and inject
  // SharedNotificationService to call notify() — see docs/agent-guide.md "Shared notifications".
  exports: [SharedNotificationService],
})
export class NotificationsModule {}
