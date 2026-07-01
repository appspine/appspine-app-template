"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { createRoleAction } from "../actions";
import { PERMISSION_OPTIONS, PERMISSION_POLICIES } from "../types";

export function CreateRoleDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createRoleAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button>New Role</Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create role</DialogTitle>
            <DialogDescription>The name cannot be changed after creation.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="new-role-name">Name</FieldLabel>
              <Input
                id="new-role-name"
                name="name"
                type="text"
                placeholder="EDITOR"
                pattern="[A-Z][A-Z0-9_]*"
                title="Uppercase letters, numbers and underscores, starting with a letter"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-role-display-name">Display name</FieldLabel>
              <Input id="new-role-display-name" name="displayName" type="text" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-role-policy">Permission policy</FieldLabel>
              <Select name="permissionPolicy" defaultValue="DENY_ALL">
                <SelectTrigger id="new-role-policy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_POLICIES.map((policy) => (
                    <SelectItem key={policy} value={policy}>
                      {policy}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Permissions</FieldLabel>
              <div className="flex flex-col gap-2">
                {PERMISSION_OPTIONS.map((permission) => (
                  <Label key={permission} className="flex items-center gap-2 font-normal">
                    <Checkbox name="permissions" value={permission} />
                    {permission}
                  </Label>
                ))}
              </div>
            </Field>
            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
