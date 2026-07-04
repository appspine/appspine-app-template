import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";

// Public paths that don't require the auth cookie.
const PUBLIC_PATHS = ["/login"];

// Deliberately does NOT decode/verify the JWT — middleware runs in the Edge runtime
// with no access to JWT_SECRET, and role-based (ADMIN-only) protection needs a
// server-side /auth/me call anyway (dev_docs/004-task-breakdown.md T-305). This is
// just the coarse "is there an auth cookie at all" gate.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // `api(?:/|$)` (not bare `api`) so only the /api route-handler namespace is
  // excluded — a future page route like /api-docs must still hit the auth gate.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api(?:/|$)).*)"],
};
