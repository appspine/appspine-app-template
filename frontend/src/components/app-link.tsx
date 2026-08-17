"use client";

import Link from "next/link";

import type { ShellLinkProps } from "@appspine/frontend-shell";

export interface AppLinkProps extends ShellLinkProps {
  readonly replace?: boolean;
}

export function AppLink({ href, replace = false, ...props }: AppLinkProps) {
  return <Link prefetch={false} href={href} replace={replace} {...props} />;
}

export function AppModalLink(props: ShellLinkProps) {
  return <AppLink {...props} replace />;
}
