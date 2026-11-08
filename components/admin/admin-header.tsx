"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session/session-provider";

/**
 * Slim top bar for the staff portal: the logo, who is signed in, and sign out. The public site's menu,
 * announcement bar and footer are not part of the staff portal.
 */
export function AdminHeader() {
  const { status, candidate, signOut } = useSession();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const signedIn = status === "authenticated" && candidate !== null;

  async function leave() {
    setBusy(true);
    await signOut();
    setBusy(false);
    router.push("/login");
  }

  return (
    <header className="border-b border-slate-100 bg-white dark:border-white/10 dark:bg-dark-bg">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/admin" className="flex items-center gap-3">
          <Image src="/images/hvk-logo.png" alt="HVK Tech" width={40} height={40} priority className="h-10 w-10 rounded-full object-cover" />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold text-navy dark:text-white">HVK Staff Portal</span>
            <span className="text-[11px] font-medium text-muted dark:text-slate-400">Internal use only</span>
          </span>
        </Link>
        {signedIn ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-sm font-semibold text-navy dark:text-white">{candidate.fullName}</span>
              <span className="block text-xs text-muted dark:text-slate-400">{candidate.role === "admin" ? "Administrator" : "Talent acquisition"}</span>
            </span>
            <Button variant="outline" size="sm" onClick={() => void leave()} disabled={busy}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
