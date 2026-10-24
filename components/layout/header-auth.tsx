"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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
  return (
    <>
      <Link
        href={home.href}
        onClick={onNavigate}
        className={desktop ? cn(buttonVariants({ variant: "ghost" }), "hidden lg:inline-flex") : mobileLink}
      >
        {home.label}
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await signOut();
          setBusy(false);
          onNavigate?.();
          router.push("/login");
        }}
        className={desktop ? cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden lg:inline-flex") : mobileLink}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sign out
      </button>
    </>
  );
}

const mobileLink =
  "flex items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-semibold text-ink transition-colors hover:bg-light-blue hover:text-bright-blue dark:text-slate-200 dark:hover:bg-white/10";
