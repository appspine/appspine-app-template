import { NotificationService as SharedNotificationService } from "@appspine/notification";
import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationsService {
  constructor(private readonly notifications: SharedNotificationService) {}

  findByUser(userId: string, page: number, limit: number) {
    return this.notifications.getInbox(userId, { page, limit });
  }

  getUnreadCount(userId: string) {
    return this.notifications.getUnreadCount(userId);
  }

  markRead(id: string, userId: string) {
    return this.notifications.markRead(id, userId);
  }

  async markAllRead(userId: string) {
    const result = await this.notifications.markAllRead(userId);
    return { success: true, count: result.count };
  }

  archive(id: string, userId: string) {
    return this.notifications.archive(id, userId);
  }
}
