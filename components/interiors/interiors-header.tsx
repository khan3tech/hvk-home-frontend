"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { INTERIORS_BASE, INTERIORS_NAV } from "@/lib/interiors/content";
import { cn } from "@/lib/utils";

export function InteriorsHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const isActive = (href: string) => (href === INTERIORS_BASE ? pathname === href : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-[#e4e0d4] bg-[#f6f4ee]/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-6 px-5">
        <Link href={INTERIORS_BASE} className="flex items-center gap-3" aria-label="HVK Interiors home">
          <Image src="/images/hvk-logo.png" alt="" width={44} height={44} priority className="h-11 w-11 rounded-full object-cover" />
          <span className="font-[family-name:var(--font-playfair)] text-xl font-bold tracking-[0.12em] text-[#0f3b32]">HVK INTERIORS</span>
        </Link>

        <nav
          aria-label="Main navigation"
          id="interiors-nav"
          className={cn(
            "absolute inset-x-0 top-[72px] flex-col gap-1 border-b border-[#e4e0d4] bg-[#f6f4ee] px-5 pb-5 pt-2 md:static md:flex md:flex-row md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0",
            open ? "flex" : "hidden",
          )}
        >
          {INTERIORS_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:text-[#b8860b] md:py-1",
                isActive(link.href) ? "text-[#0f3b32] underline decoration-[#e0a826] decoration-2 underline-offset-8" : "text-[#3a4a44]",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-md border border-[#0f3b32]/30 p-2 text-[#0f3b32] md:hidden"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="interiors-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
