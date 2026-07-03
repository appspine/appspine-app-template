import Link from "next/link";

import { ListPagination, ListSearchForm, SortableColumnHeader } from "@appspine/frontend-shell";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTranslations } from "@/i18n/server";
import type { PaginatedResult } from "@/server/api-client";
import { apiFetch } from "@/server/api-client";
import { isLocalAuthMode } from "@/server/auth-mode";
import { getCurrentUser } from "@/server/current-user";
import { buildListHref, buildSortHref, formatPageInfo, parseSortOrder } from "@/server/list-url";

import { CreateUserDialog } from "./_components/create-user-dialog";
import { UserRowActions } from "./_components/user-row-actions";
import type { RoleOption, UserRow } from "./types";

const PAGE_SIZE = 20;

type UserSortField = "email" | "name";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sortField?: string; sortOrder?: string }>;
}) {
  const tUsers = await getTranslations("users");
  const tCommon = await getTranslations("common");

  const { page: pageParam, search = "", sortField, sortOrder: sortOrderParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const sortOrder = parseSortOrder(sortOrderParam);

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (search) query.set("search", search);
  if (sortField) query.set("sortField", sortField);
  if (sortOrder) query.set("sortOrder", sortOrder);

  const [{ data: users, total }, roles, currentUser] = await Promise.all([
    apiFetch<PaginatedResult<UserRow>>(`/users?${query}`),
    apiFetch<RoleOption[]>("/roles/options"),
    getCurrentUser(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showLocalAuthUi = isLocalAuthMode();

  const paginationInfoText = formatPageInfo(tUsers("pageInfo"), { page, totalPages, total });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl tracking-tight">{tUsers("title")}</h1>
        {showLocalAuthUi && <CreateUserDialog roles={roles} />}
      </div>

      <ListSearchForm
        defaultValue={search}
        placeholder={tUsers("searchPlaceholder")}
        searchButtonText={tCommon("search")}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableColumnHeader<UserSortField>
                  label={tUsers("email")}
                  field="email"
                  currentSortField={sortField}
                  currentSortOrder={sortOrder}
                  LinkComponent={Link}
                  buildSortHref={(field, order) => buildSortHref({ search }, field, order)}
                />
              </TableHead>
              <TableHead>
                <SortableColumnHeader<UserSortField>
                  label={tUsers("name")}
                  field="name"
                  currentSortField={sortField}
                  currentSortOrder={sortOrder}
                  LinkComponent={Link}
                  buildSortHref={(field, order) => buildSortHref({ search }, field, order)}
                />
              </TableHead>
              <TableHead>{tUsers("roles")}</TableHead>
              <TableHead>{tUsers("status")}</TableHead>
              <TableHead>{tUsers("serviceAccount")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {tUsers("noUsers")}
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.name ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role.id} variant="secondary">
                        {role.displayName}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "default" : "outline"}>
                    {user.isActive ? tUsers("active") : tUsers("inactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.isServiceAccount && <Badge variant="secondary">{tUsers("serviceAccount")}</Badge>}
                </TableCell>
                <TableCell>
                  <UserRowActions user={user} roles={roles} isSelf={user.id === currentUser?.sub} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        total={total}
        LinkComponent={Link}
        buildPageHref={(p: number) => buildListHref({ search, sortField, sortOrder }, p)}
        previousText={tCommon("previous")}
        nextText={tCommon("next")}
        infoText={paginationInfoText}
      />
    </div>
  );
}
