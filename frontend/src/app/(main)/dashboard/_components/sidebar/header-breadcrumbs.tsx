"use client";

import { usePathname } from "next/navigation";

import { HeaderBreadcrumbs as SharedHeaderBreadcrumbs } from "@appspine/frontend-shell";

const BREADCRUMB_LABELS: Record<string, string[]> = {
  "/dashboard": ["dashboard"],
  "/dashboard/users": ["administration", "users"],
  "/dashboard/roles": ["administration", "roles"],
  "/dashboard/api-keys": ["administration", "apiKeys"],
};

export function HeaderBreadcrumbs() {
  const pathname = usePathname();

  return <SharedHeaderBreadcrumbs labels={BREADCRUMB_LABELS} pathname={pathname} />;
}
