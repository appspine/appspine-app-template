import { describe, expect, it, vi } from "vitest";

import { NotificationsService } from "./notifications.service";

function createService() {
  const notifications = {
    getInbox: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
    getUnreadCount: vi.fn().mockResolvedValue({ count: 2 }),
    markRead: vi.fn().mockResolvedValue({ id: "n-1" }),
    markAllRead: vi.fn().mockResolvedValue({ count: 2 }),
    archive: vi.fn().mockResolvedValue({ id: "n-1", archivedAt: new Date() }),
  };
  return { service: new NotificationsService(notifications as never), notifications };
}

describe("NotificationsService", () => {
  it("delegates inbox and unread queries to the shared package", async () => {
    const { service, notifications } = createService();

    await expect(service.findByUser("user-1", 2, 10)).resolves.toEqual({ data: [], total: 0, page: 1, limit: 20 });
    await expect(service.getUnreadCount("user-1")).resolves.toEqual({ count: 2 });
    expect(notifications.getInbox).toHaveBeenCalledWith("user-1", { page: 2, limit: 10 });
    expect(notifications.getUnreadCount).toHaveBeenCalledWith("user-1");
  });

  it("keeps ownership-bound mutations and exposes archive", async () => {
    const { service, notifications } = createService();

    await service.markRead("n-1", "user-1");
    await expect(service.markAllRead("user-1")).resolves.toEqual({ success: true, count: 2 });
    await service.archive("n-1", "user-1");

    // Every mutation forwards the caller's own id as the ownership scope — the shared package
    // resolves the row by (id, recipientId), so a foreign id can never be mutated here.
    expect(notifications.markRead).toHaveBeenCalledWith("n-1", "user-1");
    expect(notifications.markAllRead).toHaveBeenCalledWith("user-1");
    expect(notifications.archive).toHaveBeenCalledWith("n-1", "user-1");
  });
});
