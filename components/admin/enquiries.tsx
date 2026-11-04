"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { ENQUIRY_STATUSES, type Enquiry, type EnquiryStatus, type Page } from "@/types/api";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/portal/form-field";
import { adminEnquiriesApi } from "@/lib/api/enquiries";
import { errorMessage } from "@/lib/api/client";
import { formatDateTime } from "@/lib/ta";
import { AdminShell, cardClass, selectClass } from "./admin-shell";

const STATUS_LABEL: Record<EnquiryStatus, string> = { new: "New", in_progress: "In progress", resolved: "Resolved" };

/** Staff portal: messages sent through the website's "Talk to us" form. */
export function Enquiries() {
  const [filter, setFilter] = React.useState<EnquiryStatus | "">("");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<Page<Enquiry> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    adminEnquiriesApi
      .list({ ...(filter ? { status: filter } : {}), page, limit: 20 })
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

  async function setStatus(enquiry: Enquiry, status: EnquiryStatus) {
    try {
      await adminEnquiriesApi.setStatus(enquiry.id, status);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <AdminShell title="Enquiries">
      <section className={cardClass} aria-labelledby="enquiries-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="enquiries-title" className="text-base font-bold text-navy dark:text-white">
            Website enquiries
          </h2>
          <label className="text-sm font-semibold text-navy dark:text-white">
            Show
            <select
              className={`${selectClass} ml-2`}
              value={filter}
              onChange={(event) => {
                setPage(1);
                setFilter(event.target.value as EnquiryStatus | "");
              }}
            >
              <option value="">All</option>
              {ENQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3">
          <FormMessage>{error}</FormMessage>
        </div>

        {!data && !error ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
          </p>
        ) : data && data.items.length === 0 ? (
          <p className="text-sm text-muted dark:text-slate-400">{filter ? "No enquiries with that status." : "No enquiries yet."}</p>
        ) : data ? (
          <ul className="divide-y divide-slate-100 dark:divide-white/10">
            {data.items.map((e) => (
              <li key={e.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy dark:text-white">
                    <a href={`mailto:${e.email}`} className="hover:underline">
                      {e.email}
                    </a>
                    <span className="mx-2 text-muted">·</span>
                    <a href={`tel:${e.phone}`} className="hover:underline">
                      {e.phone}
                    </a>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink dark:text-slate-200">{e.message}</p>
                  <p className="mt-1 text-xs text-muted dark:text-slate-400">{formatDateTime(e.createdAt)}</p>
                </div>
                <label className="text-xs font-semibold text-muted dark:text-slate-400">
                  <span className="sr-only">Status for {e.email}</span>
                  <select className={selectClass} value={e.status} onChange={(event) => void setStatus(e, event.target.value as EnquiryStatus)}>
                    {ENQUIRY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        ) : null}

        {data && data.total > data.limit ? (
          <div className="mt-4 flex items-center justify-between text-sm text-muted dark:text-slate-400">
            <span>
              {data.total} enquiries · page {page} of {pages}
            </span>
            <span className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </span>
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
