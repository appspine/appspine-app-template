"use client";

import { useState, useTransition } from "react";

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
import { FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";

import { deleteUserAction, setUserActiveAction, updateUserRolesAction } from "../actions";
import type { RoleOption, UserRow } from "../types";

export function UserRowActions({ user, roles, isSelf }: { user: UserRow; roles: RoleOption[]; isSelf: boolean }) {
  const [rolesOpen, setRolesOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await setUserActiveAction(user.id, !user.isActive);
      if (result.error) setError(result.error);
    });
  }

  function handleRolesSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateUserRolesAction(user.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setRolesOpen(false);
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteUserAction(user.id);
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
          <Button variant="ghost" size="icon" aria-label={`Actions for ${user.email}`}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setRolesOpen(true)}>Manage roles</DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleActive} disabled={isPending}>
            {user.isActive ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" disabled={isSelf} onSelect={() => setDeleteOpen(true)}>
            Delete{isSelf ? " (can't delete yourself)" : ""}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={rolesOpen} onOpenChange={setRolesOpen}>
        <DialogContent>
          <form action={handleRolesSubmit}>
            <DialogHeader>
              <DialogTitle>Roles for {user.email}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-4">
              {roles.map((role) => (
                <Label key={role.id} className="flex items-center gap-2 font-normal">
                  <Checkbox name="roleIds" value={role.id} defaultChecked={user.roles.some((r) => r.id === role.id)} />
                  {role.displayName}
                </Label>
              ))}
              {error && <FieldError>{error}</FieldError>}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {user.email}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          {error && <FieldError>{error}</FieldError>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
