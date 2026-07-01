import Link from "next/link";

import { ListPagination, ListSearchForm } from "@appspine/frontend-shell";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTranslations } from "@/i18n/server";
import type { PaginatedResult } from "@/server/api-client";
import { apiFetch } from "@/server/api-client";
import { isLocalAuthMode } from "@/server/auth-mode";
import { getCurrentUser } from "@/server/current-user";

import { CreateUserDialog } from "./_components/create-user-dialog";
import { UserRowActions } from "./_components/user-row-actions";
import type { RoleOption, UserRow } from "./types";

const PAGE_SIZE = 20;

function buildPageHref(search: string, page: number): string {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);
  return `?${params}`;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const tUsers = await getTranslations("users");
  const tCommon = await getTranslations("common");

  const { page: pageParam, search = "" } = await searchParams;
  const page = Number(pageParam) || 1;

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (search) query.set("search", search);

  const [{ data: users, total }, roles, currentUser] = await Promise.all([
    apiFetch<PaginatedResult<UserRow>>(`/users?${query}`),
    apiFetch<RoleOption[]>("/roles"),
    getCurrentUser(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showLocalAuthUi = isLocalAuthMode();

  const paginationInfoText = tUsers("pageInfo")
    .replace("{page}", String(page))
    .replace("{totalPages}", String(totalPages))
    .replace("{total}", String(total));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl tracking-tight">{tUsers("title")}</h1>
        {/* AUTH_MODE=oidc: identity is owned by the external IdP, so local account
            creation is hidden here (dev_docs 001 "身份/權限細節"). Role assignment
            below stays visible in both modes. */}
        {showLocalAuthUi && <CreateUserDialog roles={roles} />}
      </div>

      <ListSearchForm
        defaultValue={search}
        placeholder={tUsers("searchPlaceholder")}
        searchButtonText={tCommon("search")}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tUsers("email")}</TableHead>
            <TableHead>{tUsers("name")}</TableHead>
            <TableHead>{tUsers("roles")}</TableHead>
            <TableHead>{tUsers("status")}</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {tUsers("noUsers")}
              </TableCell>
            </TableRow>
          )}
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.name ?? "—"}</TableCell>
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
                <UserRowActions user={user} roles={roles} isSelf={user.id === currentUser?.sub} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ListPagination
        page={page}
        totalPages={totalPages}
        total={total}
        LinkComponent={Link}
        buildPageHref={(p: number) => buildPageHref(search, p)}
        previousText={tCommon("previous")}
        nextText={tCommon("next")}
        infoText={paginationInfoText}
      />
    </div>
  );
}
