"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, ExternalLink, Loader2 } from "lucide-react";
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
/** While the built-in exam is still being prepared, re-check this often. */
export const PENDING_POLL_MS = 30_000;

const formatIST = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

/** The invite link is absolute (emailed); in the app we stay on this origin and navigate in place. */
function inAppPath(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

/**
 * Exam step. Built-in exam (`mode: managed`): a personal link valid 24 hours after payment;
 * finishing the exam moves the journey to feedback by itself. External provider: "Start exam"
 * opens the provider's link and completion is confirmed only by the provider's callback.
 */
export function Exam({ pollMs = COMPLETION_POLL_MS, pendingPollMs = PENDING_POLL_MS }: { pollMs?: number; pendingPollMs?: number }) {
  const router = useRouter();
  const { status, reload } = useJourney();
  const [exam, setExam] = React.useState<ExamDTO | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [waiting, setWaiting] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setExam(await portalApi.currentExam());
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

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

  const managed = exam?.mode === "managed";

  // Built-in exam not published yet: check again periodically (the link is also emailed).
  React.useEffect(() => {
    if (!managed || exam?.linkStatus !== "pending") return;
    const id = setInterval(() => void load(), pendingPollMs);
    return () => clearInterval(id);
  }, [managed, exam?.linkStatus, load, pendingPollMs]);

  // Built-in exam already submitted: the journey has moved on to feedback.
  React.useEffect(() => {
    if (!managed || exam?.linkStatus !== "submitted") return;
    void reload()
      .then((s) => {
        if (s.step === "exam_completed") router.push(STEP_ROUTE[s.step]);
      })
      .catch(() => undefined);
  }, [managed, exam?.linkStatus, reload, router]);

  // External provider: while waiting for its confirmation, re-check the journey step periodically.
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

  const intro = managed
    ? "Your payment is confirmed. Your exam link is personal to you and works for 24 hours — we've also emailed it."
    : status.step === "exam_in_progress"
      ? "Your exam is in progress. Finish it in the exam window."
      : "Your payment is confirmed. The exam opens in a new tab — we've also emailed you the link.";

  return (
    <PageShell eyebrow="Step 4 of 6" title="Your exam" intro={intro}>
      {!exam && !error ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading your exam...
        </p>
      ) : null}

      {exam && managed ? <ManagedExam exam={exam} /> : null}

      {exam && !managed && exam.examUrl ? (
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

function ManagedExam({ exam }: { exam: ExamDTO }) {
  switch (exam.linkStatus) {
    case "active":
    case "started":
      return exam.examUrl ? (
        <div className="space-y-4">
          <Link href={inAppPath(exam.examUrl)} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}>
            {exam.linkStatus === "started" ? "Resume exam" : "Start exam"}
          </Link>
          {exam.linkStatus === "active" && exam.linkExpiresAt ? (
            <p className="flex items-center gap-2 text-sm text-muted dark:text-slate-400">
              <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Start before {formatIST(exam.linkExpiresAt)} IST. After that the link expires.
            </p>
          ) : null}
          <p className="text-sm text-muted dark:text-slate-400">
            You&apos;ll need a working camera and fullscreen mode. Once you start, the timer runs until you submit.
          </p>
        </div>
      ) : null;
    case "expired":
      return (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-semibold">Your exam link has expired.</p>
          <p className="mt-1">
            The link was valid for 24 hours{exam.linkExpiresAt ? ` (until ${formatIST(exam.linkExpiresAt)} IST)` : ""}. Contact us and
            we&apos;ll send you a new one.
          </p>
        </div>
      );
    case "submitted":
      return (
        <p role="status" className="flex items-center gap-2 text-sm text-navy dark:text-white">
          <CheckCircle2 className="h-4 w-4 text-primary-blue" aria-hidden="true" /> Your exam is submitted. Taking you to feedback...
        </p>
      );
    default:
      return (
        <div role="status" className="flex items-start gap-3 rounded-lg bg-light-blue/40 p-4 text-sm dark:bg-dark-surface-alt">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary-blue" aria-hidden="true" />
          <p className="text-navy dark:text-white">
            Your exam is being prepared. We&apos;ll email your link as soon as it&apos;s ready — this page also updates by itself.
          </p>
        </div>
      );
  }
}
