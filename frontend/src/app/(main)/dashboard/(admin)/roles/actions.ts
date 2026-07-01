"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/server/api-client";

export interface ActionResult {
  error?: string;
}

export async function createRoleAction(formData: FormData): Promise<ActionResult> {
  try {
    await apiFetch("/roles", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        displayName: formData.get("displayName"),
        permissionPolicy: formData.get("permissionPolicy"),
        permissions: formData.getAll("permissions").map(String),
      }),
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create role" };
  }
  revalidatePath("/dashboard/roles");
  return {};
}

export async function updateRoleAction(id: string, formData: FormData): Promise<ActionResult> {
  const body: Record<string, unknown> = {
    displayName: formData.get("displayName"),
    permissionPolicy: formData.get("permissionPolicy"),
  };
  // ADMIN's permissions are fixed via guard bypass — the checkboxes are disabled
  // for it client-side, but omit the field here too so a PATCH on ADMIN never
  // even attempts to touch permissions.
  if (formData.get("editablePermissions") === "true") {
    body.permissions = formData.getAll("permissions").map(String);
  }
  try {
    await apiFetch(`/roles/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to update role" };
  }
  revalidatePath("/dashboard/roles");
  return {};
}

export async function deleteRoleAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch(`/roles/${id}`, { method: "DELETE" });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to delete role" };
  }
  revalidatePath("/dashboard/roles");
  return {};
}
