import type { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SIDEBAR_COLLAPSIBLE_VALUES, SIDEBAR_VARIANT_VALUES } from "@/lib/preferences/layout";
import { getCurrentUser } from "@/server/current-user";
import { getPreference } from "@/server/server-actions";

import { DashboardShellBridge } from "./_components/dashboard-shell-bridge";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  // There is no middleware (Next.js 16 + next-auth v5 beta bug — see dev_docs/framework/
  // 035); this is the sole gate for every route under this layout. It also supplies the
  // user data every dashboard page needs (sidebar, ADMIN checks in T-305).
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const [variant, collapsible] = await Promise.all([
    getPreference("sidebar_variant", SIDEBAR_VARIANT_VALUES, "inset"),
    getPreference("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
  ]);

  return (
    <DashboardShellBridge
      user={user}
      defaultOpen={defaultOpen}
      defaultSidebarVariant={variant}
      defaultSidebarCollapsible={collapsible}
    >
      {children}
    </DashboardShellBridge>
  );
}
