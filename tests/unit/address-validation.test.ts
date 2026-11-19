import { describe, expect, it } from "vitest";
import { INDIAN_STATES, pinMatchesState } from "@/lib/address";
import { INDIAN_STATES as PICKER_STATES } from "@/lib/constants";
import { candidateRegistrationSchema } from "@/lib/validations";

const valid = {
  fullName: "Hari Kumar",
  email: "hari@example.com",
  contactNumber: "9876543210",
  college: "JNTU Hyderabad",
  place: "Kukatpally",
  city: "Hyderabad",
  state: "Telangana",
  pincode: "500072",
  password: "Str0ng-passw0rd",
  confirmPassword: "Str0ng-passw0rd",
  acceptTerms: true,
};

const errorsFor = (over: Partial<typeof valid>) => {
  const res = candidateRegistrationSchema.safeParse({ ...valid, ...over });
  return res.success ? {} : Object.fromEntries(res.error.issues.map((i) => [i.path.join("."), i.message]));
};

describe("address validation (QA item 4)", () => {
  it("offers all 36 states and union territories in the picker", () => {
    expect(PICKER_STATES).toHaveLength(36);
    expect(PICKER_STATES).toEqual([...INDIAN_STATES]);
    expect(PICKER_STATES).toContain("Lakshadweep");
  });

  it("accepts a valid address, including names with spaces, dots, hyphens, apostrophes or other scripts", () => {
    expect(errorsFor({})).toEqual({});
    expect(errorsFor({ city: "Navi Mumbai", place: "St. Mary's Road-East", state: "Maharashtra", pincode: "400703" })).toEqual({});
    expect(errorsFor({ city: "हैदराबाद" })).toEqual({});
  });

  it("rejects digits and symbols in city and place", () => {
    expect(errorsFor({ city: "Hyderabad 2" }).city).toMatch(/letters only/);
    expect(errorsFor({ city: "@@" }).city).toMatch(/letters only/);
    expect(errorsFor({ place: "12-B" }).place).toMatch(/letters only/);
  });

  it("requires a state from the list", () => {
    expect(errorsFor({ state: "Atlantis" }).state).toMatch(/from the list/);
    expect(errorsFor({ state: "" }).state).toBeDefined();
  });

  it("requires the PIN code to belong to the chosen state", () => {
    expect(errorsFor({ pincode: "411001" }).pincode).toBe("This PIN code does not belong to the selected state");
    expect(errorsFor({ pincode: "012345" }).pincode).toMatch(/6 digit/);
    expect(pinMatchesState("110001", "Delhi (NCT)")).toBe(true);
    expect(pinMatchesState("834001", "Jharkhand")).toBe(true);
  });
});
