import * as React from "react";
import { PageHeading } from "./page-heading";

/** Standard portal page frame: heading, optional intro, content card. */
export function PageShell({
  eyebrow,
  title,
  intro,
  children,
  width = "max-w-3xl",
}: {
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <section className="bg-app-bg py-12 dark:bg-dark-bg sm:py-16">
      <div className={`container ${width}`}>
        {eyebrow ? (
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary-blue dark:text-bright-blue">{eyebrow}</span>
        ) : null}
        <PageHeading className="mt-2 text-2xl font-extrabold text-navy dark:text-white sm:text-3xl">{title}</PageHeading>
        {intro ? <div className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">{intro}</div> : null}
        <div className="mt-6 rounded-xl2 border border-slate-100 bg-white p-6 shadow-card-hover dark:border-white/10 dark:bg-dark-surface sm:p-8">
          {children}
        </div>
      </div>
    </section>
  );
}
