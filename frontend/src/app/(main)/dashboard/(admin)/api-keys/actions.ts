"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/server/api-client";

import type { CreateApiKeyResponse } from "./types";

export interface ActionResult {
  error?: string;
}

export interface CreateApiKeyResult extends ActionResult {
  created?: CreateApiKeyResponse;
}

export async function createApiKeyAction(formData: FormData): Promise<CreateApiKeyResult> {
  const rateLimitRaw = formData.get("rateLimit");
  const expiresAtRaw = formData.get("expiresAt");
  const actingUserIdRaw = formData.get("actingUserId");
  const actingUserId = actingUserIdRaw && actingUserIdRaw !== "__none" ? String(actingUserIdRaw) : undefined;

  try {
    const created = await apiFetch<CreateApiKeyResponse>("/api-keys", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        roleId: formData.get("roleId"),
        scopes: formData.getAll("scopes").map(String),
        actingUserId,
        rateLimit: rateLimitRaw ? Number(rateLimitRaw) : undefined,
        expiresAt: expiresAtRaw ? new Date(String(expiresAtRaw)).toISOString() : undefined,
      }),
    });
    revalidatePath("/dashboard/api-keys");
    return { created };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create API key" };
  }
}

export async function updateApiKeyActingUserAction(id: string, actingUserId: string | null): Promise<ActionResult> {
  try {
    await apiFetch(`/api-keys/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ actingUserId }),
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to update acting user" };
  }
  revalidatePath("/dashboard/api-keys");
  return {};
}

export async function setApiKeyActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await apiFetch(`/api-keys/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to update API key" };
  }
  revalidatePath("/dashboard/api-keys");
  return {};
}

export async function deleteApiKeyAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch(`/api-keys/${id}`, { method: "DELETE" });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to delete API key" };
  }
  revalidatePath("/dashboard/api-keys");
  return {};
}
