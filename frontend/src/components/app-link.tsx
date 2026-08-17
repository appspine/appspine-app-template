"use client";

import Link from "next/link";

import type { ShellLinkProps } from "@appspine/frontend-shell";

export interface AppLinkProps extends ShellLinkProps {
  readonly replace?: boolean;
}

export function AppLink({
  href,
  className,
  target,
  rel,
  replace = false,
  "aria-current": ariaCurrent,
  children,
}: AppLinkProps) {
  return (
    <Link
      prefetch={false}
      href={href}
      replace={replace}
      className={className}
      target={target}
      rel={rel}
      aria-current={ariaCurrent}
    >
      {children}
    </Link>
  );
}

export function AppModalLink(props: ShellLinkProps) {
  return <AppLink {...props} replace />;
}
