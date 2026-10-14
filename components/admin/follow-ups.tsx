"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { FOLLOW_UP_STATUSES, type FollowUp, type FollowUpStatus, type Page } from "@/types/api";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/portal/form-field";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { useSession } from "@/lib/session/session-provider";
import { FOLLOW_UP_STATUS_LABEL, FOLLOW_UP_TRANSITIONS, formatDateTime } from "@/lib/ta";
import { cn } from "@/lib/utils";
import { AdminShell, cardClass } from "./admin-shell";

/** Unpaid-payment follow-ups created 24 h after registration, oldest first. */
export function FollowUps() {
  const { candidate: me } = useSession();
  const [tab, setTab] = React.useState<FollowUpStatus>("open");
  const [data, setData] = React.useState<Page<FollowUp> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [closing, setClosing] = React.useState<string | null>(null);
  const [outcome, setOutcome] = React.useState("");
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    adminApi
      .listFollowUps({ status: tab, limit: 50 })
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((err: unknown) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [tab, version]);

  async function update(fu: FollowUp, patch: Parameters<typeof adminApi.updateFollowUp>[1]) {
    setError(null);
    try {
      await adminApi.updateFollowUp(fu.id, patch);
      setClosing(null);
      setOutcome("");
      setVersion((v) => v + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <AdminShell title="Payment follow-ups">
      <div role="tablist" aria-label="Follow-up status" className="flex flex-wrap gap-2">
        {FOLLOW_UP_STATUSES.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={tab === s}
            onClick={() => {
              setData(null);
              setTab(s);
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold",
              tab === s ? "bg-bright-blue text-white" : "bg-white text-muted hover:text-navy dark:bg-dark-surface",
            )}
          >
            {FOLLOW_UP_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <FormMessage>{error}</FormMessage>

      {!data && !error ? (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading follow-ups...
        </p>
      ) : null}

      {data ? (
        <ul className="mt-4 space-y-3" aria-label={`${FOLLOW_UP_STATUS_LABEL[tab]} follow-ups`}>
          {data.items.length === 0 ? <li className={`${cardClass} text-sm text-muted`}>Nothing here.</li> : null}
          {data.items.map((fu) => {
            const allowed = FOLLOW_UP_TRANSITIONS[fu.status];
            return (
              <li key={fu.id} className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy dark:text-white">{fu.candidate?.fullName ?? "Unknown candidate"}</p>
                    <p className="text-sm text-muted">
                      {fu.candidate?.phone ? <a href={`tel:${fu.candidate.phone}`} className="hover:underline">{fu.candidate.phone}</a> : "—"}
                      {fu.candidate?.city ? ` · ${fu.candidate.city}` : ""} · due {formatDateTime(fu.dueAt)}
                    </p>
                    {fu.outcome ? <p className="mt-1 text-sm text-navy dark:text-white">Outcome: {fu.outcome}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allowed.includes("in_progress") ? (
                      <Button size="sm" variant="outline" onClick={() => void update(fu, { status: "in_progress", ...(me ? { assignedTo: me.id } : {}) })}>
                        Start
                      </Button>
                    ) : null}
                    {allowed.includes("done") ? (
                      <Button size="sm" onClick={() => setClosing(fu.id)}>Mark done</Button>
                    ) : null}
                    {allowed.includes("cancelled") ? (
                      <Button size="sm" variant="ghost" onClick={() => void update(fu, { status: "cancelled" })}>Cancel</Button>
                    ) : null}
                  </div>
                </div>
                {closing === fu.id ? (
                  <form
                    className="mt-3 flex flex-col gap-2 sm:flex-row"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void update(fu, { status: "done", outcome: outcome.trim() });
                    }}
                  >
                    <label htmlFor={`outcome-${fu.id}`} className="sr-only">Outcome</label>
                    <input
                      id={`outcome-${fu.id}`}
                      required
                      maxLength={2000}
                      placeholder="Outcome, e.g. Will pay today"
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value)}
                      className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm dark:border-white/10 dark:bg-dark-surface-alt"
                    />
                    <Button size="sm" type="submit" className="h-10" disabled={!outcome.trim()}>Save outcome</Button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </AdminShell>
  );
}
