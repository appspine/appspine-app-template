import Link from "next/link";

import { ListPagination, ListSearchForm, SortableColumnHeader } from "@appspine/frontend-shell";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTranslations } from "@/i18n/server";
import type { PaginatedResult } from "@/server/api-client";
import { apiFetch } from "@/server/api-client";
import { buildListHref, buildSortHref, formatPageInfo, parseSortOrder } from "@/server/list-url";

import { CreateRoleDialog } from "./_components/create-role-dialog";
import { RoleRowActions } from "./_components/role-row-actions";
import type { RoleRow } from "./types";

const PAGE_SIZE = 20;

type RoleSortField = "displayName" | "userCount" | "apiKeyCount";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sortField?: string; sortOrder?: string }>;
}) {
  const t = await getTranslations("roles");
  const tCommon = await getTranslations("common");

  const { page: pageParam, search = "", sortField, sortOrder: sortOrderParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const sortOrder = parseSortOrder(sortOrderParam);

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (search) query.set("search", search);
  if (sortField) query.set("sortField", sortField);
  if (sortOrder) query.set("sortOrder", sortOrder);

  const { data: roles, total } = await apiFetch<PaginatedResult<RoleRow>>(`/roles?${query}`);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const paginationInfoText = formatPageInfo(t("pageInfo"), { page, totalPages, total });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl tracking-tight">{t("title")}</h1>
        <CreateRoleDialog />
      </div>

      <ListSearchForm defaultValue={search} placeholder={t("searchPlaceholder")} searchButtonText={tCommon("search")} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableColumnHeader<RoleSortField>
                  label={t("name")}
                  field="displayName"
                  currentSortField={sortField}
                  currentSortOrder={sortOrder}
                  LinkComponent={Link}
                  buildSortHref={(field, order) => buildSortHref({ search }, field, order)}
                />
              </TableHead>
              <TableHead>{t("policy")}</TableHead>
              <TableHead>{t("permissions")}</TableHead>
              <TableHead>
                <SortableColumnHeader<RoleSortField>
                  label={t("users")}
                  field="userCount"
                  currentSortField={sortField}
                  currentSortOrder={sortOrder}
                  LinkComponent={Link}
                  buildSortHref={(field, order) => buildSortHref({ search }, field, order)}
                />
              </TableHead>
              <TableHead>
                <SortableColumnHeader<RoleSortField>
                  label={t("apiKeys")}
                  field="apiKeyCount"
                  currentSortField={sortField}
                  currentSortOrder={sortOrder}
                  LinkComponent={Link}
                  buildSortHref={(field, order) => buildSortHref({ search }, field, order)}
                />
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {t("noRoles")}
                </TableCell>
              </TableRow>
            )}
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {role.displayName}
                    {role.isSystem && (
                      <Badge variant="outline" title={t("systemRoleDeleteWarning")}>
                        {t("systemBadge")}
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">{role.name}</div>
                </TableCell>
                <TableCell>{role.permissionPolicy}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((permission) => (
                      <Badge key={permission} variant="secondary">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{role.userCount}</TableCell>
                <TableCell>{role.apiKeyCount}</TableCell>
                <TableCell>
                  <RoleRowActions role={role} />
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
