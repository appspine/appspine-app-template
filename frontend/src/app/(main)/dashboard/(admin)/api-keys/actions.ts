"use server";

import { revalidatePath } from "next/cache";

import {
  createApiKeyRequest,
  deleteApiKeyRequest,
  setApiKeyActiveRequest,
  updateApiKeyActingUserRequest,
} from "@appspine/frontend-shell";

import { ApiError, apiFetch } from "@/server/api-client";

const isApiError = (e: unknown): e is { message: string } => e instanceof ApiError;

export async function createApiKeyAction(formData: FormData) {
  const result = await createApiKeyRequest(apiFetch, isApiError, formData);
  if (result.created || !result.error) revalidatePath("/dashboard/api-keys");
  return result;
}

export async function updateApiKeyActingUserAction(id: string, actingUserId: string | null) {
  const result = await updateApiKeyActingUserRequest(apiFetch, isApiError, id, actingUserId);
  if (!result.error) revalidatePath("/dashboard/api-keys");
  return result;
}

export async function setApiKeyActiveAction(id: string, isActive: boolean) {
  const result = await setApiKeyActiveRequest(apiFetch, isApiError, id, isActive);
  if (!result.error) revalidatePath("/dashboard/api-keys");
  return result;
}

export async function deleteApiKeyAction(id: string) {
  const result = await deleteApiKeyRequest(apiFetch, isApiError, id);
  if (!result.error) revalidatePath("/dashboard/api-keys");
  return result;
}
