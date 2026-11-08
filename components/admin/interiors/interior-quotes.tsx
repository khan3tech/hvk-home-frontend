"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { Page } from "@/types/api";
import { QUOTE_STATUSES, type InteriorStaff, type QuoteDetail, type QuoteRow, type QuoteStatus } from "@/lib/interiors/types";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/portal/form-field";
import { adminInteriorsApi } from "@/lib/api/interiors";
import { errorMessage } from "@/lib/api/client";
import { formatInr } from "@/lib/interiors/estimator";
import { formatDateTime } from "@/lib/ta";
import { AdminShell, StatusBadge, cardClass, selectClass } from "../admin-shell";
import { STATUS_LABEL, StaffControls, type StaffChange } from "./staff-controls";

/** Staff portal (interiors): quote requests from the estimator. */
export function InteriorQuotes() {
  const [filter, setFilter] = React.useState<QuoteStatus | "">("");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<Page<QuoteRow> | null>(null);
  const [staff, setStaff] = React.useState<InteriorStaff[]>([]);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<QuoteDetail | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    adminInteriorsApi
      .quotes({ ...(filter ? { status: filter } : {}), page, limit: 20 })
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((err: unknown) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [filter, page, version]);

  React.useEffect(() => {
    let cancelled = false;
    adminInteriorsApi
      .staff()
      .then((s) => !cancelled && setStaff(s))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function open(id: string) {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetail(null);
    setMessage(null);
    try {
      setDetail(await adminInteriorsApi.quote(id));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function save(id: string, change: StaffChange) {
    setBusy(true);
    setError(null);
    try {
      setDetail(await adminInteriorsApi.updateQuote(id, change as Parameters<typeof adminInteriorsApi.updateQuote>[1]));
      setMessage("Saved.");
      setVersion((v) => v + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const nameOf = (id: string | null) => (id ? (staff.find((s) => s.id === id)?.fullName ?? "Staff") : "Unassigned");

  return (
    <AdminShell title="Interiors quotes">
      <section className={cardClass} aria-labelledby="quotes-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="quotes-title" className="text-base font-bold text-navy dark:text-white">
            Quote requests
          </h2>
          <label className="text-sm font-semibold text-navy dark:text-white">
            Show
            <select
              className={`${selectClass} ml-2`}
              value={filter}
              onChange={(e) => {
                setPage(1);
                setFilter(e.target.value as QuoteStatus | "");
              }}
            >
              <option value="">All</option>
              {QUOTE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3">
          <FormMessage>{error}</FormMessage>
          {message ? (
            <p role="status" className="text-sm font-semibold text-green-700 dark:text-green-400">
              {message}
            </p>
          ) : null}
        </div>

        {!data && !error ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
          </p>
        ) : data && data.items.length === 0 ? (
          <p className="text-sm text-muted dark:text-slate-400">{filter ? "No quotes with that status." : "No quote requests yet."}</p>
        ) : data ? (
          <ul className="divide-y divide-slate-100 dark:divide-white/10">
            {data.items.map((q) => (
              <li key={q.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button type="button" onClick={() => void open(q.id)} aria-expanded={openId === q.id} className="min-w-0 text-left">
                    <span className="block text-sm font-semibold text-navy dark:text-white">
                      {q.reference} · {q.name}
                    </span>
                    <span className="block text-xs text-muted dark:text-slate-400">
                      {q.city} · {q.tier} · {formatInr(q.total)} · {formatDateTime(q.createdAt)} · {nameOf(q.assignedTo)}
                    </span>
                  </button>
                  <StatusBadge>{STATUS_LABEL[q.status]}</StatusBadge>
                </div>

                {openId === q.id ? (
                  <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-white/5">
                    {!detail ? (
                      <p className="text-sm text-muted">Loading…</p>
                    ) : (
                      <>
                        <p className="text-sm">
                          <a href={`tel:${detail.phone}`} className="font-semibold hover:underline">
                            {detail.phone}
                          </a>{" "}
                          ·{" "}
                          <a href={`mailto:${detail.email}`} className="hover:underline">
                            {detail.email}
                          </a>{" "}
                          · {detail.propertyType}
                        </p>
                        {detail.notes ? <p className="mt-1 whitespace-pre-wrap text-sm">&ldquo;{detail.notes}&rdquo;</p> : null}
                        <p className="mt-3 text-sm font-semibold text-navy dark:text-white">
                          Estimate shown: {formatInr(detail.result.low)} to {formatInr(detail.result.high)} (total {formatInr(detail.result.total)}, GST {detail.result.gstPercent}% extra)
                        </p>
                        <div className="mt-2 space-y-2">
                          {detail.result.rooms.map((room) => (
                            <details key={room.name + room.type} className="rounded-md border border-slate-200 p-2 text-sm dark:border-white/10">
                              <summary className="flex cursor-pointer justify-between font-semibold">
                                <span>
                                  {room.name} <span className="font-normal text-muted">({room.floorAreaSqft} sq ft)</span>
                                </span>
                                <span>{formatInr(room.subtotal)}</span>
                              </summary>
                              <ul className="mt-1 space-y-0.5 text-xs">
                                {room.lines.map((line) => (
                                  <li key={line.code} className="flex justify-between gap-3">
                                    <span>
                                      {line.label}: {line.qty} {line.unit} × {formatInr(line.rate)}
                                    </span>
                                    <span>{formatInr(line.amount)}</span>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          ))}
                        </div>
                        {detail.staffNotes.length > 0 ? (
                          <ul className="mt-3 space-y-1 text-xs text-muted dark:text-slate-400" aria-label="Notes">
                            {detail.staffNotes.map((n, i) => (
                              <li key={i}>
                                <strong>{n.by}</strong> · {formatDateTime(n.at)}: {n.text}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <StaffControls key={`${detail.status}-${detail.assignedTo}-${detail.staffNotes.length}`} statuses={QUOTE_STATUSES} status={detail.status} assignedTo={detail.assignedTo} staff={staff} busy={busy} onSave={(change) => void save(detail.id, change)} />
                      </>
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {data && data.total > data.limit ? (
          <div className="mt-4 flex items-center justify-between text-sm text-muted dark:text-slate-400">
            <span>
              {data.total} quotes · page {page} of {pages}
            </span>
            <span className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </span>
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
