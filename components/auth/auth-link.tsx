"use client";

import * as React from "react";
import Link from "next/link";
import { useAuthDialog, type AuthView } from "./auth-dialog";

/**
 * A link that opens the sign-in / create-account popup. It stays a real link (`href`), so
 * open-in-new-tab, copy-address and no-JavaScript visits still reach the page.
 */
export function AuthLink({
  view,
  href,
  className,
  onNavigate,
  children,
}: {
  view: AuthView;
  href: string;
  className?: string;
  /** Runs before the popup opens (e.g. close the mobile menu). */
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  const dialog = useAuthDialog();
  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        if (!dialog || event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onNavigate?.();
        dialog.open(view);
      }}
    >
      {children}
    </Link>
  );
}
