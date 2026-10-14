import * as React from "react";

/** Card layout shared by sign-in, forgot and reset password pages. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-app-bg py-14 dark:bg-dark-bg">
      <div className="container flex justify-center">
        <div className="w-full max-w-md rounded-xl2 border border-slate-100 bg-white p-6 shadow-card-hover dark:border-white/10 dark:bg-dark-surface sm:p-8">
          <h1 className="text-2xl font-extrabold text-navy dark:text-white">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  );
}
