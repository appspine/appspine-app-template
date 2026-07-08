"use server";

import { revalidatePath } from "next/cache";

import {
  createUserRequest,
  deleteUserRequest,
  setUserActiveRequest,
  setUserServiceAccountRequest,
  updateUserRolesRequest,
} from "@appspine/frontend-shell";

import { ApiError, apiFetch } from "@/server/api-client";

const isApiError = (e: unknown): e is { message: string } => e instanceof ApiError;

export async function createUserAction(formData: FormData) {
  const result = await createUserRequest(apiFetch, isApiError, formData);
  if (!result.error) revalidatePath("/dashboard/users");
  return result;
}

export async function setUserServiceAccountAction(id: string, isServiceAccount: boolean) {
  const result = await setUserServiceAccountRequest(apiFetch, isApiError, id, isServiceAccount);
  if (!result.error) revalidatePath("/dashboard/users");
  return result;
}

export async function setUserActiveAction(id: string, isActive: boolean) {
  const result = await setUserActiveRequest(apiFetch, isApiError, id, isActive);
  if (!result.error) revalidatePath("/dashboard/users");
  return result;
}

export async function updateUserRolesAction(id: string, formData: FormData) {
  const result = await updateUserRolesRequest(apiFetch, isApiError, id, formData);
  if (!result.error) revalidatePath("/dashboard/users");
  return result;
}

export async function deleteUserAction(id: string) {
  const result = await deleteUserRequest(apiFetch, isApiError, id);
  if (!result.error) revalidatePath("/dashboard/users");
  return result;
}
