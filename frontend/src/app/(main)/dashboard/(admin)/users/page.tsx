import Link from "next/link";

import type { UserRoleOption, UserRow } from "@appspine/frontend-shell";
import { CreateUserDialog, ListPagination, ListSearchForm, UsersTable } from "@appspine/frontend-shell";

import { getTranslations } from "@/i18n/server";
import type { PaginatedResult } from "@/server/api-client";
import { apiFetch } from "@/server/api-client";
import { isLocalAuthMode } from "@/server/auth-mode";
import { getCurrentUser } from "@/server/current-user";
import { buildListHref, buildSortHref, formatPageInfo, parseSortOrder } from "@/server/list-url";

import {
  createUserAction,
  deleteUserAction,
  setUserActiveAction,
  setUserServiceAccountAction,
  updateUserRolesAction,
} from "./actions";

const PAGE_SIZE = 20;

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
    apiFetch<UserRoleOption[]>("/roles/options"),
    getCurrentUser(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showLocalAuthUi = isLocalAuthMode();

  const paginationInfoText = formatPageInfo(tUsers("pageInfo"), { page, totalPages, total });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl tracking-tight">{tUsers("title")}</h1>
        {showLocalAuthUi && <CreateUserDialog roles={roles} createUserAction={createUserAction} />}
      </div>

      <ListSearchForm
        defaultValue={search}
        placeholder={tUsers("searchPlaceholder")}
        searchButtonText={tCommon("search")}
      />

      <UsersTable
        users={users}
        roles={roles}
        currentUserId={currentUser?.sub}
        sortField={sortField}
        sortOrder={sortOrder}
        LinkComponent={Link}
        buildSortHref={(field, order) => buildSortHref({ search }, field, order)}
        t={(key) => tUsers(key as any)}
        setUserActiveAction={setUserActiveAction}
        setUserServiceAccountAction={setUserServiceAccountAction}
        updateUserRolesAction={updateUserRolesAction}
        deleteUserAction={deleteUserAction}
      />

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
