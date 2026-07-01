import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl tracking-tight">Users</h1>
        {/* AUTH_MODE=oidc: identity is owned by the external IdP, so local account
            creation is hidden here (dev_docs 001 "身份/權限細節"). Role assignment
            below stays visible in both modes. */}
        {showLocalAuthUi && <CreateUserDialog roles={roles} />}
      </div>

      <form className="flex gap-2">
        <Input name="search" placeholder="Search by name or email" defaultValue={search} className="max-w-sm" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No users found.
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
                <Badge variant={user.isActive ? "default" : "outline"}>{user.isActive ? "Active" : "Inactive"}</Badge>
              </TableCell>
              <TableCell>
                <UserRowActions user={user} roles={roles} isSelf={user.id === currentUser?.sub} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <span>
          Page {page} of {totalPages} ({total} total)
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={buildPageHref(search, page - 1)}>Previous</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
          {page < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={buildPageHref(search, page + 1)}>Next</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
