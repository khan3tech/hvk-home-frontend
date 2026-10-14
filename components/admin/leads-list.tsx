"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { LEAD_STATUSES, type LeadStatus, type Page, type TaLead } from "@/types/api";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/portal/form-field";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { formatDateTime, LEAD_STATUS_LABEL, STEP_LABEL } from "@/lib/ta";
import { AdminShell, cardClass, selectClass, StatusBadge } from "./admin-shell";

const LIMIT = 20;

/** Lead list with filters and pagination kept in the URL (shareable, back-button friendly). */
export function LeadsList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const status = (params.get("status") as LeadStatus | null) ?? undefined;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);

  const [data, setData] = React.useState<Page<TaLead> | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    adminApi
      .listLeads({
        status,
        from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
        page,
        limit: LIMIT,
      })
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((err: unknown) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [status, from, to, page]);

  function setFilter(next: Record<string, string | undefined>) {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    if (!("page" in next)) q.delete("page");
    router.replace(`${pathname}${q.size ? `?${q.toString()}` : ""}`);
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <AdminShell title="Leads">
      <form className={`${cardClass} flex flex-wrap items-end gap-4`} aria-label="Filter leads" onSubmit={(e) => e.preventDefault()}>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Status
          <select className={selectClass} value={status ?? ""} onChange={(e) => setFilter({ status: e.target.value || undefined })}>
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Registered from
          <input type="date" className={selectClass} value={from} onChange={(e) => setFilter({ from: e.target.value || undefined })} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Registered to
          <input type="date" className={selectClass} value={to} onChange={(e) => setFilter({ to: e.target.value || undefined })} />
        </label>
        {status || from || to ? (
          <Button variant="ghost" size="sm" type="button" onClick={() => router.replace(pathname)}>
            Clear filters
          </Button>
        ) : null}
      </form>

      <FormMessage>{error}</FormMessage>

      <div className={`${cardClass} mt-4 overflow-x-auto p-0`}>
        {!data && !error ? (
          <p role="status" className="flex items-center gap-2 p-5 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading leads...
          </p>
        ) : null}
        {data ? (
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">TA leads, {data.total} total</caption>
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-muted dark:border-white/10">
              <tr>
                <th scope="col" className="px-5 py-3">Candidate</th>
                <th scope="col" className="px-5 py-3">Phone</th>
                <th scope="col" className="px-5 py-3">City</th>
                <th scope="col" className="px-5 py-3">Journey</th>
                <th scope="col" className="px-5 py-3">Lead status</th>
                <th scope="col" className="px-5 py-3">Registered</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted">No leads match these filters.</td>
                </tr>
              ) : (
                data.items.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-50 last:border-0 dark:border-white/5">
                    <td className="px-5 py-3 font-semibold">
                      <Link href={`/admin/leads/${lead.id}`} className="text-primary-blue hover:underline dark:text-bright-blue">
                        {lead.candidate?.fullName ?? "Unknown"}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{lead.candidate?.phone ?? "—"}</td>
                    <td className="px-5 py-3">{lead.candidate?.city ?? "—"}</td>
                    <td className="px-5 py-3">{lead.candidate ? STEP_LABEL[lead.candidate.onboardingStep] : "—"}</td>
                    <td className="px-5 py-3"><StatusBadge>{LEAD_STATUS_LABEL[lead.status]}</StatusBadge></td>
                    <td className="px-5 py-3 text-muted">{formatDateTime(lead.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : null}
      </div>

      {data ? (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">{data.total} lead{data.total === 1 ? "" : "s"} · page {page} of {pages}</span>
          <span className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setFilter({ page: String(page - 1) })}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setFilter({ page: String(page + 1) })}>Next</Button>
          </span>
        </nav>
      ) : null}
    </AdminShell>
  );
}
