"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { AuthLink } from "@/components/auth/auth-link";
import { buttonVariants } from "@/components/ui/button";
import { isStaff } from "@/lib/journey";
import { useSession } from "@/lib/session/session-provider";
import { cn } from "@/lib/utils";

/** Sign-in / dashboard / sign-out controls for the header (desktop and mobile layouts). */
export function HeaderAuth({ variant, onNavigate }: { variant: "desktop" | "mobile"; onNavigate?: () => void }) {
  const { status, candidate, signOut } = useSession();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (status === "loading") return null;

  const desktop = variant === "desktop";
  if (status === "anonymous") {
    return (
      <AuthLink
        view="login"
        href="/login"
        onNavigate={onNavigate}
        className={desktop ? cn(buttonVariants({ variant: "ghost" }), "hidden lg:inline-flex") : mobileLink}
      >
        Sign in
      </AuthLink>
    );
  }

  const home = isStaff(candidate?.role) ? { href: "/admin", label: "TA Dashboard" } : { href: "/dashboard", label: "My Dashboard" };
  const doSignOut = async () => {
    setBusy(true);
    await signOut();
    setBusy(false);
    onNavigate?.();
    router.push("/login");
  };

  if (desktop) {
    return (
      <div className="relative hidden lg:block" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-light-blue text-primary-blue transition-colors hover:bg-bright-blue hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-blue dark:bg-white/10 dark:text-bright-blue"
        >
          <User className="h-5 w-5" aria-hidden="true" />
        </button>
        {menuOpen ? (
          <div role="menu" className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-slate-100 bg-white p-2 shadow-card-hover dark:border-white/10 dark:bg-dark-surface">
            <p className="truncate px-3 py-2 text-sm font-bold text-navy dark:text-white">{candidate?.fullName}</p>
            <Link href={home.href} role="menuitem" onClick={() => setMenuOpen(false)} className={menuItem}>
              {home.label}
            </Link>
            <button type="button" role="menuitem" disabled={busy} onClick={() => void doSignOut()} className={menuItem}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <Link href={home.href} onClick={onNavigate} className={mobileLink}>
        {home.label}
      </Link>
      <button type="button" disabled={busy} onClick={() => void doSignOut()} className={mobileLink}>
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sign out
      </button>
    </>
  );
}

const menuItem =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-light-blue hover:text-bright-blue disabled:opacity-50 dark:text-slate-200 dark:hover:bg-white/10";

const mobileLink =
  "flex items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-semibold text-ink transition-colors hover:bg-light-blue hover:text-bright-blue dark:text-slate-200 dark:hover:bg-white/10";
