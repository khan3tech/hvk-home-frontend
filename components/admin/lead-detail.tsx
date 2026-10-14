"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { LeadStatus, StaffMember, TaLead } from "@/types/api";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/portal/form-field";
import { adminApi, type LeadPatch } from "@/lib/api/admin";
import { ApiError, errorMessage } from "@/lib/api/client";
import { useSession } from "@/lib/session/session-provider";
import { formatDateTime, LEAD_STATUS_LABEL, LEAD_TRANSITIONS, STEP_LABEL } from "@/lib/ta";
import { AdminShell, cardClass, selectClass, StatusBadge } from "./admin-shell";

/** `datetime-local` value (local time) ↔ ISO string. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function LeadDetail({ id }: { id: string }) {
  const { candidate: me } = useSession();
  const [lead, setLead] = React.useState<TaLead | null>(null);
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [status, setStatus] = React.useState<LeadStatus | "">("");
  const [assignee, setAssignee] = React.useState("");
  const [nextAction, setNextAction] = React.useState("");
  const [note, setNote] = React.useState("");
  const [message, setMessage] = React.useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = React.useState(false);

  const applyLead = React.useCallback((l: TaLead) => {
    setLead(l);
    setStatus(l.status);
    setAssignee(l.assignedTo ?? "");
    setNextAction(toLocalInput(l.nextActionAt));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([adminApi.getLead(id), adminApi.listStaff().catch(() => [] as StaffMember[])])
      .then(([l, s]) => {
        if (cancelled) return;
        applyLead(l);
        setStaff(s);
      })
      .catch((err: unknown) => !cancelled && setMessage({ tone: "error", text: errorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [id, applyLead]);

  if (!lead) {
    return (
      <AdminShell title="Lead">
        {message ? <FormMessage>{message.text}</FormMessage> : (
          <p role="status" className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading lead...
          </p>
        )}
      </AdminShell>
    );
  }

  const staffName = (sid: string | null) => staff.find((s) => s.id === sid)?.fullName ?? (sid ? "Staff member" : "Unassigned");
  const options = [lead.status, ...LEAD_TRANSITIONS[lead.status]];
  const c = lead.candidate;

  async function save(override?: LeadPatch) {
    if (!lead) return;
    const patch: LeadPatch = override ?? {};
    if (!override) {
      if (status && status !== lead.status) patch.status = status;
      if ((assignee || null) !== lead.assignedTo) patch.assignedTo = assignee || null;
      const nextIso = nextAction ? new Date(nextAction).toISOString() : null;
      if (nextIso !== lead.nextActionAt) patch.nextActionAt = nextIso;
      if (note.trim()) patch.note = note.trim();
    }
    if (Object.keys(patch).length === 0) {
      setMessage({ tone: "error", text: "Nothing to save yet." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      applyLead(await adminApi.updateLead(lead.id, patch));
      setNote("");
      setMessage({ tone: "success", text: "Lead updated." });
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_STATE") {
        applyLead(await adminApi.getLead(lead.id));
        setMessage({ tone: "error", text: "This lead was updated by someone else. We've loaded the latest version — please review and try again." });
      } else {
        setMessage({ tone: "error", text: errorMessage(err) });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title={c?.fullName ?? "Lead"}>
      <Link href="/admin/leads" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-blue hover:underline dark:text-bright-blue">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All leads
      </Link>
      <div className="grid gap-5 lg:grid-cols-3">
        <section className={`${cardClass} lg:col-span-1`} aria-labelledby="cand-heading">
          <h2 id="cand-heading" className="text-sm font-bold uppercase tracking-wide text-muted">Candidate</h2>
          {c ? (
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["Email", <a key="e" href={`mailto:${c.email}`} className="text-primary-blue hover:underline">{c.email}</a>],
                ["Phone", <a key="p" href={`tel:${c.phone}`} className="text-primary-blue hover:underline">{c.phone}</a>],
                ["College", c.college ?? "—"],
                ["Place", c.place ?? "—"],
                ["City / State", [c.city, c.state].filter(Boolean).join(", ") || "—"],
                ["Journey", STEP_LABEL[c.onboardingStep]],
                ["Registered", formatDateTime(lead.createdAt)],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium text-navy dark:text-white">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted">Candidate record unavailable.</p>
          )}
        </section>

        <section className={`${cardClass} lg:col-span-2`} aria-labelledby="lead-heading">
          <div className="flex items-center justify-between">
            <h2 id="lead-heading" className="text-sm font-bold uppercase tracking-wide text-muted">Lead</h2>
            <StatusBadge>{LEAD_STATUS_LABEL[lead.status]}</StatusBadge>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
              Status
              <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} disabled={options.length === 1}>
                {options.map((s) => (
                  <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-1 text-xs font-semibold text-muted">
              <label htmlFor="assignee">Assigned to</label>
              <div className="flex gap-2">
                <select id="assignee" className={`${selectClass} flex-1`} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
                {me && lead.assignedTo !== me.id ? (
                  <Button type="button" variant="outline" size="sm" className="h-10" disabled={saving} onClick={() => void save({ assignedTo: me.id })}>
                    Assign to me
                  </Button>
                ) : null}
              </div>
            </div>
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
              Next action
              <input type="datetime-local" className={selectClass} value={nextAction} onChange={(e) => setNextAction(e.target.value)} />
            </label>
            <div className="text-xs text-muted">
              <p className="font-semibold">Last contact</p>
              <p className="mt-2 text-sm text-navy dark:text-white">{formatDateTime(lead.lastContactAt)}</p>
            </div>
          </div>
          <label className="mt-4 flex flex-col gap-1 text-xs font-semibold text-muted">
            Add a note
            <textarea
              rows={3}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-ink focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20 dark:border-white/10 dark:bg-dark-surface-alt dark:text-slate-100"
            />
          </label>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
            {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
          </div>

          <h3 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">Notes</h3>
          {lead.notes.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No notes yet.</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {[...lead.notes].reverse().map((n, i) => (
                <li key={`${n.at}-${i}`} className="rounded-lg bg-light-blue/40 p-3 text-sm dark:bg-dark-surface-alt">
                  <p className="whitespace-pre-wrap text-navy dark:text-white">{n.text}</p>
                  <p className="mt-1 text-xs text-muted">{staffName(n.by)} · {formatDateTime(n.at)}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
