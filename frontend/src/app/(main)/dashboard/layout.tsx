import type { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SIDEBAR_COLLAPSIBLE_VALUES, SIDEBAR_VARIANT_VALUES } from "@/lib/preferences/layout";
import { getSidebarItems } from "@/navigation/sidebar/sidebar-items";
import { getCurrentUser } from "@/server/current-user";
import { getPreference } from "@/server/server-actions";

import { DashboardShell } from "./_components/dashboard-shell";
import { HeaderBreadcrumbs } from "./_components/sidebar/header-breadcrumbs";
import { LayoutControls } from "./_components/sidebar/layout-controls";
import { SearchDialog } from "./_components/sidebar/search-dialog";
import { ThemeSwitcher } from "./_components/sidebar/theme-switcher";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  // The auth cookie's mere presence was already checked by middleware.ts; this call
  // additionally confirms the token itself is still valid (not expired/revoked) and
  // supplies the user data every dashboard page needs (sidebar, ADMIN checks in T-305).
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const [variant, collapsible] = await Promise.all([
    getPreference("sidebar_variant", SIDEBAR_VARIANT_VALUES, "inset"),
    getPreference("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
  ]);
  const isAdmin = user.roleNames.includes("ADMIN");
  const navItems = getSidebarItems(isAdmin);

  return (
    <DashboardShell
      user={user}
      navItems={navItems}
      defaultOpen={defaultOpen}
      sidebarVariant={variant}
      sidebarCollapsible={collapsible}
      headerContent={
        <>
          <HeaderBreadcrumbs />
          <SearchDialog isAdmin={isAdmin} />
        </>
      }
      headerActions={
        <>
          <LayoutControls />
          <ThemeSwitcher />
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
