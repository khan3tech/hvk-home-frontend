"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { Page } from "@/types/api";
import { CONSULTATION_STATUSES, type ConsultationDetail, type ConsultationRow, type ConsultationStatus, type InteriorStaff } from "@/lib/interiors/types";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/portal/form-field";
import { adminInteriorsApi } from "@/lib/api/interiors";
import { errorMessage } from "@/lib/api/client";
import { INTERIOR_SERVICES } from "@/lib/interiors/content";
import { formatDateTime } from "@/lib/ta";
import { AdminShell, StatusBadge, cardClass, selectClass } from "../admin-shell";
import { STATUS_LABEL, StaffControls, type StaffChange } from "./staff-controls";

const SLOT_LABEL = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" } as const;
const serviceTitle = (code: string) => INTERIOR_SERVICES.find((s) => s.slug === code)?.title ?? code;

/** Staff portal (interiors): free consultation and site visit requests. */
export function InteriorConsultations() {
  const [filter, setFilter] = React.useState<ConsultationStatus | "">("");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<Page<ConsultationRow> | null>(null);
  const [staff, setStaff] = React.useState<InteriorStaff[]>([]);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<ConsultationDetail | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    adminInteriorsApi
      .consultations({ ...(filter ? { status: filter } : {}), page, limit: 20 })
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

  async function save(row: ConsultationRow, change: StaffChange) {
    setBusy(true);
    setError(null);
    try {
      setDetail(await adminInteriorsApi.updateConsultation(row.id, change as Parameters<typeof adminInteriorsApi.updateConsultation>[1]));
      setMessage("Saved.");
      setVersion((v) => v + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <AdminShell title="Consultations">
      <section className={cardClass} aria-labelledby="consult-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="consult-title" className="text-base font-bold text-navy dark:text-white">
            Free consultation and site visit requests
          </h2>
          <label className="text-sm font-semibold text-navy dark:text-white">
            Show
            <select
              className={`${selectClass} ml-2`}
              value={filter}
              onChange={(e) => {
                setPage(1);
                setFilter(e.target.value as ConsultationStatus | "");
              }}
            >
              <option value="">All</option>
              {CONSULTATION_STATUSES.map((s) => (
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
          <p className="text-sm text-muted dark:text-slate-400">{filter ? "No requests with that status." : "No consultation requests yet."}</p>
        ) : data ? (
          <ul className="divide-y divide-slate-100 dark:divide-white/10">
            {data.items.map((c) => (
              <li key={c.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    aria-expanded={openId === c.id}
                    onClick={() => {
                      setMessage(null);
                      setDetail(null);
                      setOpenId(openId === c.id ? null : c.id);
                    }}
                    className="min-w-0 text-left"
                  >
                    <span className="block text-sm font-semibold text-navy dark:text-white">
                      {c.name} · {serviceTitle(c.service)}
                    </span>
                    <span className="block text-xs text-muted dark:text-slate-400">
                      {c.preferredDate} {SLOT_LABEL[c.slot]} · {c.phone} · requested {formatDateTime(c.createdAt)}
                    </span>
                  </button>
                  <StatusBadge>{STATUS_LABEL[c.status]}</StatusBadge>
                </div>
                {openId === c.id ? (
                  <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-white/5">
                    <p className="text-sm">
                      <a href={`tel:${c.phone}`} className="font-semibold hover:underline">
                        {c.phone}
                      </a>{" "}
                      ·{" "}
                      <a href={`mailto:${c.email}`} className="hover:underline">
                        {c.email}
                      </a>
                      {c.city ? ` · ${c.city}` : ""}
                    </p>
                    {c.message ? <p className="mt-1 whitespace-pre-wrap text-sm">&ldquo;{c.message}&rdquo;</p> : null}
                    {detail && detail.id === c.id && detail.staffNotes.length > 0 ? (
                      <ul className="mt-3 space-y-1 text-xs text-muted dark:text-slate-400" aria-label="Notes">
                        {detail.staffNotes.map((n, i) => (
                          <li key={i}>
                            <strong>{n.by}</strong> · {formatDateTime(n.at)}: {n.text}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <StaffControls key={`${c.status}-${c.assignedTo}-${detail?.staffNotes.length ?? 0}`} statuses={CONSULTATION_STATUSES} status={c.status} assignedTo={c.assignedTo} staff={staff} busy={busy} onSave={(change) => void save(c, change)} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {data && data.total > data.limit ? (
          <div className="mt-4 flex items-center justify-between text-sm text-muted dark:text-slate-400">
            <span>
              {data.total} requests · page {page} of {pages}
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
