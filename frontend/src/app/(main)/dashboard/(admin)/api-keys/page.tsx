import Link from "next/link";

import { ListPagination, ListSearchForm, SortableColumnHeader } from "@appspine/frontend-shell";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTranslations } from "@/i18n/server";
import type { PaginatedResult } from "@/server/api-client";
import { apiFetch } from "@/server/api-client";
import { buildListHref, buildSortHref, formatPageInfo, parseSortOrder } from "@/server/list-url";

import { ApiKeyRowActions } from "./_components/api-key-row-actions";
import { CreateApiKeyDialog } from "./_components/create-api-key-dialog";
import type { ApiKeyRow, RoleOption, ServiceAccountOption } from "./types";

const PAGE_SIZE = 20;

type ApiKeySortField = "name" | "lastUsedAt";

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

  const [{ data: apiKeys, total }, roles, { data: users }] = await Promise.all([
    apiFetch<PaginatedResult<ApiKeyRow>>(`/api-keys?${query}`),
    apiFetch<RoleOption[]>("/roles/options"),
    apiFetch<PaginatedResult<ServiceAccountOption & { isServiceAccount: boolean }>>("/users?limit=100"),
  ]);
  const serviceAccounts: ServiceAccountOption[] = users
    .filter((user) => user.isServiceAccount)
    .map(({ id, email, name }) => ({ id, email, name }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const paginationInfoText = formatPageInfo(tApiKeys("pageInfo"), { page, totalPages, total });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl tracking-tight">{tApiKeys("title")}</h1>
        <CreateApiKeyDialog roles={roles} serviceAccounts={serviceAccounts} />
      </div>

      <ListSearchForm
        defaultValue={search}
        placeholder={tApiKeys("searchPlaceholder")}
        searchButtonText={tCommon("search")}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableColumnHeader<ApiKeySortField>
                  label={tApiKeys("name")}
                  field="name"
                  currentSortField={sortField}
                  currentSortOrder={sortOrder}
                  LinkComponent={Link}
                  buildSortHref={(field, order) => buildSortHref({ search }, field, order)}
                />
              </TableHead>
              <TableHead>{tApiKeys("key")}</TableHead>
              <TableHead>{tApiKeys("role")}</TableHead>
              <TableHead>{tApiKeys("actingUser")}</TableHead>
              <TableHead>{tApiKeys("scopes")}</TableHead>
              <TableHead>{tApiKeys("status")}</TableHead>
              <TableHead>
                <SortableColumnHeader<ApiKeySortField>
                  label={tApiKeys("lastUsed")}
                  field="lastUsedAt"
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
            {apiKeys.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  {tApiKeys("noApiKeys")}
                </TableCell>
              </TableRow>
            )}
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell>{apiKey.name}</TableCell>
                <TableCell className="font-mono text-muted-foreground text-xs">{apiKey.prefix}</TableCell>
                <TableCell>{apiKey.role.displayName}</TableCell>
                <TableCell>
                  {serviceAccounts.find((account) => account.id === apiKey.actingUserId)?.email ??
                    tApiKeys("actingUserNone")}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {apiKey.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={apiKey.isActive ? "default" : "outline"}>
                    {apiKey.isActive ? tApiKeys("active") : tApiKeys("inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleString() : tApiKeys("never")}
                </TableCell>
                <TableCell>
                  <ApiKeyRowActions apiKey={apiKey} serviceAccounts={serviceAccounts} />
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
