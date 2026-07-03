"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/server/api-client";

export interface ActionResult {
  error?: string;
}

export async function createUserAction(formData: FormData): Promise<ActionResult> {
  const roleIds = formData.getAll("roleIds").map(String);
  try {
    await apiFetch("/users", {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
        name: formData.get("name") || undefined,
        isServiceAccount: formData.get("isServiceAccount") === "on",
        roleIds: roleIds.length > 0 ? roleIds : undefined,
      }),
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create user" };
  }
  revalidatePath("/dashboard/users");
  return {};
}

export async function setUserServiceAccountAction(id: string, isServiceAccount: boolean): Promise<ActionResult> {
  try {
    await apiFetch(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isServiceAccount }),
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to update user" };
  }
  revalidatePath("/dashboard/users");
  return {};
}

export async function setUserActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await apiFetch(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to update user" };
  }
  revalidatePath("/dashboard/users");
  return {};
}

export async function updateUserRolesAction(id: string, formData: FormData): Promise<ActionResult> {
  const roleIds = formData.getAll("roleIds").map(String);
  try {
    await apiFetch(`/users/${id}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roleIds }),
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to update roles" };
  }
  revalidatePath("/dashboard/users");
  return {};
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch(`/users/${id}`, { method: "DELETE" });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to delete user" };
  }
  revalidatePath("/dashboard/users");
  return {};
}
