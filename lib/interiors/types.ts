/** HVK Interiors: shapes returned by the API (spec 008). */

export type Tier = "essential" | "premium" | "luxe";

export interface InteriorConfig {
  services: { code: string; title: string }[];
  propertyTypes: string[];
  roomTypes: string[];
  tiers: Tier[];
  cities: string[];
  items: { code: string; label: string; category: string; basis: ItemBasis; unit: string; rooms: string[] }[];
  rangePercent: number;
  gstPercent: number;
  disclaimer: string;
}

export type ItemBasis = "floor_area" | "wall_area" | "ceiling_area" | "running_ft" | "sqft_front" | "each";

export interface RoomInput {
  name?: string;
  type: string;
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  items: { code: string; qty?: number }[];
}

export interface EstimateInput {
  tier: Tier;
  city: string;
  rooms: RoomInput[];
}

export interface EstimateLine {
  code: string;
  label: string;
  basis: ItemBasis;
  unit: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface Estimate {
  currency: "INR";
  tier: Tier;
  city: string;
  cityFactor: number;
  rooms: { name: string; type: string; floorAreaSqft: number; wallAreaSqft: number; lines: EstimateLine[]; subtotal: number }[];
  subtotal: number;
  total: number;
  low: number;
  high: number;
  gstPercent: number;
  gstAmount: number;
  totalWithGst: number;
  disclaimer: string;
}

export interface QuoteRequest extends EstimateInput {
  name: string;
  phone: string;
  email: string;
  propertyType: string;
  notes?: string;
  /** Honeypot: stays empty for people. */
  website?: string;
}

export interface ConsultationRequest {
  name: string;
  phone: string;
  email: string;
  city?: string;
  service: string;
  preferredDate: string;
  slot: "morning" | "afternoon" | "evening";
  message?: string;
  website?: string;
}

// ---- staff ----

export const QUOTE_STATUSES = ["new", "contacted", "site_visit", "quote_sent", "won", "lost"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export const CONSULTATION_STATUSES = ["new", "contacted", "scheduled", "done", "cancelled"] as const;
export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

export interface QuoteRow {
  id: string;
  reference: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  propertyType: string;
  tier: Tier;
  total: number;
  status: QuoteStatus;
  assignedTo: string | null;
  createdAt: string | null;
}

export interface StaffNote {
  by: string;
  text: string;
  at: string | null;
}

export interface QuoteDetail extends QuoteRow {
  notes: string;
  input: { rooms: RoomInput[] };
  result: Estimate;
  staffNotes: StaffNote[];
}

export interface ConsultationRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  service: string;
  preferredDate: string;
  slot: "morning" | "afternoon" | "evening";
  message: string;
  status: ConsultationStatus;
  assignedTo: string | null;
  createdAt: string | null;
}

export interface ConsultationDetail extends ConsultationRow {
  staffNotes: StaffNote[];
}

export interface RateItem {
  code: string;
  label: string;
  category: string;
  basis: ItemBasis;
  rates: Record<Tier, number>;
  rooms: string[];
  active: boolean;
}

export interface RateCard {
  items: RateItem[];
  cities: { name: string; factor: number }[];
  rangePercent: number;
  gstPercent: number;
  disclaimer: string;
  updatedAt: string | null;
}

export interface InteriorStaff {
  id: string;
  fullName: string;
  role: string;
}
