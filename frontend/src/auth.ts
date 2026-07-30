import { headers } from "next/headers";

import NextAuth from "next-auth";
import { getToken } from "next-auth/jwt";
import Keycloak from "next-auth/providers/keycloak";

// Server-only: reads secrets that must never reach the client bundle.

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

interface RefreshedTokens {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

// The backend's OidcStrategy validates the Keycloak access token directly (Bearer), not
// next-auth's own session cookie — the two are different tokens (dev_docs/framework/035
// §4.1). next-auth only refreshes its own session; refreshing the upstream Keycloak
// access token is this app's responsibility.
async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    const issuer = readRequiredEnv("AUTH_KEYCLOAK_ISSUER");
    const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: readRequiredEnv("AUTH_KEYCLOAK_ID"),
        client_secret: readRequiredEnv("AUTH_KEYCLOAK_SECRET"),
        refresh_token: String(token.refreshToken ?? ""),
      }),
    });
    const refreshed = (await res.json()) as RefreshedTokens;
    if (!res.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    // Surfaced via session.error — callers (api-client.ts) treat this as unauthenticated
    // rather than sending a token that's guaranteed to be rejected.
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Dev-only: this app runs on a fixed localhost port that never matches what a
  // reverse proxy would send, and there is no reverse proxy in dev-infra.
  trustHost: true,
  providers: [
    Keycloak({
      clientId: readRequiredEnv("AUTH_KEYCLOAK_ID"),
      clientSecret: readRequiredEnv("AUTH_KEYCLOAK_SECRET"),
      issuer: readRequiredEnv("AUTH_KEYCLOAK_ISSUER"),
    }),
  ],
  pages: {
    signIn: "/login",
    // Without this, AuthError kinds other than sign-in (e.g. AccessDenied when
    // Keycloak's per-client conditional-deny flow rejects the user, or a callback/token
    // exchange failure) fall through to next-auth's own built-in error page instead of
    // this app's translated /login?error= handling.
    error: "/login",
  },
  callbacks: {
    async jwt({ token, account }) {
      // First sign-in: `account` carries the tokens Keycloak just issued.
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : undefined,
        };
      }

      // 30s skew margin so a request doesn't race the expiry boundary.
      if (typeof token.accessTokenExpires === "number" && Date.now() < token.accessTokenExpires - 30_000) {
        return token;
      }

      return refreshAccessToken(token);
    },
    // Deliberately does NOT attach accessToken/error here. This callback's return value
    // is exactly what GET /api/auth/session serves to any same-origin request —
    // including an XSS payload — so putting the Keycloak access token here would hand
    // out a live backend bearer credential to client-side JS. Server-only code that
    // needs the token calls getAccessToken() below instead, which never goes through
    // this callback and so never reaches that endpoint.
    async session({ session }) {
      return session;
    },
  },
});

// Server-only: returns a valid Keycloak access token for the current request (reading
// the AUTH_SECRET-encrypted session cookie directly via next-auth/jwt's getToken(),
// bypassing the `session` callback above so this never touches GET /api/auth/session),
// or undefined if there's no session or the refresh token is dead.
//
// Known limitation: refreshing here (like refreshing via the `jwt` callback through
// auth()) computes a new access token for use in *this* request, but Server Components
// can't set cookies, so the refreshed token isn't persisted back into the cookie — the
// next request re-reads the same pre-refresh cookie and refreshes again. This is
// currently harmless because dev-infra's realm has `revokeRefreshToken: false` (no
// refresh-token rotation), so reusing the same refresh_token repeatedly doesn't get it
// revoked — just extra round-trips to Keycloak. It WOULD break (mid-session logout) if
// rotation is ever turned on, at which point this needs a fix that can actually persist
// the refresh (a Route Handler or Server Action, not a Server Component render) — this
// is a known Next.js App Router constraint, not something specific to this app, and
// isn't fixed here because middleware.ts (the other place this is normally solved) is
// unavailable under Next.js 16 + next-auth v5 beta.
export async function getAccessToken(): Promise<string | undefined> {
  const token = await getToken({
    req: { headers: await headers() },
    secret: readRequiredEnv("AUTH_SECRET"),
  });
  if (!token || typeof token.error === "string") return undefined;

  if (typeof token.accessTokenExpires === "number" && Date.now() < token.accessTokenExpires - 30_000) {
    return typeof token.accessToken === "string" ? token.accessToken : undefined;
  }

  const refreshed = await refreshAccessToken(token);
  if (typeof refreshed.error === "string") return undefined;
  return typeof refreshed.accessToken === "string" ? refreshed.accessToken : undefined;
}
