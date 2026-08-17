"use client";

import type { ReactNode } from "react";

import { AdminModalShell, useTranslations } from "@appspine/frontend-shell";

import { AppModalLink } from "@/components/app-link";
import { ADMIN_MODAL_ITEMS } from "@/navigation/sidebar/sidebar-items";

interface AdminModalProps {
  readonly activeId: string;
  readonly children: ReactNode;
}

export function AdminModal({ activeId, children }: AdminModalProps) {
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tModal = useTranslations("adminModal");

  const navItems = ADMIN_MODAL_ITEMS.map((item) => ({
    ...item,
    title: tNav(item.title),
  }));

  return (
    <AdminModalShell
      title={tNav("administration")}
      navItems={navItems}
      activeId={activeId}
      LinkComponent={AppModalLink}
      labels={{
        close: tCommon("close"),
        description: tModal("description"),
        loading: tModal("loading"),
        errorTitle: tModal("errorTitle"),
        errorDescription: tModal("errorDescription"),
        retry: tModal("retry"),
      }}
    >
      {children}
    </AdminModalShell>
  );
}
