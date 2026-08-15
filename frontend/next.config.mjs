/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// Origins the browser is actually allowed to talk to, beyond 'self':
//   - the Nest backend (api-client.ts is server-only today, but client components
//     in a fork will hit it directly), and
//   - the Keycloak issuer (next-auth's Authorization Code flow navigates there,
//     and the front channel polls its endpoints).
function originOf(value) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_URL);
const keycloakOrigin = originOf(process.env.AUTH_KEYCLOAK_ISSUER);
const extraOrigins = [apiOrigin, keycloakOrigin].filter(Boolean);

// 'unsafe-inline' is unavoidable here, not laziness:
//   - script-src: <ThemeBootScript> (@appspine/frontend-shell) injects a
//     `strategy="beforeInteractive"` inline script with no nonce. Next.js only
//     nonces inline scripts when the CSP arrives on a *request* header set by
//     middleware, and middleware.ts is unavailable under Next 16 + next-auth v5
//     beta in this template (see frontend/src/auth.ts).
//   - style-src: components/ui/chart.tsx's <ChartStyle> writes a <style> block via
//     dangerouslySetInnerHTML, and Tailwind/Radix emit inline style attributes.
// 'unsafe-eval' is dev-only (webpack/turbopack HMR + React refresh).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${extraOrigins.length ? ` ${extraOrigins.join(" ")}` : ""}${isProd ? "" : " ws: wss:"}`,
  `form-action 'self'${keycloakOrigin ? ` ${keycloakOrigin}` : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // HSTS only in production: sending it over plain-http localhost would pin the
  // dev host to https in the browser and make dev unreachable.
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  transpilePackages: ["@appspine/frontend-shell"],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
