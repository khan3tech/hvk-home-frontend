"use client";

import * as React from "react";
import { Mail, Phone } from "lucide-react";
import { CONTACT_EMAIL, PHONE_NUMBERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * "Call us" / "Talk to us": opens a small panel with both phone numbers (tap to call) and the email
 * (opens the mail app), instead of dialling one number straight away.
 */
export function ContactMenu({ label, className, panelClassName }: { label: string; className?: string; panelClassName?: string }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const panelId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" className={className} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        <Phone className="h-4 w-4" aria-hidden="true" /> {label}
      </button>
      {open ? (
        <div
          id={panelId}
          className={cn(
            "absolute left-0 z-30 mt-2 w-72 rounded-xl border border-slate-100 bg-white p-4 text-left text-sm text-ink shadow-card-hover dark:border-white/10 dark:bg-dark-surface dark:text-slate-200",
            panelClassName,
          )}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-muted dark:text-slate-400">Call us</p>
          <ul className="mt-2 space-y-1.5">
            {PHONE_NUMBERS.map((p) => (
              <li key={p.href}>
                <a href={p.href} className="inline-flex items-center gap-2 font-semibold text-navy hover:text-primary-blue dark:text-white dark:hover:text-bright-blue">
                  <Phone className="h-4 w-4 text-primary-blue dark:text-bright-blue" aria-hidden="true" /> {p.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted dark:text-slate-400">Email us</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="mt-2 inline-flex items-center gap-2 break-all font-semibold text-navy hover:text-primary-blue dark:text-white dark:hover:text-bright-blue">
            <Mail className="h-4 w-4 shrink-0 text-primary-blue dark:text-bright-blue" aria-hidden="true" /> {CONTACT_EMAIL}
          </a>
        </div>
      ) : null}
    </div>
  );
}
