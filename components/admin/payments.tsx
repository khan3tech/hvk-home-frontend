"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { MANUAL_METHODS, type ManualApproval, type ManualMethod, type Page, type PaymentConfig, type PendingCandidate } from "@/types/api";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/portal/form-field";
import { adminPaymentsApi } from "@/lib/api/admin-payments";
import { errorMessage } from "@/lib/api/client";
import { portalApi } from "@/lib/api/portal";
import { formatAmount } from "@/lib/razorpay";
import { formatDateTime } from "@/lib/ta";
import { AdminShell, cardClass, selectClass } from "./admin-shell";

const METHOD_LABEL: Record<ManualMethod, string> = {
  cash: "Cash",
  upi_qr: "UPI QR",
  bank_transfer: "Bank transfer",
  other: "Other",
};

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20 dark:border-white/10 dark:bg-dark-surface-alt dark:text-slate-100";

/** Turns an amount typed in rupees ("499" or "499.50") into minor units; null when empty or invalid. */
export function rupeesToMinor(text: string): number | null {
  const value = text.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const minor = Math.round(Number(value) * 100);
  return minor > 0 ? minor : null;
}

function ApproveDialog({
  candidate,
  fee,
  onClose,
  onApproved,
}: {
  candidate: PendingCandidate;
  fee: PaymentConfig | null;
  onClose: () => void;
  onApproved: (candidate: PendingCandidate) => void;
}) {
  const [method, setMethod] = React.useState<ManualMethod>("cash");
  const [reference, setReference] = React.useState("");
  const [note, setNote] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const amountMinor = amount.trim() ? rupeesToMinor(amount) : undefined;
    if (amount.trim() && amountMinor === null) {
      setError("Enter the amount in rupees, for example 499 or 499.50.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminPaymentsApi.approve({
        candidateId: candidate.id,
        method,
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(amountMinor ? { amountMinor } : {}),
      });
      onApproved(candidate);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-5">
      <form
        onSubmit={(event) => void submit(event)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="approve-title"
        className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl dark:bg-dark-surface"
      >
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-blue dark:text-bright-blue">Approve payment</p>
        <h2 id="approve-title" className="mt-2 text-xl font-bold text-navy dark:text-white">
          {candidate.fullName}
        </h2>
        <p className="mt-1 text-sm text-muted dark:text-slate-400">
          {candidate.phone} · {candidate.email}
        </p>
        <p className="mt-3 text-sm text-ink dark:text-slate-200">
          Only approve after the money has arrived. This unlocks their course videos and exam.
        </p>

        <label className="mt-5 block text-sm font-semibold text-navy dark:text-white">
          How was it paid?
          <select className={`${selectClass} mt-1 w-full`} value={method} onChange={(event) => setMethod(event.target.value as ManualMethod)}>
            {MANUAL_METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABEL[m]}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block text-sm font-semibold text-navy dark:text-white">
          Receipt or transaction reference <span className="font-normal text-muted">(optional)</span>
          <input className={inputClass} value={reference} maxLength={100} onChange={(event) => setReference(event.target.value)} placeholder="For example receipt no. 1042" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-navy dark:text-white">
          Amount received in rupees <span className="font-normal text-muted">(optional; default {fee ? formatAmount(fee.feeMinor, fee.currency) : "the fee"})</span>
          <input className={inputClass} value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value)} placeholder={fee ? String(fee.feeMinor / 100) : ""} />
        </label>
        <label className="mt-4 block text-sm font-semibold text-navy dark:text-white">
          Note <span className="font-normal text-muted">(optional)</span>
          <input className={inputClass} value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} />
        </label>

        <div className="mt-3">
          <FormMessage>{error}</FormMessage>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Approving…" : "Approve payment"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/** Staff portal: approve payments received outside the app (cash, UPI QR, bank transfer), and review what was approved. */
export function Payments() {
  const [query, setQuery] = React.useState("");
  const [applied, setApplied] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<Page<PendingCandidate> | null>(null);
  const [history, setHistory] = React.useState<ManualApproval[] | null>(null);
  const [config, setConfig] = React.useState<PaymentConfig | null>(null);
  const [approving, setApproving] = React.useState<PendingCandidate | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    adminPaymentsApi
      .pending({ ...(applied ? { q: applied } : {}), page, limit: 20 })
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((err: unknown) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [applied, page, version]);

  React.useEffect(() => {
    let cancelled = false;
    adminPaymentsApi
      .approvals()
      .then((h) => !cancelled && setHistory(h))
      .catch(() => !cancelled && setHistory([]));
    return () => {
      cancelled = true;
    };
  }, [version]);

  React.useEffect(() => {
    let cancelled = false;
    portalApi
      .paymentConfig()
      .then((c) => !cancelled && setConfig(c))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <AdminShell title="Payments">
      {config && config.mode !== "manual" ? (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
          Online payment is switched on, so candidates normally pay through Razorpay. You can still approve a payment received in person.
        </p>
      ) : null}

      <section className={cardClass} aria-labelledby="waiting-title">
        <h2 id="waiting-title" className="text-base font-bold text-navy dark:text-white">
          Waiting for approval
        </h2>
        <form
          role="search"
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setApplied(query.trim());
          }}
        >
          <label className="text-sm font-semibold text-navy dark:text-white">
            Search by name, phone or email
            <input className={`${inputClass} w-72`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="For example Asha or 98765" />
          </label>
          <Button type="submit" variant="outline" size="sm">
            <Search className="h-4 w-4" aria-hidden="true" /> Search
          </Button>
        </form>

        <div className="mt-4">
          <FormMessage>{error}</FormMessage>
          {message ? (
            <p role="status" className="mb-3 text-sm font-semibold text-green-700 dark:text-green-400">
              {message}
            </p>
          ) : null}
        </div>

        {!data && !error ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
          </p>
        ) : data && data.items.length === 0 ? (
          <p className="text-sm text-muted dark:text-slate-400">{applied ? "Nobody waiting matches that search." : "Nobody is waiting for approval."}</p>
        ) : data ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted dark:text-slate-400">
                  <th scope="col" className="py-2 pr-4">Candidate</th>
                  <th scope="col" className="py-2 pr-4">Phone</th>
                  <th scope="col" className="py-2 pr-4">College</th>
                  <th scope="col" className="py-2 pr-4">Registered</th>
                  <th scope="col" className="py-2"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100 dark:border-white/10">
                    <td className="py-3 pr-4">
                      <span className="font-semibold text-navy dark:text-white">{c.fullName}</span>
                      <span className="block text-xs text-muted dark:text-slate-400">{c.email}</span>
                    </td>
                    <td className="py-3 pr-4">{c.phone}</td>
                    <td className="py-3 pr-4">{c.college ?? "—"}</td>
                    <td className="py-3 pr-4">{c.registeredAt ? formatDateTime(c.registeredAt) : "—"}</td>
                    <td className="py-3 text-right">
                      <Button size="sm" onClick={() => { setMessage(null); setApproving(c); }} aria-label={`Approve payment for ${c.fullName}`}>
                        Approve
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {data && data.total > data.limit ? (
          <div className="mt-4 flex items-center justify-between text-sm text-muted dark:text-slate-400">
            <span>
              {data.total} waiting · page {page} of {pages}
            </span>
            <span className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </span>
          </div>
        ) : null}
      </section>

      <section className={`${cardClass} mt-6`} aria-labelledby="approved-title">
        <h2 id="approved-title" className="text-base font-bold text-navy dark:text-white">
          Recently approved
        </h2>
        {history === null ? (
          <p className="mt-3 text-sm text-muted">Loading…</p>
        ) : history.length === 0 ? (
          <p className="mt-3 text-sm text-muted dark:text-slate-400">No payments approved yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted dark:text-slate-400">
                  <th scope="col" className="py-2 pr-4">Candidate</th>
                  <th scope="col" className="py-2 pr-4">Amount</th>
                  <th scope="col" className="py-2 pr-4">Method</th>
                  <th scope="col" className="py-2 pr-4">Reference</th>
                  <th scope="col" className="py-2 pr-4">Approved by</th>
                  <th scope="col" className="py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-slate-100 dark:border-white/10">
                    <td className="py-2 pr-4 font-semibold text-navy dark:text-white">{h.candidateName}</td>
                    <td className="py-2 pr-4">{formatAmount(h.amountMinor, h.currency)}</td>
                    <td className="py-2 pr-4">{h.method ? METHOD_LABEL[h.method] : "—"}</td>
                    <td className="py-2 pr-4">{h.reference ?? "—"}</td>
                    <td className="py-2 pr-4">{h.approvedBy ?? "—"}</td>
                    <td className="py-2">{h.approvedAt ? formatDateTime(h.approvedAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {approving ? (
        <ApproveDialog
          candidate={approving}
          fee={config}
          onClose={() => setApproving(null)}
          onApproved={(c) => {
            setApproving(null);
            setMessage(`Approved ${c.fullName}. Their course videos and exam are now unlocked.`);
            setVersion((v) => v + 1);
          }}
        />
      ) : null}
    </AdminShell>
  );
}
