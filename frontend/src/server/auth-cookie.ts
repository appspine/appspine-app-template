"use server";

import { cookies } from "next/headers";

// Keep in sync with the backend's JWT_EXPIRES_IN default (@appspine/auth), so the
// cookie doesn't outlive (or expire well before) the token it holds.
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const AUTH_COOKIE_NAME = "auth_token";

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
