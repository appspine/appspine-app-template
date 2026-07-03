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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FieldError } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { deleteApiKeyAction, setApiKeyActiveAction, updateApiKeyActingUserAction } from "../actions";
import type { ApiKeyRow, ServiceAccountOption } from "../types";

export function ApiKeyRowActions({
  apiKey,
  serviceAccounts,
}: {
  apiKey: ApiKeyRow;
  serviceAccounts: ServiceAccountOption[];
}) {
  const t = useTranslations("apiKeys");
  const tCommon = useTranslations("common");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actingUserOpen, setActingUserOpen] = useState(false);
  const [selectedActingUserId, setSelectedActingUserId] = useState(apiKey.actingUserId ?? "__none");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await setApiKeyActiveAction(apiKey.id, !apiKey.isActive);
      if (result.error) setError(result.error);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteApiKeyAction(apiKey.id);
      if (result.error) {
        setError(result.error);
      } else {
        setDeleteOpen(false);
      }
    });
  }

  function handleActingUserSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await updateApiKeyActingUserAction(
        apiKey.id,
        selectedActingUserId === "__none" ? null : selectedActingUserId,
      );
      if (result.error) {
        setError(result.error);
      } else {
        setActingUserOpen(false);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${apiKey.name}`}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={toggleActive} disabled={isPending}>
            {apiKey.isActive ? t("deactivate") : t("activate")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActingUserOpen(true)}>{t("editActingUser")}</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={actingUserOpen} onOpenChange={setActingUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editActingUser")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Select value={selectedActingUserId} onValueChange={setSelectedActingUserId}>
              <SelectTrigger>
                <SelectValue placeholder={t("actingUserNone")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">{t("actingUserNone")}</SelectItem>
                {serviceAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <FieldError>{error}</FieldError>}
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleActingUserSubmit} disabled={isPending}>
              {isPending ? t("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteApiKeyTitle").replace("{name}", apiKey.name)}</AlertDialogTitle>
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
