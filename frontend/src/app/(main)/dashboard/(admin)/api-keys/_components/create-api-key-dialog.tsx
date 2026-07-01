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

import { createApiKeyAction } from "../actions";
import type { CreateApiKeyResponse, RoleOption } from "../types";
import { SCOPE_ACTIONS, SCOPE_RESOURCES } from "../types";
import { CreatedApiKeyReveal } from "./created-api-key-reveal";

export function CreateApiKeyDialog({ roles }: { roles: RoleOption[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateApiKeyResponse | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createApiKeyAction(formData);
      if (result.error || !result.created) {
        setError(result.error ?? "Failed to create API key");
      } else {
        setCreated(result.created);
      }
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setError(null);
      setCreated(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>New API Key</Button>
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <CreatedApiKeyReveal created={created} onDone={() => setOpen(false)} />
        ) : (
          <form action={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>The key is shown once, right after creation.</DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="new-key-name">Name</FieldLabel>
                <Input id="new-key-name" name="name" type="text" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-key-role">Role</FieldLabel>
                <Select name="roleId" required>
                  <SelectTrigger id="new-key-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Scopes</FieldLabel>
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-2 font-normal">
                    <Checkbox name="scopes" value="*" />* (full access)
                  </Label>
                  {SCOPE_RESOURCES.map((resource) =>
                    SCOPE_ACTIONS.map((action) => (
                      <Label key={`${resource}:${action}`} className="flex items-center gap-2 font-normal">
                        <Checkbox name="scopes" value={`${resource}:${action}`} />
                        {resource}:{action}
                      </Label>
                    )),
                  )}
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="new-key-rate-limit">Rate limit (requests/min, optional)</FieldLabel>
                <Input id="new-key-rate-limit" name="rateLimit" type="number" min={1} max={600} />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-key-expires-at">Expires at (optional)</FieldLabel>
                <Input id="new-key-expires-at" name="expiresAt" type="datetime-local" />
              </Field>
              {error && <FieldError>{error}</FieldError>}
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
