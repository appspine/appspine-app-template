"use server";

import { revalidatePath } from "next/cache";

import { createRoleRequest, deleteRoleRequest, updateRoleRequest } from "@appspine/frontend-shell";

import { ApiError, apiFetch } from "@/server/api-client";

const isApiError = (e: unknown): e is { message: string } => e instanceof ApiError;

export async function createRoleAction(formData: FormData) {
  const result = await createRoleRequest(apiFetch, isApiError, formData);
  if (!result.error) revalidatePath("/dashboard/roles");
  return result;
}

export async function updateRoleAction(id: string, formData: FormData) {
  const result = await updateRoleRequest(apiFetch, isApiError, id, formData);
  if (!result.error) revalidatePath("/dashboard/roles");
  return result;
}

export async function deleteRoleAction(id: string) {
  const result = await deleteRoleRequest(apiFetch, isApiError, id);
  if (!result.error) revalidatePath("/dashboard/roles");
  return result;
}
