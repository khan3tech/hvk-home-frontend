"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PageHeading } from "@/components/portal/page-heading";

const TABS = [
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/follow-ups", label: "Payment follow-ups" },
  { href: "/admin/exams", label: "Examinations" },
];

/** TA dashboard frame with section tabs. */
export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <section className="bg-app-bg py-10 dark:bg-dark-bg">
      <div className="container">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary-blue dark:text-bright-blue">TA dashboard</span>
        <PageHeading className="mt-2 text-2xl font-extrabold text-navy dark:text-white">{title}</PageHeading>
        <nav aria-label="TA sections" className="mt-4 flex gap-2 border-b border-slate-200 dark:border-white/10">
          {TABS.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2 text-sm font-semibold",
                  active ? "border-bright-blue text-navy dark:text-white" : "border-transparent text-muted hover:text-navy dark:text-slate-400",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

export const selectClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20 dark:border-white/10 dark:bg-dark-surface-alt dark:text-slate-100";

export const cardClass =
  "rounded-xl2 border border-slate-100 bg-white p-5 shadow-card dark:border-white/10 dark:bg-dark-surface";

export function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-light-blue px-2.5 py-0.5 text-xs font-bold text-primary-blue dark:bg-bright-blue/10 dark:text-bright-blue">
      {children}
    </span>
  );
}
