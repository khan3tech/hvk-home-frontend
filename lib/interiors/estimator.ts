import type { EstimateInput, InteriorConfig, ItemBasis, RoomInput, Tier } from "./types";

export const FT_PER_METRE = 3.28084;

export type Unit = "ft" | "m";

export const ROOM_LABEL: Record<string, string> = {
  living: "Living room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  dining: "Dining",
  study: "Study",
  pooja: "Pooja room",
  balcony: "Balcony",
  office_cabin: "Office cabin",
  shop_floor: "Shop floor",
  other: "Other space",
};

export const PROPERTY_LABEL: Record<string, string> = {
  apartment: "Apartment",
  villa: "Villa or independent house",
  office: "Office",
  shop: "Shop",
  single_room: "A single room",
};

export const TIER_INFO: Record<Tier, { label: string; text: string }> = {
  essential: { label: "Essential", text: "Durable, budget-friendly materials" },
  premium: { label: "Premium", text: "Better laminates, hardware and fittings" },
  luxe: { label: "Luxe", text: "Top-grade finishes and custom detailing" },
};

/** Typical sizes in feet (length, width, height) offered when a room is added. */
const DEFAULT_SIZE: Record<string, [number, number, number]> = {
  living: [15, 12, 10],
  bedroom: [12, 11, 10],
  kitchen: [10, 8, 10],
  bathroom: [8, 5, 9],
  dining: [10, 9, 10],
  study: [9, 8, 10],
  pooja: [5, 4, 9],
  balcony: [10, 5, 9],
  office_cabin: [12, 10, 10],
  shop_floor: [20, 15, 11],
  other: [10, 10, 10],
};

export interface RoomDraft {
  /** Local key for React lists. */
  key: string;
  name: string;
  type: string;
  length: string;
  width: string;
  height: string;
  /** Chosen items by code; `qty` is text so the field can be edited freely. */
  items: Record<string, { qty: string }>;
}

let counter = 0;
const nextKey = (): string => `room-${(counter += 1)}`;

const round1 = (n: number): string => String(Math.round(n * 10) / 10);

/** A new room with typical dimensions, shown in the chosen unit. */
export function newRoom(type: string, unit: Unit): RoomDraft {
  const [l, w, h] = DEFAULT_SIZE[type] ?? DEFAULT_SIZE.other!;
  const show = (ft: number) => (unit === "m" ? round1(ft / FT_PER_METRE) : String(ft));
  return { key: nextKey(), name: ROOM_LABEL[type] ?? type, type, length: show(l), width: show(w), height: show(h), items: {} };
}

/** Converts the typed dimensions when the unit switch changes, so the room keeps its size. */
export function convertRoom(room: RoomDraft, from: Unit, to: Unit): RoomDraft {
  if (from === to) return room;
  const convert = (value: string): string => {
    const n = Number(value);
    if (!value.trim() || !Number.isFinite(n)) return value;
    return round1(to === "m" ? n / FT_PER_METRE : n * FT_PER_METRE);
  };
  return { ...room, length: convert(room.length), width: convert(room.width), height: convert(room.height) };
}

export const toFt = (value: string, unit: Unit): number => {
  const n = Number(value);
  return unit === "m" ? n * FT_PER_METRE : n;
};

/** Floor area in square feet for the live hint under the dimensions; null while a value is missing. */
export function floorAreaSqft(room: RoomDraft, unit: Unit): number | null {
  const l = toFt(room.length, unit);
  const w = toFt(room.width, unit);
  return room.length.trim() && room.width.trim() && Number.isFinite(l) && Number.isFinite(w) && l > 0 && w > 0 ? Math.round(l * w * 10) / 10 : null;
}

export interface RoomProblems {
  length?: string;
  width?: string;
  height?: string;
}

const LIMITS = { length: [3, 100], width: [3, 100], height: [7, 20] } as const;

/** Problems with the typed dimensions of one room (limits are the API's, in feet). */
export function roomProblems(room: RoomDraft, unit: Unit): RoomProblems {
  const out: RoomProblems = {};
  for (const field of ["length", "width", "height"] as const) {
    const value = room[field];
    const ft = toFt(value, unit);
    const [min, max] = LIMITS[field];
    const label = field[0]!.toUpperCase() + field.slice(1);
    const shown = (ft: number) => (unit === "m" ? `${round1(ft / FT_PER_METRE)} m` : `${ft} ft`);
    if (!value.trim() || !Number.isFinite(ft)) out[field] = `Enter the ${field}`;
    else if (ft < min - 1e-9) out[field] = `${label} must be at least ${shown(min)}`;
    else if (ft > max + 1e-9) out[field] = `${label} can be at most ${shown(max)}`;
  }
  return out;
}

/** The API request for the rooms, or null while anything is invalid or no item is chosen. */
export function toEstimateInput(rooms: RoomDraft[], unit: Unit, tier: Tier, city: string, config: InteriorConfig | null): EstimateInput | null {
  if (rooms.length === 0 || !city) return null;
  const basisOf = new Map<string, ItemBasis>((config?.items ?? []).map((i) => [i.code, i.basis]));
  const apiRooms: RoomInput[] = [];
  for (const room of rooms) {
    if (Object.keys(roomProblems(room, unit)).length > 0) return null;
    apiRooms.push({
      ...(room.name.trim() ? { name: room.name.trim() } : {}),
      type: room.type,
      lengthFt: Math.round(toFt(room.length, unit) * 100) / 100,
      widthFt: Math.round(toFt(room.width, unit) * 100) / 100,
      heightFt: Math.round(toFt(room.height, unit) * 100) / 100,
      items: Object.entries(room.items).map(([code, choice]) => {
        const basis = basisOf.get(code);
        const qty = Number(choice.qty);
        // Area-based items work out their own quantity; the others may carry a typed one.
        return basis && ["running_ft", "sqft_front", "each"].includes(basis) && choice.qty.trim() && Number.isFinite(qty) && qty > 0 ? { code, qty } : { code };
      }),
    });
  }
  if (apiRooms.every((room) => room.items.length === 0)) return null;
  return { tier, city, rooms: apiRooms };
}

/** "Rs 2,35,620" in Indian digit grouping. */
export function formatInr(amount: number): string {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
}

/** "Rs 2.1 lakh" style for the range headline. */
export function formatRange(low: number, high: number): string {
  return `${formatInr(low)} to ${formatInr(high)}`;
}

export const BASIS_HINT: Record<ItemBasis, string> = {
  floor_area: "Worked out from the floor area",
  wall_area: "Worked out from the wall area (less doors and windows)",
  ceiling_area: "Worked out from the ceiling area",
  running_ft: "Running feet. Defaults to the longer wall; change it if needed",
  sqft_front: "Front area in sq ft. Defaults to the longer wall x height",
  each: "Number of pieces",
};
