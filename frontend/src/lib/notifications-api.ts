import type { NotificationSeverity } from "@appspine/frontend-shell/notification";

import { apiFetch, type PaginatedResult, toQueryString } from "@/server/api-client";

export interface TemplateNotification {
  id: string;
  type: string;
  category: string | null;
  severity: NotificationSeverity;
  title: string;
  body: string | null;
  targetPath: string | null;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  list: (query?: { page?: number; limit?: number }) =>
    apiFetch<PaginatedResult<TemplateNotification>>(`/notifications${toQueryString(query)}`),
  unreadCount: () => apiFetch<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) => apiFetch<void>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => apiFetch<void>("/notifications/mark-all-read", { method: "POST" }),
};
