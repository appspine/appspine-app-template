"use server";
import { notificationsApi } from "@/lib/notifications-api";
export async function getUnreadCountAction() {
  return notificationsApi.unreadCount();
}
export async function listRecentNotificationsAction() {
  return notificationsApi.list({ limit: 10 });
}
export async function markNotificationReadAction(id: string) {
  await notificationsApi.markRead(id);
}
export async function markAllNotificationsReadAction() {
  await notificationsApi.markAllRead();
}
