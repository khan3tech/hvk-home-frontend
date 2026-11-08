import type { ManualApproval, ManualMethod, Page, PendingCandidate, Payment } from "@/types/api";
import { apiFetch } from "./client";

export interface ApprovalInput {
  candidateId: string;
  method: ManualMethod;
  reference?: string;
  note?: string;
  /** Defaults to the registration fee. */
  amountMinor?: number;
}

/** Staff endpoints for payments received outside the app (role ta or admin). */
export const adminPaymentsApi = {
  pending: (q: { q?: string; page?: number; limit?: number }) => apiFetch<Page<PendingCandidate>>("/admin/payments/pending", { query: { ...q } }),
  approve: (input: ApprovalInput) => apiFetch<Payment>("/admin/payments/manual", { method: "POST", body: input }),
  approvals: () => apiFetch<ManualApproval[]>("/admin/payments/manual"),
};
