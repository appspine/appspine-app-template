import { type ApiKeyUser, CurrentUser, type JwtUser, resolveActingUserId } from "@appspine/auth";
import { type PaginationQuery, paginationQuerySchema, ZodValidationPipe } from "@appspine/common";
import { JwtOrApiKeyGuard, ScopeGuard, Scopes } from "@appspine/m2m-api-key";
import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";

import { NotificationsService } from "./notifications.service";

type TemplateUser = JwtUser | ApiKeyUser;

@Controller("notifications")
@UseGuards(JwtOrApiKeyGuard, ScopeGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @Scopes("notifications:read")
  findAll(
    @CurrentUser() user: TemplateUser,
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
  ) {
    return this.service.findByUser(resolveActingUserId(user), query.page, query.limit);
  }

  @Get("unread-count")
  @Scopes("notifications:read")
  unreadCount(@CurrentUser() user: TemplateUser) {
    return this.service.getUnreadCount(resolveActingUserId(user));
  }

  @Post(":id/read")
  @Scopes("notifications:write")
  markRead(@Param("id") id: string, @CurrentUser() user: TemplateUser) {
    return this.service.markRead(id, resolveActingUserId(user));
  }

  @Post("mark-all-read")
  @Scopes("notifications:write")
  markAllRead(@CurrentUser() user: TemplateUser) {
    return this.service.markAllRead(resolveActingUserId(user));
  }

  @Post(":id/archive")
  @Scopes("notifications:write")
  archive(@Param("id") id: string, @CurrentUser() user: TemplateUser) {
    return this.service.archive(id, resolveActingUserId(user));
  }
}
