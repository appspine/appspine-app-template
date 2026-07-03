"use server";

import { redirect } from "next/navigation";

import { clearAuthCookie, setAuthCookie } from "./auth-cookie";

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const API_BASE_URL = readRequiredEnv("NEXT_PUBLIC_API_URL");

export interface LoginResult {
  error?: string;
}

// Only applies under AUTH_MODE=local — the backend's /auth/login returns 404 under
// AUTH_MODE=oidc (dev_docs 001), which surfaces here as a generic "Login failed"
// error. Presenting an OIDC-appropriate login screen (e.g. redirect to the external
// IdP) is out of scope for this task (dev_docs/004-task-breakdown.md T-302).
export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    return { error: body?.message ?? "Login failed" };
  }

  const { token } = (await res.json()) as { token: string };
  await setAuthCookie(token);
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await clearAuthCookie();
  redirect("/login");
}
