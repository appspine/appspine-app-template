import Link from "next/link";

import type { ApiKeyRoleOption, ApiKeyRow, ServiceAccountOption } from "@appspine/frontend-shell";
import { ListPagination, ListSearchForm } from '@appspine/frontend-shell';
import { ApiKeysTable, CreateApiKeyDialog } from '@appspine/m2m-api-key/frontend';
import type { SchemaMeta } from "@appspine/metadata-schema";

import { getTranslations } from "@/i18n/server";
import type { PaginatedResult } from "@/server/api-client";
import { apiFetch } from "@/server/api-client";
import { buildListHref, buildSortHref, formatPageInfo, parseSortOrder } from "@/server/list-url";

import { createApiKeyAction, deleteApiKeyAction, setApiKeyActiveAction, updateApiKeyActingUserAction } from "./actions";

const PAGE_SIZE = 20;

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sortField?: string; sortOrder?: string }>;
}) {
  const tApiKeys = await getTranslations("apiKeys");
  const tCommon = await getTranslations("common");

  const { page: pageParam, search = "", sortField, sortOrder: sortOrderParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const sortOrder = parseSortOrder(sortOrderParam);

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (search) query.set("search", search);
  if (sortField) query.set("sortField", sortField);
  if (sortOrder) query.set("sortOrder", sortOrder);

  const [{ data: apiKeys, total }, roles, { data: users }, meta] = await Promise.all([
    apiFetch<PaginatedResult<ApiKeyRow>>(`/api-keys?${query}`),
    apiFetch<ApiKeyRoleOption[]>("/roles/options"),
    apiFetch<PaginatedResult<ServiceAccountOption & { isServiceAccount: boolean }>>("/users?limit=100"),
    apiFetch<SchemaMeta>("/metadata/schema"),
  ]);
  const serviceAccounts: ServiceAccountOption[] = users
    .filter((user) => user.isServiceAccount)
    .map(({ id, email, name }) => ({ id, email, name }));
  const scopeOptions = meta.availableScopes.map((scope) => ({ value: scope, label: scope }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const paginationInfoText = formatPageInfo(tApiKeys("pageInfo"), { page, totalPages, total });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl tracking-tight">{tApiKeys("title")}</h1>
        <CreateApiKeyDialog
          roles={roles}
          serviceAccounts={serviceAccounts}
          scopeOptions={scopeOptions}
          createApiKeyAction={createApiKeyAction}
        />
      </div>

      <ListSearchForm
        defaultValue={search}
        placeholder={tApiKeys("searchPlaceholder")}
        searchButtonText={tCommon("search")}
      />

      <ApiKeysTable
        apiKeys={apiKeys}
        serviceAccounts={serviceAccounts}
        sortField={sortField}
        sortOrder={sortOrder}
        LinkComponent={Link}
        buildSortHref={(field, order) => buildSortHref({ search }, field, order)}
        t={tApiKeys}
        setApiKeyActiveAction={setApiKeyActiveAction}
        deleteApiKeyAction={deleteApiKeyAction}
        updateApiKeyActingUserAction={updateApiKeyActingUserAction}
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
