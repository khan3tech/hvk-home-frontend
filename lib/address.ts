import { z } from "zod";

/**
 * Indian address rules shared by registration and profile updates (QA item 4).
 * Mirrors the API"s src/shared/address.ts (keep them in sync); the API is authoritative.
 */

/** States and union territories, as offered in the website"s state picker. */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi (NCT)",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

/**
 * First two digits of the PIN codes used in each state (India Post circles). Deliberately generous where
 * circles overlap (e.g. Bihar/Jharkhand, Puducherry"s enclaves) so no real PIN code is rejected.
 */
export const STATE_PIN_PREFIXES: Record<(typeof INDIAN_STATES)[number], readonly string[]> = {
  "Andhra Pradesh": ["50", "51", "52", "53"],
  "Arunachal Pradesh": ["79"],
  Assam: ["78"],
  Bihar: ["80", "81", "82", "83", "84", "85"],
  Chhattisgarh: ["46", "49"],
  Goa: ["40"],
  Gujarat: ["36", "37", "38", "39"],
  Haryana: ["12", "13"],
  "Himachal Pradesh": ["17"],
  Jharkhand: ["80", "81", "82", "83", "84", "85"],
  Karnataka: ["56", "57", "58", "59"],
  Kerala: ["67", "68", "69"],
  "Madhya Pradesh": ["45", "46", "47", "48"],
  Maharashtra: ["40", "41", "42", "43", "44"],
  Manipur: ["79"],
  Meghalaya: ["79"],
  Mizoram: ["79"],
  Nagaland: ["79"],
  Odisha: ["75", "76", "77"],
  Punjab: ["14", "15", "16"],
  Rajasthan: ["30", "31", "32", "33", "34"],
  Sikkim: ["73"],
  "Tamil Nadu": ["60", "61", "62", "63", "64"],
  Telangana: ["50"],
  Tripura: ["79"],
  "Uttar Pradesh": ["20", "21", "22", "23", "24", "25", "26", "27", "28"],
  Uttarakhand: ["24", "26"],
  "West Bengal": ["70", "71", "72", "73", "74"],
  "Andaman and Nicobar Islands": ["74"],
  Chandigarh: ["14", "16"],
  "Dadra and Nagar Haveli and Daman and Diu": ["36", "39"],
  "Delhi (NCT)": ["11"],
  "Jammu and Kashmir": ["18", "19"],
  Ladakh: ["19"],
  Lakshadweep: ["68"],
  Puducherry: ["53", "60", "67"],
};

export const PLACE_NAME_PATTERN = /^(?=(?:.*\p{L}){2})[\p{L}\p{M} .'-]+$/u;
export const PLACE_NAME_MESSAGE = "Use letters only (spaces, dots, hyphens and apostrophes are fine)";
export const PIN_STATE_MESSAGE = "This PIN code does not belong to the selected state";

export const isIndianState = (value: string): value is (typeof INDIAN_STATES)[number] => (INDIAN_STATES as readonly string[]).includes(value);

/** True when the PIN code"s first two digits belong to the state (unknown states never match). */
export function pinMatchesState(pincode: string, state: string): boolean {
  return isIndianState(state) && STATE_PIN_PREFIXES[state].includes(pincode.slice(0, 2));
}


/** Form rules for city, place, state and PIN code (QA item 4), used by Join Us and My profile. */
export const placeName = (label: string) =>
  z.string().trim().min(2, `Please enter your ${label}`).max(100, `${label[0]!.toUpperCase()}${label.slice(1)} is too long`).regex(PLACE_NAME_PATTERN, PLACE_NAME_MESSAGE);
export const stateField = z.string().trim().refine((v): boolean => isIndianState(v), "Please select your state from the list");
export const pincodeField = z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6 digit pincode");
/** Cross-field check: the PIN code must belong to the chosen state (skipped until both look valid). */
export const pinStateRefine = (v: { state: string; pincode: string }): boolean =>
  !isIndianState(v.state) || !/^[1-9]\d{5}$/.test(v.pincode) || pinMatchesState(v.pincode, v.state);
export const pinStateIssue: { path: string[]; message: string } = { path: ["pincode"], message: PIN_STATE_MESSAGE };
