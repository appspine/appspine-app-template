"use server";
import { z } from "zod";

import { notificationsApi } from "@/lib/notifications-api";

// Notification ids are cuid()-generated (backend/prisma/schema/notification.prisma). Rejecting
// anything else here, before it reaches the path-interpolated fetch in notifications-api.ts,
// closes off path-injection attempts at the Server Action boundary rather than relying solely on
// encodeURIComponent downstream.
const notificationIdSchema = z.string().cuid();

export async function getUnreadCountAction() {
  return notificationsApi.unreadCount();
}
export async function listRecentNotificationsAction() {
  return notificationsApi.list({ limit: 10 });
}
export async function markNotificationReadAction(id: string) {
  await notificationsApi.markRead(notificationIdSchema.parse(id));
}
export async function markAllNotificationsReadAction() {
  await notificationsApi.markAllRead();
}
