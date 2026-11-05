"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, RotateCcw, Trophy } from "lucide-react";
import type { SkillAttempt, SkillExamResult } from "@/types/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError, errorMessage } from "@/lib/api/client";
import { skillExamApi } from "@/lib/api/skill-exams";
import { LEARNING_PAGE } from "@/lib/journey";
import { cn } from "@/lib/utils";
import { FormMessage } from "./form-field";
import { PageShell } from "./page-shell";
import { StatusCard } from "./status-card";

/** "12:05" or "1:02:05". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

type Phase = { kind: "loading" } | { kind: "blocked"; message: string } | { kind: "taking"; attempt: SkillAttempt } | { kind: "done"; result: SkillExamResult };

/** A course or domain exam: start (or resume), answer one question at a time, submit, see the result at once, retake. */
export function SkillExamRunner({ examId }: { examId: string }) {
  const [phase, setPhase] = React.useState<Phase>({ kind: "loading" });
  const [round, setRound] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    skillExamApi
      .start(examId)
      .then((attempt) => !cancelled && setPhase({ kind: "taking", attempt }))
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError && err.code === "PAYMENT_REQUIRED"
            ? "The exams unlock after our team approves your payment."
            : err instanceof ApiError && err.status === 404
              ? "This exam is not available."
              : errorMessage(err);
        setPhase({ kind: "blocked", message });
      });
    return () => {
      cancelled = true;
    };
  }, [examId, round]);

  if (phase.kind === "loading") return <StatusCard tone="loading" title="Getting your exam ready…" />;
  if (phase.kind === "blocked") {
    return (
      <StatusCard tone="error" title="We can't open this exam">
        <p>{phase.message}</p>
        <Link href={LEARNING_PAGE} className={cn(buttonVariants({ variant: "outline" }), "mt-5")}>
          Back to my learning
        </Link>
      </StatusCard>
    );
  }
  if (phase.kind === "done") return <Result result={phase.result} onRetake={() => {
          setPhase({ kind: "loading" });
          setRound((r) => r + 1);
        }} />;
  return <Taking key={phase.attempt.id} attempt={phase.attempt} onDone={(result) => setPhase({ kind: "done", result })} />;
}

function Taking({ attempt, onDone }: { attempt: SkillAttempt; onDone: (result: SkillExamResult) => void }) {
  const [answers, setAnswers] = React.useState<Record<string, string>>(attempt.answers);
  const [index, setIndex] = React.useState(0);
  const [now, setNow] = React.useState(() => Date.now());
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const submitting = React.useRef(false);

  const deadline = React.useMemo(() => new Date(attempt.deadlineAt).getTime(), [attempt.deadlineAt]);
  const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
  const question = attempt.questions[index]!;
  const answered = attempt.questions.filter((q) => answers[q.id]).length;
  const unanswered = attempt.questions.length - answered;

  const submit = React.useCallback(async () => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      onDone(await skillExamApi.submit(attempt.id));
    } catch (err) {
      submitting.current = false;
      setBusy(false);
      setError(errorMessage(err));
    }
  }, [attempt.id, onDone]);

  // Ticks every second; when the time is up, submits what has been answered.
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= deadline) void submit();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, submit]);

  async function choose(optionId: string) {
    const previous = answers[question.id];
    setAnswers((a) => ({ ...a, [question.id]: optionId }));
    setError(null);
    try {
      await skillExamApi.answer(attempt.id, question.id, optionId);
    } catch (err) {
      if (err instanceof ApiError && err.code === "ATTEMPT_CLOSED") {
        void submit(); // the time ran out: show the result
        return;
      }
      setAnswers((a) => {
        const next = { ...a };
        if (previous) next[question.id] = previous;
        else delete next[question.id];
        return next;
      });
      setError(`Your answer was not saved. ${errorMessage(err)}`);
    }
  }

  return (
    <PageShell eyebrow={`Attempt ${attempt.attemptNo}`} title={attempt.title} width="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="font-semibold text-navy dark:text-white">
          Question {index + 1} of {attempt.questions.length} · {answered} answered
        </p>
        <p className={cn("inline-flex items-center gap-1.5 font-bold tabular-nums", remaining <= 60 ? "text-red-600 dark:text-red-400" : "text-primary-blue dark:text-bright-blue")} role="timer" aria-label="Time left">
          <Clock className="h-4 w-4" aria-hidden="true" /> {formatClock(remaining)}
        </p>
      </div>

      <fieldset className="mt-6">
        <legend className="text-base font-semibold leading-relaxed text-navy dark:text-white">{question.prompt}</legend>
        <div className="mt-4 space-y-2.5">
          {question.options.map((option) => {
            const selected = answers[question.id] === option.id;
            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
                  selected ? "border-bright-blue bg-light-blue/60 text-navy dark:bg-bright-blue/10 dark:text-white" : "border-slate-200 text-ink hover:bg-light-blue/30 dark:border-white/10 dark:text-slate-200",
                )}
              >
                <input type="radio" name={`q-${question.id}`} className="mt-0.5" checked={selected} onChange={() => void choose(option.id)} disabled={busy} />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setIndex((i) => i - 1)} disabled={index === 0 || busy}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Previous
        </Button>
        {index < attempt.questions.length - 1 ? (
          <Button onClick={() => setIndex((i) => i + 1)} disabled={busy}>
            Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button onClick={() => (unanswered > 0 ? setConfirming(true) : void submit())} disabled={busy}>
            Submit exam
          </Button>
        )}
      </div>

      <nav aria-label="Questions" className="mt-6 flex flex-wrap gap-2">
        {attempt.questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to question ${i + 1}${answers[q.id] ? " (answered)" : ""}`}
            aria-current={i === index ? "true" : undefined}
            className={cn(
              "h-9 w-9 rounded-md border text-xs font-bold",
              i === index ? "border-bright-blue bg-bright-blue text-white" : answers[q.id] ? "border-green-300 bg-green-50 text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300" : "border-slate-200 text-muted dark:border-white/10",
            )}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      <div className="mt-4">
        <FormMessage>{error}</FormMessage>
      </div>

      {confirming ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-5">
          <div role="alertdialog" aria-modal="true" aria-labelledby="submit-title" className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl dark:bg-dark-surface">
            <h2 id="submit-title" className="text-lg font-bold text-navy dark:text-white">
              Submit with {unanswered} unanswered?
            </h2>
            <p className="mt-2 text-sm text-muted dark:text-slate-400">Unanswered questions score zero. You can retake the exam afterwards.</p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Keep answering
              </Button>
              <Button
                onClick={() => {
                  setConfirming(false);
                  void submit();
                }}
              >
                Submit now
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

function Result({ result, onRetake }: { result: SkillExamResult; onRetake: () => void }) {
  return (
    <PageShell eyebrow={`Attempt ${result.attemptNo}`} title={result.passed ? "You passed!" : "Not passed this time" } width="max-w-2xl">
      <div className="text-center" role="status">
        <Trophy className={cn("mx-auto h-14 w-14", result.passed ? "text-amber-500" : "text-slate-400")} aria-hidden="true" />
        <p className="mt-3 text-5xl font-extrabold text-navy dark:text-white">{result.percentage}%</p>
        <p className="mt-2 text-sm text-muted dark:text-slate-400">
          {result.correctCount} of {result.questionCount} correct · {result.score} of {result.totalMarks} marks · pass mark {result.passPercentage}%
        </p>
        <p className="mt-4 text-sm text-ink dark:text-slate-200">
          {result.passed ? "Well done. You can retake the exam any time to improve your score." : "You can retake the exam as many times as you like. Review the videos first if you want."}
        </p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={onRetake}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Retake exam
        </Button>
        <Link href={LEARNING_PAGE} className={buttonVariants({ variant: "outline" })}>
          Back to my learning
        </Link>
      </div>
    </PageShell>
  );
}
