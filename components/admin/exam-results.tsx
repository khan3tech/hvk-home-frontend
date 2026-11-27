"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { Page, SkillExamAttemptAdmin, SkillExamDecision, SkillTerminationReason } from "@/types/api";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/portal/form-field";
import { adminSkillExamApi } from "@/lib/api/skill-exams";
import { errorMessage } from "@/lib/api/client";
import { formatDateTime } from "@/lib/ta";
import { AdminShell, cardClass, selectClass, StatusBadge } from "./admin-shell";

const LIMIT = 20;
const STATE_LABEL: Record<SkillExamAttemptAdmin["state"], string> = {
  in_progress: "In progress",
  submitted: "Submitted",
  terminated: "Ended",
};
/** Filters: the staff decision, or how the exam ended. */
const FILTERS: { value: string; label: string }[] = [
  { value: "awaiting_decision", label: "Awaiting decision" },
  { value: "qualified", label: "Qualified" },
  { value: "disqualified", label: "Disqualified" },
  { value: "terminated", label: "Ended" },
  { value: "in_progress", label: "In progress" },
];
const DECISION_LABEL: Record<SkillExamDecision, string> = { qualified: "Qualified", disqualified: "Disqualified" };
const REASON_LABEL: Record<SkillTerminationReason, string> = {
  tab_hidden: "Switched tab or app",
  fullscreen_exit: "Left fullscreen",
  screen_share_stopped: "Stopped screen share",
  face_violations: "Face warnings",
  camera_lost: "Camera turned off",
  left_exam: "Left or reloaded the page",
  connection_lost: "Lost connection for 5+ minutes",
  ended_by_staff: "Ended by staff",
};

/** Exam results: staff see how many answers were correct, decide Qualified or Disqualified (candidates only see "thank you"), and can allow a new attempt. */
export function ExamResults() {
  const [status, setStatus] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<Page<SkillExamAttemptAdmin> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [deciding, setDeciding] = React.useState<{ id: string; decision: SkillExamDecision } | null>(null);
  const [reload, setReload] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    adminSkillExamApi
      .attempts({ status: status || undefined, q: search || undefined, page, limit: LIMIT })
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((err: unknown) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [status, search, page, reload]);

  async function allow(row: SkillExamAttemptAdmin) {
    // An exam still "in progress" may be stuck after a crash, or the candidate may really be writing it: ask first.
    if (
      row.state === "in_progress" &&
      !window.confirm(`${row.candidate?.fullName ?? "This candidate"}'s exam is still marked in progress. End it now and allow a new attempt?`)
    ) {
      return;
    }
    setBusyId(row.id);
    setNotice(null);
    setError(null);
    try {
      await adminSkillExamApi.allowNewAttempt(row.id);
      setNotice(`${row.candidate?.fullName ?? "The candidate"} can now start one more exam.`);
      setReload((n) => n + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function decide(row: SkillExamAttemptAdmin, decision: SkillExamDecision) {
    const name = row.candidate?.fullName ?? "this candidate";
    if (row.decision && !window.confirm(`Change ${name}'s result to ${DECISION_LABEL[decision]}? They will be emailed again.`)) return;
    setDeciding({ id: row.id, decision });
    setNotice(null);
    setError(null);
    try {
      await adminSkillExamApi.decide(row.id, decision);
      setNotice(`${row.candidate?.fullName ?? "The candidate"} is marked ${DECISION_LABEL[decision]} and has been emailed.`);
      setReload((n) => n + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeciding(null);
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  return (
    <AdminShell title="Exam results">
      <form
        className={`${cardClass} flex flex-wrap items-end gap-4`}
        aria-label="Filter exam results"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(query.trim());
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Result
          <select
            className={selectClass}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All results</option>
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Candidate
          <input className={selectClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, email or phone" />
        </label>
        <Button type="submit" size="sm" variant="outline">
          Search
        </Button>
      </form>

      <FormMessage>{error}</FormMessage>
      {notice ? (
        <p role="status" className="mt-3 text-sm font-semibold text-green-700 dark:text-green-400">
          {notice}
        </p>
      ) : null}

      <div className={`${cardClass} mt-4 overflow-x-auto p-0`}>
        {!data && !error ? (
          <p role="status" className="flex items-center gap-2 p-5 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading results...
          </p>
        ) : null}
        {data ? (
          <table className="w-full min-w-[1040px] text-left text-sm">
            <caption className="sr-only">Exam results, {data.total} total</caption>
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-muted dark:border-white/10">
              <tr>
                <th scope="col" className="px-5 py-3">Candidate</th>
                <th scope="col" className="px-5 py-3">Exam</th>
                <th scope="col" className="px-5 py-3">Exam status</th>
                <th scope="col" className="px-5 py-3">Correct answers</th>
                <th scope="col" className="px-5 py-3">Decision</th>
                <th scope="col" className="px-5 py-3">Finished</th>
                <th scope="col" className="px-5 py-3">Feedback</th>
                <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-muted">No results match these filters.</td>
                </tr>
              ) : (
                data.items.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 align-top last:border-0 dark:border-white/5">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-navy dark:text-white">{row.candidate?.fullName ?? "Unknown"}</p>
                      {row.candidate ? <p className="break-all text-xs text-muted">{row.candidate.email} · {row.candidate.phone}</p> : null}
                    </td>
                    <td className="px-5 py-3">{row.exam?.title ?? "—"}</td>
                    <td className="px-5 py-3">
                      <StatusBadge>{STATE_LABEL[row.state]}</StatusBadge>
                      {row.terminationReason ? <p className="mt-1 text-xs text-muted">{REASON_LABEL[row.terminationReason]}</p> : null}
                      {row.releasedAt ? <p className="mt-1 text-xs text-green-700 dark:text-green-400">New attempt allowed</p> : null}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {row.correctCount !== null && row.questionCount ? (
                        <>
                          <p className="font-semibold text-navy dark:text-white">{row.correctCount} of {row.questionCount} correct</p>
                          {row.percentage !== null ? <p className="text-xs text-muted">{row.percentage}%</p> : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {row.decision ? (
                        <p className={row.decision === "qualified" ? "font-semibold text-green-700 dark:text-green-400" : "font-semibold text-red-700 dark:text-red-400"}>
                          {DECISION_LABEL[row.decision]}
                        </p>
                      ) : row.state === "in_progress" ? (
                        "—"
                      ) : (
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Awaiting decision</p>
                      )}
                      {row.state !== "in_progress" ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(["qualified", "disqualified"] as const)
                            .filter((d) => d !== row.decision)
                            .map((d) => (
                              <Button
                                key={d}
                                size="sm"
                                variant={d === "qualified" && !row.decision ? "primary" : "outline"}
                                aria-label={`${d === "qualified" ? "Qualify" : "Disqualify"} ${row.candidate?.fullName ?? "candidate"}`}
                                disabled={deciding !== null && !(deciding.id === row.id && deciding.decision === d)}
                                loading={deciding?.id === row.id && deciding.decision === d}
                                onClick={() => void decide(row, d)}
                              >
                                {d === "qualified" ? "Qualify" : "Disqualify"}
                              </Button>
                            ))}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-muted">{row.completedAt ? formatDateTime(row.completedAt) : "—"}</td>
                    <td className="px-5 py-3">
                      {row.feedback ? (
                        <>
                          <p className="font-semibold">{row.feedback.rating}/5</p>
                          {row.feedback.comments ? <p className="max-w-xs text-xs text-muted">{row.feedback.comments}</p> : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {row.canAllowNewAttempt ? (
                        <Button size="sm" variant="outline" disabled={busyId !== null && busyId !== row.id} loading={busyId === row.id} onClick={() => void allow(row)}>
                          {row.state === "in_progress" ? "End exam and allow new attempt" : "Allow new attempt"}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : null}
      </div>

      {data ? (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">
            {data.total} result{data.total === 1 ? "" : "s"} · page {page} of {pages}
          </span>
          <span className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </span>
        </nav>
      ) : null}
    </AdminShell>
  );
}
