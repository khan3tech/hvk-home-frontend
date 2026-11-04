import type { Enquiry, EnquiryStatus, Page } from "@/types/api";
import { apiFetch } from "./client";

export interface EnquiryInput {
  email: string;
  phone: string;
  message: string;
  /** Honeypot: stays empty for people. */
  website?: string;
}

export const enquiriesApi = {
  /** Public "Talk to us" form (no sign-in). */
  send: (input: EnquiryInput) => apiFetch<{ received: true }>("/enquiries", { method: "POST", body: input, auth: false }),
};

/** Staff endpoints (role ta or admin). */
export const adminEnquiriesApi = {
  list: (q: { status?: EnquiryStatus; page?: number; limit?: number }) => apiFetch<Page<Enquiry>>("/admin/enquiries", { query: { ...q } }),
  setStatus: (id: string, status: EnquiryStatus) => apiFetch<Enquiry>(`/admin/enquiries/${id}`, { method: "PATCH", body: { status } }),
};
