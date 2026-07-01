"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { startTransition } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  DashboardShell,
  type Locale,
  LocaleSwitcher,
  type NavGroup,
  type ShellLinkProps,
  ThemeSwitcher,
  useLocale,
  useTranslations,
} from "@appspine/frontend-shell";
import { useShallow } from "zustand/react/shallow";

import { APP_CONFIG } from "@/config/app-config";
import { persistPreference } from "@/lib/preferences/preferences-storage";
import { getSidebarItems } from "@/navigation/sidebar/sidebar-items";
import { logout } from "@/server/auth-actions";
import type { CurrentUser } from "@/server/current-user";
import { setLocaleAction } from "@/server/locale-action.js";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { HeaderBreadcrumbs } from "./sidebar/header-breadcrumbs";
import { LayoutControls } from "./sidebar/layout-controls";
import { SearchDialog } from "./sidebar/search-dialog";

interface DashboardShellBridgeProps {
  readonly user: CurrentUser;
  readonly defaultOpen: boolean;
  readonly defaultSidebarVariant: "sidebar" | "floating" | "inset";
  readonly defaultSidebarCollapsible: "offcanvas" | "icon" | "none";
  readonly children: ReactNode;
}

function AppLink({ href, className, target, rel, children }: ShellLinkProps) {
  return (
    <Link prefetch={false} href={href} className={className} target={target} rel={rel}>
      {children}
    </Link>
  );
}

export function DashboardShellBridge({
  user,
  defaultOpen,
  defaultSidebarVariant,
  defaultSidebarCollapsible,
  children,
}: DashboardShellBridgeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const { isSynced, sidebarVariant, sidebarCollapsible, themeMode, setThemeMode } = usePreferencesStore(
    useShallow((state) => ({
      isSynced: state.isSynced,
      sidebarVariant: state.sidebarVariant,
      sidebarCollapsible: state.sidebarCollapsible,
      themeMode: state.themeMode,
      setThemeMode: state.setThemeMode,
    })),
  );

  const isAdmin = user.roleNames.includes("ADMIN");
  const navItems: readonly NavGroup[] = getSidebarItems(isAdmin);

  const translatedNavItems = React.useMemo(() => {
    return navItems.map((group) => ({
      ...group,
      label: group.label ? tNav(group.label) : undefined,
      items: group.items.map((item) => {
        const translatedItem = {
          ...item,
          title: tNav(item.title),
        };
        if (item.subItems) {
          return {
            ...translatedItem,
            subItems: item.subItems.map((sub) => ({
              ...sub,
              title: tNav(sub.title),
            })),
          };
        }
        return translatedItem;
      }),
    }));
  }, [navItems, tNav]);

  const effectiveSidebarVariant = isSynced ? sidebarVariant : defaultSidebarVariant;
  const effectiveSidebarCollapsible = isSynced ? sidebarCollapsible : defaultSidebarCollapsible;

  const handleThemeModeChange = (nextThemeMode: "light" | "dark" | "system") => {
    setThemeMode(nextThemeMode);
    void persistPreference("theme_mode", nextThemeMode);
  };

  const handleLocaleChange = (nextLocale: Locale) => {
    React.startTransition(async () => {
      await setLocaleAction(nextLocale);
      router.refresh();
    });
  };

  const handleSignOut = () => {
    startTransition(() => {
      void logout();
    });
  };

  return (
    <DashboardShell
      appName={APP_CONFIG.name}
      currentPath={pathname}
      navItems={translatedNavItems}
      LinkComponent={AppLink}
      user={{
        name: user.name ?? user.email,
        email: user.email,
        avatar: null,
      }}
      onSignOut={handleSignOut}
      defaultOpen={defaultOpen}
      sidebarVariant={effectiveSidebarVariant}
      sidebarCollapsible={effectiveSidebarCollapsible}
      headerContent={
        <>
          <HeaderBreadcrumbs />
          <SearchDialog isAdmin={isAdmin} />
        </>
      }
      headerActions={
        <>
          <LayoutControls />
          <LocaleSwitcher currentLocale={locale} onLocaleChange={handleLocaleChange} />
          <ThemeSwitcher themeMode={themeMode} onThemeModeChange={handleThemeModeChange} />
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
