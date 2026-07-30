import type { DefaultSession } from "next-auth";

// Extends next-auth's Session with the upstream Keycloak access token
// (dev_docs/framework/035 §4.1) — this is NOT next-auth's own session token, it's what
// api-client.ts sends as the Bearer token to this app's backend.
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    user: DefaultSession["user"];
  }
}
