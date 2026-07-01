import Link from "next/link";

import { ListPagination, ListSearchForm } from "@appspine/frontend-shell";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTranslations } from "@/i18n/server";
import type { PaginatedResult } from "@/server/api-client";
import { apiFetch } from "@/server/api-client";

import { ApiKeyRowActions } from "./_components/api-key-row-actions";
import { CreateApiKeyDialog } from "./_components/create-api-key-dialog";
import type { ApiKeyRow, RoleOption } from "./types";

const PAGE_SIZE = 20;

function buildPageHref(search: string, page: number): string {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);
  return `?${params}`;
}

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const tApiKeys = await getTranslations("apiKeys");
  const tCommon = await getTranslations("common");

  const { page: pageParam, search = "" } = await searchParams;
  const page = Number(pageParam) || 1;

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (search) query.set("search", search);

  const [{ data: apiKeys, total }, roles] = await Promise.all([
    apiFetch<PaginatedResult<ApiKeyRow>>(`/api-keys?${query}`),
    apiFetch<RoleOption[]>("/roles"),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const paginationInfoText = tApiKeys("pageInfo")
    .replace("{page}", String(page))
    .replace("{totalPages}", String(totalPages))
    .replace("{total}", String(total));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl tracking-tight">{tApiKeys("title")}</h1>
        <CreateApiKeyDialog roles={roles} />
      </div>

      <ListSearchForm
        defaultValue={search}
        placeholder={tApiKeys("searchPlaceholder")}
        searchButtonText={tCommon("search")}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tApiKeys("name")}</TableHead>
            <TableHead>{tApiKeys("key")}</TableHead>
            <TableHead>{tApiKeys("role")}</TableHead>
            <TableHead>{tApiKeys("scopes")}</TableHead>
            <TableHead>{tApiKeys("status")}</TableHead>
            <TableHead>{tApiKeys("lastUsed")}</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                {tApiKeys("noApiKeys")}
              </TableCell>
            </TableRow>
          )}
          {apiKeys.map((apiKey) => (
            <TableRow key={apiKey.id}>
              <TableCell>{apiKey.name}</TableCell>
              <TableCell className="font-mono text-muted-foreground text-xs">{apiKey.prefix}…</TableCell>
              <TableCell>{apiKey.role.displayName}</TableCell>
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
                <ApiKeyRowActions apiKey={apiKey} />
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
