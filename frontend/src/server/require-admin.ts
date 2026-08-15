import { getCurrentUser } from "./current-user";

// Layouts only run their authorization check on page navigations. A Server Action is invoked
// directly by its stable action ID and never executes the wrapping layout's redirect() branch, so
// every admin-only "use server" export must call this itself rather than relying on
// (admin)/layout.tsx to have gated the request.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.roleNames.includes("ADMIN")) {
    throw new Error("Forbidden: ADMIN role required");
  }
  return user;
}
