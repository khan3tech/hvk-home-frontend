import * as React from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "loading" | "success" | "error" | "neutral";

const ICONS: Record<Tone, React.ReactNode> = {
  loading: <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-blue dark:text-bright-blue" aria-hidden="true" />,
  success: <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" aria-hidden="true" />,
  error: <XCircle className="mx-auto h-12 w-12 text-red-500" aria-hidden="true" />,
  neutral: null,
};

/** Centered card used for loading, success and error states across the portal. */
export function StatusCard({
  tone,
  title,
  children,
  className,
}: {
  tone: Tone;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-app-bg py-16 dark:bg-dark-bg">
      <div className="container flex justify-center">
        <div
          role={tone === "error" ? "alert" : "status"}
          aria-live="polite"
          aria-busy={tone === "loading"}
          className={cn(
            "w-full max-w-md rounded-xl2 border border-slate-100 bg-white p-8 text-center shadow-card-hover dark:border-white/10 dark:bg-dark-surface",
            className,
          )}
        >
          {ICONS[tone]}
          <h1 className="mt-5 text-xl font-extrabold text-navy dark:text-white">{title}</h1>
          {children ? <div className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
