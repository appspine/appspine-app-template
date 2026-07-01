import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/current-user";

// Wraps /dashboard/users, /dashboard/roles, /dashboard/api-keys (dev_docs/004-task-breakdown.md
// T-307/308/309). The parent (main)/dashboard/layout.tsx (T-304) already redirects
// unauthenticated requests to /login, so `user` is never actually null here in
// practice — the check below only guards the ADMIN role, but stays null-safe since
// TypeScript can't see that guarantee across the layout boundary.
export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();
  if (!user?.roleNames.includes("ADMIN")) redirect("/unauthorized");

  return <>{children}</>;
}
