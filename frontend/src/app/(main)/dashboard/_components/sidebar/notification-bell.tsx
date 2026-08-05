"use client";
import { useMemo } from "react";

import { useTranslations } from "@appspine/frontend-shell";
import {
  type NotificationDataSource,
  type NotificationLabels,
  type NotificationSummary,
  NotificationBell as SharedNotificationBell,
} from "@appspine/frontend-shell/notification";

import {
  getUnreadCountAction,
  listRecentNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "./notification-actions";

export function NotificationBell({ initialUnreadCount }: { initialUnreadCount?: number }) {
  const t = useTranslations("notifications");
  const labels: NotificationLabels = useMemo(
    () => ({
      ariaLabel: t("ariaLabel"),
      title: t("title"),
      markAllRead: t("markAllRead"),
      markAllReadError: t("markAllReadError"),
      markReadError: t("markReadError"),
      loading: t("loading"),
      empty: t("empty"),
      error: t("error"),
      retry: t("retry"),
      unread: t("unread"),
      read: t("read"),
      retrying: t("retrying"),
    }),
    [t],
  );
  const dataSource: NotificationDataSource = useMemo(
    () => ({
      loadUnreadCount: getUnreadCountAction,
      loadRecent: listRecentNotificationsAction,
      markRead: markNotificationReadAction,
      markAllRead: markAllNotificationsReadAction,
      resolveHref: (notification: NotificationSummary) => notification.targetPath ?? "/dashboard",
    }),
    [],
  );
  return (
    <SharedNotificationBell
      dataSource={dataSource}
      labels={labels}
      initialUnreadCount={initialUnreadCount}
      maxItems={10}
      pollIntervalMs={30_000}
    />
  );
}
