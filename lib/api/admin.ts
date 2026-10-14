import type { FollowUp, FollowUpStatus, LeadStatus, Page, StaffMember, TaLead } from "@/types/api";
import { apiFetch } from "./client";

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
  getLead: (id: string) => apiFetch<TaLead>(`/admin/ta-leads/${encodeURIComponent(id)}`),
  updateLead: (id: string, patch: LeadPatch) =>
    apiFetch<TaLead>(`/admin/ta-leads/${encodeURIComponent(id)}`, { method: "PATCH", body: patch }),
  listFollowUps: (q: { status?: FollowUpStatus; page?: number; limit?: number }) =>
    apiFetch<Page<FollowUp>>("/admin/payments/pending-follow-up", { query: { ...q } }),
  updateFollowUp: (id: string, patch: FollowUpPatch) =>
    apiFetch<FollowUp>(`/admin/follow-ups/${encodeURIComponent(id)}`, { method: "PATCH", body: patch }),
  listStaff: () => apiFetch<StaffMember[]>("/admin/staff"),
};
