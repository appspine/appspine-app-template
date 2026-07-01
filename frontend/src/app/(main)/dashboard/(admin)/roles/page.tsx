import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTranslations } from "@/i18n/server";
import { apiFetch } from "@/server/api-client";

import { CreateRoleDialog } from "./_components/create-role-dialog";
import { RoleRowActions } from "./_components/role-row-actions";
import type { RoleRow } from "./types";

export default async function RolesPage() {
  const t = await getTranslations("roles");
  const roles = await apiFetch<RoleRow[]>("/roles");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl tracking-tight">{t("title")}</h1>
        <CreateRoleDialog />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("policy")}</TableHead>
            <TableHead>{t("permissions")}</TableHead>
            <TableHead>{t("users")}</TableHead>
            <TableHead>{t("apiKeys")}</TableHead>
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
  );
}
