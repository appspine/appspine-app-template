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

import { createUserAction } from "../actions";
import type { RoleOption } from "../types";

export function CreateUserDialog({ roles }: { roles: RoleOption[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createUserAction(formData);
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
        <Button>New User</Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>Creates a local account with a password.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="new-user-email">Email</FieldLabel>
              <Input id="new-user-email" name="email" type="email" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-user-password">Password</FieldLabel>
              <Input id="new-user-password" name="password" type="password" minLength={8} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-user-name">Name</FieldLabel>
              <Input id="new-user-name" name="name" type="text" />
            </Field>
            <Field>
              <FieldLabel>Roles</FieldLabel>
              <div className="flex flex-col gap-2">
                {roles.map((role) => (
                  <Label key={role.id} className="flex items-center gap-2 font-normal">
                    <Checkbox name="roleIds" value={role.id} />
                    {role.displayName}
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
