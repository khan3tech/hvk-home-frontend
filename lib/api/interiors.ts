import type { Page } from "@/types/api";
import type {
  ConsultationDetail,
  ConsultationRequest,
  ConsultationRow,
  ConsultationStatus,
  Estimate,
  EstimateInput,
  InteriorConfig,
  InteriorStaff,
  QuoteDetail,
  QuoteRequest,
  QuoteRow,
  QuoteStatus,
  RateCard,
} from "@/lib/interiors/types";
import { apiFetch } from "./client";

const enc = encodeURIComponent;

/** Public side of HVK Interiors: no sign-in. */
export const interiorsApi = {
  config: () => apiFetch<InteriorConfig>("/interiors/config", { auth: false }),
  estimate: (input: EstimateInput, signal?: AbortSignal) =>
    apiFetch<Estimate>("/interiors/estimate", { method: "POST", body: input, auth: false, ...(signal ? { signal } : {}) }),
  requestQuote: (input: QuoteRequest) => apiFetch<{ reference: string; estimate: Estimate }>("/interiors/quotes", { method: "POST", body: input, auth: false }),
  bookConsultation: (input: ConsultationRequest) => apiFetch<{ reference: string }>("/interiors/consultations", { method: "POST", body: input, auth: false }),
};

export interface StaffUpdate<S extends string> {
  status?: S;
  assignedTo?: string | null;
  note?: string;
}

/** Staff side (role interiors or admin). */
export const adminInteriorsApi = {
  rateCard: () => apiFetch<RateCard>("/admin/interiors/rate-card"),
  saveRateCard: (card: Omit<RateCard, "updatedAt">) => apiFetch<RateCard>("/admin/interiors/rate-card", { method: "PUT", body: card }),
  staff: () => apiFetch<InteriorStaff[]>("/admin/interiors/staff"),
  quotes: (q: { status?: QuoteStatus; page?: number; limit?: number }) => apiFetch<Page<QuoteRow>>("/admin/interiors/quotes", { query: { ...q } }),
  quote: (id: string) => apiFetch<QuoteDetail>(`/admin/interiors/quotes/${enc(id)}`),
  updateQuote: (id: string, update: StaffUpdate<QuoteStatus>) => apiFetch<QuoteDetail>(`/admin/interiors/quotes/${enc(id)}`, { method: "PATCH", body: update }),
  consultations: (q: { status?: ConsultationStatus; page?: number; limit?: number }) => apiFetch<Page<ConsultationRow>>("/admin/interiors/consultations", { query: { ...q } }),
  updateConsultation: (id: string, update: StaffUpdate<ConsultationStatus>) => apiFetch<ConsultationDetail>(`/admin/interiors/consultations/${enc(id)}`, { method: "PATCH", body: update }),
};
