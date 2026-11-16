import type { FollowUp, FollowUpStatus, LeadStatus, Page, StaffMember, TaLead } from "@/types/api";
import type { LeadImportRow } from "@/lib/lead-import";
import { apiFetch } from "./client";

export interface LeadImportResult {
  batchId: string;
  created: number;
  /** `row` is 1-based within the rows sent. */
  skipped: { row: number; reason: "invalid" | "registered" | "duplicate"; message: string }[];
}

export interface LeadQuery {
  status?: LeadStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface LeadPatch {
  status?: LeadStatus;
  assignedTo?: string | null;
  nextActionAt?: string | null;
  note?: string;
}

export interface FollowUpPatch {
  status?: FollowUpStatus;
  assignedTo?: string | null;
  outcome?: string;
}

/** TA/admin endpoints (role ta or admin; every call is audited by the API). */
export const adminApi = {
  listLeads: (q: LeadQuery) => apiFetch<Page<TaLead>>("/admin/ta-leads", { query: { ...q } }),
  importLeads: (rows: LeadImportRow[]) =>
    apiFetch<LeadImportResult>("/admin/ta-leads/import", { method: "POST", body: { rows } }),
  getLead: (id: string) => apiFetch<TaLead>(`/admin/ta-leads/${encodeURIComponent(id)}`),
  updateLead: (id: string, patch: LeadPatch) =>
    apiFetch<TaLead>(`/admin/ta-leads/${encodeURIComponent(id)}`, { method: "PATCH", body: patch }),
  listFollowUps: (q: { status?: FollowUpStatus; page?: number; limit?: number }) =>
    apiFetch<Page<FollowUp>>("/admin/payments/pending-follow-up", { query: { ...q } }),
  updateFollowUp: (id: string, patch: FollowUpPatch) =>
    apiFetch<FollowUp>(`/admin/follow-ups/${encodeURIComponent(id)}`, { method: "PATCH", body: patch }),
  listStaff: () => apiFetch<StaffMember[]>("/admin/staff"),
};
