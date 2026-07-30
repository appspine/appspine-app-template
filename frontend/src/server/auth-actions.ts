"use server";

import { signIn, signOut } from "@/auth";

export async function login(): Promise<void> {
  await signIn("keycloak", { redirectTo: "/dashboard" });
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
