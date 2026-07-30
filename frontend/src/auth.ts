import NextAuth from "next-auth";
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
    async session({ session, token }) {
      session.accessToken = typeof token.accessToken === "string" ? token.accessToken : undefined;
      session.error = typeof token.error === "string" ? token.error : undefined;
      return session;
    },
  },
});
