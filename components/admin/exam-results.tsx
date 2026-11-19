"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { Page, SkillExamAttemptAdmin, SkillTerminationReason } from "@/types/api";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/portal/form-field";
import { adminSkillExamApi } from "@/lib/api/skill-exams";
import { errorMessage } from "@/lib/api/client";
import { formatDateTime } from "@/lib/ta";
import { AdminShell, cardClass, selectClass, StatusBadge } from "./admin-shell";

const LIMIT = 20;
const STATE_LABEL: Record<SkillExamAttemptAdmin["state"], string> = {
  in_progress: "In progress",
  qualified: "Qualified",
  disqualified: "Disqualified",
  terminated: "Ended",
};
const REASON_LABEL: Record<SkillTerminationReason, string> = {
  tab_hidden: "Switched tab or app",
  fullscreen_exit: "Left fullscreen",
  screen_share_stopped: "Stopped screen share",
  face_violations: "Face warnings",
  camera_lost: "Camera turned off",
  left_exam: "Left or reloaded the page",
};

/** Course and domain exam results (QA item 11): scores for staff only, and "Allow new attempt". */
export function ExamResults() {
  const [status, setStatus] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<Page<SkillExamAttemptAdmin> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
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
            {(Object.keys(STATE_LABEL) as SkillExamAttemptAdmin["state"][]).map((s) => (
              <option key={s} value={s}>
                {STATE_LABEL[s]}
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
          <table className="w-full min-w-[900px] text-left text-sm">
            <caption className="sr-only">Exam results, {data.total} total</caption>
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-muted dark:border-white/10">
              <tr>
                <th scope="col" className="px-5 py-3">Candidate</th>
                <th scope="col" className="px-5 py-3">Exam</th>
                <th scope="col" className="px-5 py-3">Result</th>
                <th scope="col" className="px-5 py-3">Score</th>
                <th scope="col" className="px-5 py-3">Finished</th>
                <th scope="col" className="px-5 py-3">Feedback</th>
                <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted">No results match these filters.</td>
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
                      {row.percentage === null ? "—" : `${row.percentage}%`}
                      {row.correctCount !== null && row.questionCount ? <p className="text-xs text-muted">{row.correctCount} of {row.questionCount}</p> : null}
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
                        <Button size="sm" variant="outline" disabled={busyId === row.id} onClick={() => void allow(row)}>
                          Allow new attempt
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
