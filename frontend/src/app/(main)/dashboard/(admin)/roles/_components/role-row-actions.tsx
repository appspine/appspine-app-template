"use client";

import { useState, useTransition } from "react";

import { useTranslations } from "@appspine/frontend-shell";
import { MoreHorizontal } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { enumLabel } from "@/lib/i18n/enum-label";

import { deleteRoleAction, updateRoleAction } from "../actions";
import type { RoleRow } from "../types";

export function RoleRowActions({
  role,
  policyOptions,
  permissionOptions,
}: {
  role: RoleRow;
  policyOptions: readonly string[];
  permissionOptions: readonly string[];
}) {
  const t = useTranslations("roles");
  const tCommon = useTranslations("common");
  const tEnum = useTranslations("enums");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role.name === "ADMIN";
  const canDelete = !role.isSystem && role.userCount === 0 && role.apiKeyCount === 0;

  function handleEditSubmit(formData: FormData) {
    setError(null);
    formData.set("editablePermissions", String(!isAdmin));
    startTransition(async () => {
      const result = await updateRoleAction(role.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setEditOpen(false);
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteRoleAction(role.id);
      if (result.error) {
        setError(result.error);
      } else {
        setDeleteOpen(false);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${role.displayName}`}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>{t("edit")}</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" disabled={!canDelete} onSelect={() => setDeleteOpen(true)}>
            {t("delete")}
            {canDelete ? "" : t("cantDeleteInUse")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={editOpen}
        onOpenChange={(next) => {
          setEditOpen(next);
          if (next) setError(null);
        }}
      >
        <DialogContent>
          <form action={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>{t("editRoleTitle").replace("{name}", role.name)}</DialogTitle>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor={`edit-role-display-name-${role.id}`}>{t("displayName")}</FieldLabel>
                <Input
                  id={`edit-role-display-name-${role.id}`}
                  name="displayName"
                  type="text"
                  defaultValue={role.displayName}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`edit-role-policy-${role.id}`}>{t("permissionPolicy")}</FieldLabel>
                <Select name="permissionPolicy" defaultValue={role.permissionPolicy} disabled={isAdmin}>
                  <SelectTrigger id={`edit-role-policy-${role.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {policyOptions.map((policy) => (
                      <SelectItem key={policy} value={policy}>
                        {enumLabel(tEnum, "PermissionPolicy", policy)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>
                  {t("permissions")}
                  {isAdmin && (
                    <span className="font-normal text-muted-foreground">{t("permissionsManagedForAdmin")}</span>
                  )}
                </FieldLabel>
                <div className="flex flex-col gap-2">
                  {permissionOptions.map((permission) => (
                    <Label key={permission} className="flex items-center gap-2 font-normal">
                      <Checkbox
                        name="permissions"
                        value={permission}
                        disabled={isAdmin}
                        defaultChecked={role.permissions.includes(permission)}
                      />
                      {enumLabel(tEnum, "Permission", permission)}
                    </Label>
                  ))}
                </div>
              </Field>
              {error && <FieldError>{error}</FieldError>}
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("saving") : tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteRoleTitle").replace("{name}", role.displayName)}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteWarning")}</AlertDialogDescription>
          </AlertDialogHeader>
          {error && <FieldError>{error}</FieldError>}
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
