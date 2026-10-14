"use client";

import * as React from "react";
import Link from "next/link";
import { Award, Clock, Loader2 } from "lucide-react";
import type { Result as ResultDTO } from "@/types/api";
import { buttonVariants } from "@/components/ui/button";
import { portalApi } from "@/lib/api/portal";
import { errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { FormMessage } from "./form-field";
import { PageShell } from "./page-shell";

export function ThankYou() {
  return (
    <PageShell eyebrow="Thank you" title="Thanks for your feedback!">
      <div role="status" className="text-center">
        <Clock className="mx-auto h-12 w-12 text-primary-blue dark:text-bright-blue" aria-hidden="true" />
        <p className="mt-4 text-sm leading-relaxed text-muted dark:text-slate-400">
          Your exam is complete. Your result will be emailed to you within 24 hours of finishing the exam, and it
          will also appear on your result page.
        </p>
        <Link href="/result" className={cn(buttonVariants({ variant: "primary" }), "mt-6")}>
          View result status
        </Link>
      </div>
    </PageShell>
  );
}

export function Result() {
  const [result, setResult] = React.useState<ResultDTO | null | undefined>(undefined);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    portalApi
      .myResult()
      .then((r) => !cancelled && setResult(r))
      .catch((err: unknown) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell eyebrow="Step 6 of 6" title="Your result">
      {result === undefined && !error ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading your result...
        </p>
      ) : null}
      {result === null || result?.status === "pending" ? (
        <div role="status" className="text-center">
          <Clock className="mx-auto h-12 w-12 text-primary-blue dark:text-bright-blue" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted dark:text-slate-400">
            Your result isn&apos;t published yet. It will be emailed to you within 24 hours of completing the exam.
          </p>
        </div>
      ) : null}
      {result?.status === "published" ? (
        <div className="text-center">
          <Award className={cn("mx-auto h-14 w-14", result.outcome === "pass" ? "text-green-500" : "text-amber-500")} aria-hidden="true" />
          <p className="mt-4 text-3xl font-extrabold text-navy dark:text-white">{result.score ?? "—"}</p>
          <p className="text-sm font-semibold text-muted">Score</p>
          <p className={cn("mt-4 inline-block rounded-full px-4 py-1 text-sm font-bold", result.outcome === "pass" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
            {result.outcome === "pass" ? "Passed" : result.outcome === "fail" ? "Not passed" : "Result available"}
          </p>
        </div>
      ) : null}
      <FormMessage>{error}</FormMessage>
    </PageShell>
  );
}
