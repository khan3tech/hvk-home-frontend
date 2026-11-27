"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, Clock3, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { portalApi } from "@/lib/api/portal";
import { skillExamApi } from "@/lib/api/skill-exams";
import { errorMessage } from "@/lib/api/client";
import { skillExamHref } from "@/components/learning/skill-exam-cards";
import type { ManagedExamInvite, MySkillAttempt } from "@/types/api";
import { cn } from "@/lib/utils";

const OUTCOME: Record<MySkillAttempt["state"], { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300" },
  terminated: { label: "Exam ended", className: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200" },
  in_progress: { label: "Exam ended", className: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200" },
};

const formatDate = (iso: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));

/** My examinations: the exams I have taken (no outcome: staff contact the candidate), and any exam assigned to me by staff. */
export function ManagedExamList() {
  const [exams, setExams] = React.useState<ManagedExamInvite[]>([]);
  const [taken, setTaken] = React.useState<MySkillAttempt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchExams = React.useCallback(() => {
    Promise.all([portalApi.managedExamInvites(), skillExamApi.mine().catch(() => [] as MySkillAttempt[])])
      .then(([assigned, mine]) => {
        setExams(assigned);
        setTaken(mine);
      })
      .catch((err: unknown) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    fetchExams();
  }, [fetchExams]);

  React.useEffect(() => { fetchExams(); }, [fetchExams]);

  return <main className="min-h-screen bg-slate-50 px-5 py-10 dark:bg-dark-surface"><div className="mx-auto max-w-5xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.18em] text-primary-blue">CANDIDATE PORTAL</p><h1 className="mt-2 text-3xl font-bold text-navy dark:text-white">My examinations</h1><p className="mt-2 text-sm text-muted">The exams you have taken, and exams assigned to your HVK account.</p></div><Button variant="outline" onClick={load} disabled={loading}>Refresh</Button></div>
    {loading ? <p role="status" className="mt-8 flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" />Loading examinations…</p> : null}
    {error ? <p role="alert" className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
    {!loading && !error && !exams.length && !taken.length ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-dark-surface-alt"><h2 className="text-xl font-bold text-navy dark:text-white">No examinations yet</h2><p className="mt-2 text-sm text-muted">When you take an exam, or one is assigned to you, it will appear here.</p><Link href="/exam" className={cn(buttonVariants({ variant: "primary" }), "mt-5")}>Go to exam</Link></div> : null}

    {taken.length ? <section aria-labelledby="taken-heading" className="mt-8">
      <h2 id="taken-heading" className="text-lg font-bold text-navy dark:text-white">Exams you have taken</h2>
      <ul className="mt-4 grid gap-4 md:grid-cols-2">{taken.map((t) => {
        const outcome = OUTCOME[t.state];
        return <li key={t.attemptId} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-dark-surface-alt">
          <div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold text-navy dark:text-white">{t.title}</h3><span className={cn("rounded-full px-3 py-1 text-xs font-semibold", outcome.className)}>{outcome.label}</span></div>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted"><CalendarDays className="h-4 w-4" />{formatDate(t.completedAt ?? t.startedAt)} IST</p>
          <div><Link href={skillExamHref(t.examId)} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")} aria-label={`View ${t.title}`}>View</Link></div>
        </li>;
      })}</ul>
    </section> : null}

    {exams.length ? <section aria-labelledby="assigned-heading" className="mt-8">
      <h2 id="assigned-heading" className="text-lg font-bold text-navy dark:text-white">Assigned examinations</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{exams.map((exam) => {
        const canOpen = exam.inviteStatus !== "expired" || exam.hasAttempt;
        const statusLabel = exam.inviteStatus === "invited" ? "Ready" : exam.inviteStatus === "started" ? "In progress" : exam.inviteStatus === "submitted" ? "Submitted" : "Expired";
        return <article key={exam.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-dark-surface-alt"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-navy dark:text-white">{exam.title}</h3><p className="mt-2 text-sm text-muted">{exam.description || "Online examination"}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">{statusLabel}</span></div><div className="mt-5 flex flex-wrap gap-4 text-sm text-muted"><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(exam.scheduledDate))} IST</span><span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />{exam.durationMinutes} minutes</span><span>{exam.questionCount} questions</span></div>{canOpen ? <Link className={cn(buttonVariants({ variant: "primary" }), "mt-5")} href={`/exam/managed/${encodeURIComponent(exam.id)}`}>{exam.inviteStatus === "invited" ? "Open exam" : exam.inviteStatus === "started" ? "Resume exam" : "View submission"}</Link> : <p className="mt-5 text-sm text-muted">This invitation expired before an attempt was started.</p>}</article>;
      })}</div>
    </section> : null}
  </div></main>;
}
