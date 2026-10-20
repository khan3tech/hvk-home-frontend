"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, Clock3, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { portalApi } from "@/lib/api/portal";
import { errorMessage } from "@/lib/api/client";
import type { ManagedExamInvite } from "@/types/api";
import { cn } from "@/lib/utils";

export function ManagedExamList() {
  const [exams, setExams] = React.useState<ManagedExamInvite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    portalApi.managedExamInvites().then(setExams).catch((err: unknown) => setError(errorMessage(err))).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return <main className="min-h-screen bg-slate-50 px-5 py-10 dark:bg-dark-surface"><div className="mx-auto max-w-5xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.18em] text-primary-blue">CANDIDATE PORTAL</p><h1 className="mt-2 text-3xl font-bold text-navy dark:text-white">My examinations</h1><p className="mt-2 text-sm text-muted">Exams assigned to your HVK account appear here.</p></div><Button variant="outline" onClick={load} disabled={loading}>Refresh</Button></div>
    {loading ? <p role="status" className="mt-8 flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" />Loading examinations…</p> : null}
    {error ? <p role="alert" className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
    {!loading && !error && !exams.length ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-dark-surface-alt"><h2 className="text-xl font-bold text-navy dark:text-white">No assigned examinations</h2><p className="mt-2 text-sm text-muted">When an administrator assigns an exam to you, it will appear here.</p></div> : null}
    <div className="mt-6 grid gap-4 md:grid-cols-2">{exams.map((exam) => {
      const canOpen = exam.inviteStatus !== "expired" || exam.hasAttempt;
      const statusLabel = exam.inviteStatus === "invited" ? "Ready" : exam.inviteStatus === "started" ? "In progress" : exam.inviteStatus === "submitted" ? "Submitted" : "Expired";
      return <article key={exam.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-dark-surface-alt"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-navy dark:text-white">{exam.title}</h2><p className="mt-2 text-sm text-muted">{exam.description || "Online examination"}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">{statusLabel}</span></div><div className="mt-5 flex flex-wrap gap-4 text-sm text-muted"><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(exam.scheduledDate))} IST</span><span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />{exam.durationMinutes} minutes</span><span>{exam.questionCount} questions</span></div>{canOpen ? <Link className={cn(buttonVariants({ variant: "primary" }), "mt-5")} href={`/exam/managed/${encodeURIComponent(exam.id)}`}>{exam.inviteStatus === "invited" ? "Open exam" : exam.inviteStatus === "started" ? "Resume exam" : "View submission"}</Link> : <p className="mt-5 text-sm text-muted">This invitation expired before an attempt was started.</p>}</article>;
    })}</div>
  </div></main>;
}
