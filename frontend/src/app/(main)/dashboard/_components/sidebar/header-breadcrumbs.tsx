"use client";

import { Fragment } from "react";

import { usePathname } from "next/navigation";

import { useTranslations } from "@appspine/frontend-shell";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Keyed by the exact pathname — deep/dynamic routes aren't part of this
// template yet, so a flat lookup is enough. Extend as routes are added.
const BREADCRUMB_LABELS: Record<string, string[]> = {
  "/dashboard": ["dashboard"],
  "/dashboard/users": ["administration", "users"],
  "/dashboard/roles": ["administration", "roles"],
  "/dashboard/api-keys": ["administration", "apiKeys"],
};

export function HeaderBreadcrumbs() {
  const t = useTranslations("breadcrumb");
  const pathname = usePathname();
  const segments = BREADCRUMB_LABELS[pathname];
  if (!segments) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap">
        {segments.map((segment, index) => (
          <Fragment key={segment}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {index === segments.length - 1 ? (
                <BreadcrumbPage>{t(segment)}</BreadcrumbPage>
              ) : (
                <span>{t(segment)}</span>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
