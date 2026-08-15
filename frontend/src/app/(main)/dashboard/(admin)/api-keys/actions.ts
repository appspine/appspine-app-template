"use server";

import { revalidatePath } from "next/cache";

import {
  createApiKeyRequest,
  deleteApiKeyRequest,
  setApiKeyActiveRequest,
  updateApiKeyActingUserRequest,
} from "@appspine/frontend-shell";

import { ApiError, apiFetch } from "@/server/api-client";
import { requireAdmin } from "@/server/require-admin";

const isApiError = (e: unknown): e is { message: string } => e instanceof ApiError;

export async function createApiKeyAction(formData: FormData) {
  await requireAdmin();
  const result = await createApiKeyRequest(apiFetch, isApiError, formData);
  if (result.created || !result.error) revalidatePath("/dashboard/api-keys");
  return result;
}

export async function updateApiKeyActingUserAction(id: string, actingUserId: string | null) {
  await requireAdmin();
  const result = await updateApiKeyActingUserRequest(apiFetch, isApiError, id, actingUserId);
  if (!result.error) revalidatePath("/dashboard/api-keys");
  return result;
}

export async function setApiKeyActiveAction(id: string, isActive: boolean) {
  await requireAdmin();
  const result = await setApiKeyActiveRequest(apiFetch, isApiError, id, isActive);
  if (!result.error) revalidatePath("/dashboard/api-keys");
  return result;
}

export async function deleteApiKeyAction(id: string) {
  await requireAdmin();
  const result = await deleteApiKeyRequest(apiFetch, isApiError, id);
  if (!result.error) revalidatePath("/dashboard/api-keys");
  return result;
}
