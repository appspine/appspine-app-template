import type { ApiKeyUser, JwtUser } from "@appspine/plugin-host-nest";
import { describe, expect, it, vi } from "vitest";

import { NotificationsController } from "./notifications.controller";
import type { NotificationsService } from "./notifications.service";

function createController() {
  const service = {
    findByUser: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
    getUnreadCount: vi.fn().mockResolvedValue({ count: 0 }),
    markRead: vi.fn().mockResolvedValue({ id: "n-1" }),
    markAllRead: vi.fn().mockResolvedValue({ success: true, count: 0 }),
    archive: vi.fn().mockResolvedValue({ id: "n-1" }),
  };
  return {
    controller: new NotificationsController(service as unknown as NotificationsService),
    service,
  };
}

const caller = { sub: "user-1", email: "user-1@example.test" } as JwtUser;

describe("NotificationsController", () => {
  it("resolves the recipient from the authenticated principal, never from client input", async () => {
    const { controller, service } = createController();

    // The DTOs carry no recipient field at all; the only user id reaching the service is the
    // principal's. `sub` here doubles as the id a client could otherwise try to spoof.
    await controller.findAll(caller, { page: 1, limit: 20 });
    await controller.unreadCount(caller);
    await controller.markAllRead(caller);

    expect(service.findByUser).toHaveBeenCalledWith("user-1", 1, 20);
    expect(service.getUnreadCount).toHaveBeenCalledWith("user-1");
    expect(service.markAllRead).toHaveBeenCalledWith("user-1");
  });

  it("scopes per-id mutations to the caller so ownership is enforced server-side", async () => {
    const { controller, service } = createController();

    await controller.markRead("n-1", caller);
    await controller.archive("n-1", caller);

    // The id comes from the route, the owner from the token — a caller cannot widen the lookup.
    expect(service.markRead).toHaveBeenCalledWith("n-1", "user-1");
    expect(service.archive).toHaveBeenCalledWith("n-1", "user-1");
  });

  it("reads an API-key caller's inbox as its bound acting user, and fails closed without one", async () => {
    const { controller, service } = createController();
    const bound = {
      sub: "key-1",
      isApiKey: true,
      actingUserId: "user-2",
      scopes: ["notifications:write"],
      roleNames: [],
      permissionPolicy: "DENY_ALL",
      permissions: [],
    } as ApiKeyUser;

    await controller.markRead("n-1", bound);
    expect(service.markRead).toHaveBeenCalledWith("n-1", "user-2");

    // resolveActingUserId() is fail-closed: an unbound key gets no inbox at all rather than
    // silently falling back to the key's own id.
    const unbound = { ...bound, actingUserId: null } satisfies ApiKeyUser;
    expect(() => controller.markRead("n-1", unbound)).toThrow(/no acting user bound/);
  });
});
