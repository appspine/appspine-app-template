import { KeyRound, LayoutDashboard, type LucideIcon, ShieldCheck, Users } from "lucide-react";

import type { Messages } from "@/i18n/messages";

export type NavBadge = "new" | "soon";

type NavKey = keyof Messages["nav"] & string;

export interface NavSubItem {
  id: string;
  title: NavKey;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: NavKey;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: NavKey;
  items: NavMainItem[];
}

// Administration items are ADMIN-only — appspine-app-template/frontend/src/app/(main)/dashboard/(admin)/layout.tsx
// already blocks direct navigation, but hiding the entries too avoids showing
// non-admins links they can't use.
export function getSidebarItems(isAdmin: boolean): NavGroup[] {
  const groups: NavGroup[] = [
    {
      id: 1,
      label: "overview",
      items: [
        {
          id: "dashboard",
          title: "dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
  ];

  if (isAdmin) {
    groups.push({
      id: 2,
      label: "administration",
      items: [
        { id: "users", title: "users", url: "/dashboard/users", icon: Users },
        { id: "roles", title: "roles", url: "/dashboard/roles", icon: ShieldCheck },
        { id: "api-keys", title: "apiKeys", url: "/dashboard/api-keys", icon: KeyRound },
      ],
    });
  }

  return groups;
}
