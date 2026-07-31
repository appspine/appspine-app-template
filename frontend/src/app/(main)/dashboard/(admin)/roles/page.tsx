import Link from "next/link";

import type { RoleRow } from "@appspine/frontend-shell";
import { CreateRoleDialog, ListPagination, ListSearchForm, RolesTable } from "@appspine/frontend-shell";
import type { SchemaMeta } from "@appspine/metadata-schema";

import { getTranslations } from "@/i18n/server";
import { enumLabel } from "@/lib/i18n/enum-label";
import type { PaginatedResult } from "@/server/api-client";
import { apiFetch } from "@/server/api-client";
import { buildListHref, buildSortHref, formatPageInfo, parseSortOrder } from "@/server/list-url";

import { createRoleAction, deleteRoleAction, updateRoleAction } from "./actions";

const PAGE_SIZE = 20;

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sortField?: string; sortOrder?: string }>;
}) {
  const t = await getTranslations("roles");
  const tCommon = await getTranslations("common");
  const tEnum = await getTranslations("enums");

  const { page: pageParam, search = "", sortField, sortOrder: sortOrderParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const sortOrder = parseSortOrder(sortOrderParam);

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (search) query.set("search", search);
  if (sortField) query.set("sortField", sortField);
  if (sortOrder) query.set("sortOrder", sortOrder);

  const { data: roles, total } = await apiFetch<PaginatedResult<RoleRow>>(`/roles?${query}`);
  const meta = await apiFetch<SchemaMeta>("/metadata/schema");
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const permissionPolicyOptions = meta.enums
    .find((enumMeta) => enumMeta.name === "PermissionPolicy")
    ?.values.map((value) => value.name);
  const permissionOptions = meta.enums
    .find((enumMeta) => enumMeta.name === "Permission")
    ?.values.map((value) => value.name);

  if (!permissionPolicyOptions || !permissionOptions) {
    throw new Error("Missing PermissionPolicy or Permission enum metadata from /metadata/schema");
  }

  const paginationInfoText = formatPageInfo(t("pageInfo"), { page, totalPages, total });

  // CreateRoleDialog is a Client Component, so it can't receive a raw render
  // function like `enumLabel` across the Server/Client boundary — resolve
  // the labels here into plain, serializable { value, label } data instead.
  const policyOptionsWithLabels = permissionPolicyOptions.map((value) => ({
    value,
    label: enumLabel(tEnum, "PermissionPolicy", value),
  }));
  const permissionOptionsWithLabels = permissionOptions.map((value) => ({
    value,
    label: enumLabel(tEnum, "Permission", value),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl tracking-tight">{t("title")}</h1>
        <CreateRoleDialog
          policyOptions={policyOptionsWithLabels}
          permissionOptions={permissionOptionsWithLabels}
          createRoleAction={createRoleAction}
        />
      </div>

      <ListSearchForm defaultValue={search} placeholder={t("searchPlaceholder")} searchButtonText={tCommon("search")} />

      <RolesTable
        roles={roles}
        policyOptions={permissionPolicyOptions}
        permissionOptions={permissionOptions}
        sortField={sortField}
        sortOrder={sortOrder}
        LinkComponent={Link}
        buildSortHref={(field, order) => buildSortHref({ search }, field, order)}
        t={t}
        renderEnumLabel={(kind, value) => enumLabel(tEnum, kind, value)}
        updateRoleAction={updateRoleAction}
        deleteRoleAction={deleteRoleAction}
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
