"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import type { Exam as ExamDTO } from "@/types/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { portalApi } from "@/lib/api/portal";
import { errorMessage } from "@/lib/api/client";
import { STEP_ROUTE } from "@/lib/journey";
import { cn } from "@/lib/utils";
import { FormMessage } from "./form-field";
import { PageShell } from "./page-shell";
import { useJourney } from "./portal-gate";

export const COMPLETION_POLL_MS = 10_000;

/**
 * Exam hand-off. "Start exam" opens the provider's link; completion is confirmed only by the
 * exam provider (via the API), so after "I've finished" the page waits for the step to change.
 */
export function Exam({ pollMs = COMPLETION_POLL_MS }: { pollMs?: number }) {
  const router = useRouter();
  const { status, reload } = useJourney();
  const [exam, setExam] = React.useState<ExamDTO | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [waiting, setWaiting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    portalApi
      .currentExam()
      .then((e) => {
        if (!cancelled) setExam(e);
      })
      .catch((err: unknown) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  // While waiting for the provider, re-check the journey step periodically.
  React.useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => {
      void reload()
        .then((s) => {
          if (s.step === "exam_completed") router.push(STEP_ROUTE[s.step]);
        })
        .catch(() => undefined);
    }, pollMs);
    return () => clearInterval(id);
  }, [waiting, reload, router, pollMs]);

  async function claim() {
    if (!exam) return;
    setError(null);
    try {
      await portalApi.claimCompletion(exam.attemptId);
      setWaiting(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <PageShell
      eyebrow="Step 4 of 6"
      title="Your exam"
      intro={
        status.step === "exam_in_progress"
          ? "Your exam is in progress. Finish it in the exam window."
          : "Your payment is confirmed. The exam opens in a new tab — we've also emailed you the link."
      }
    >
      {!exam && !error ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading your exam...
        </p>
      ) : null}

      {exam?.examUrl ? (
        <div className="space-y-5">
          <a
            href={exam.examUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}
          >
            Start exam <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>

          {waiting ? (
            <div role="status" className="flex items-start gap-3 rounded-lg bg-light-blue/40 p-4 text-sm dark:bg-dark-surface-alt">
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary-blue" aria-hidden="true" />
              <p className="text-navy dark:text-white">
                Waiting for the exam platform to confirm your submission. This page updates automatically — you
                can also come back later from your dashboard.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-100 p-4 dark:border-white/10">
              <p className="text-sm text-muted dark:text-slate-400">Finished the exam? Let us know and we&apos;ll take you to feedback once it&apos;s confirmed.</p>
              <Button variant="outline" className="mt-3" onClick={() => void claim()}>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> I&apos;ve finished the exam
              </Button>
            </div>
          )}
        </div>
      ) : null}

      <FormMessage>{error}</FormMessage>
    </PageShell>
  );
}
