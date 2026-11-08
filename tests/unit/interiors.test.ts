import { describe, expect, it } from "vitest";
import { canUseAdminPath, homeFor, isStaff, staffHome } from "@/lib/journey";
import { FT_PER_METRE, convertRoom, floorAreaSqft, formatInr, newRoom, roomProblems, toEstimateInput, type RoomDraft } from "@/lib/interiors/estimator";
import type { InteriorConfig } from "@/lib/interiors/types";
import { tabsFor } from "@/components/admin/admin-shell";
import { slugify } from "@/components/admin/interiors/interior-rate-card";
import { istDate } from "@/components/interiors/consultation-form";

const config: InteriorConfig = {
  services: [],
  propertyTypes: ["apartment"],
  roomTypes: ["living"],
  tiers: ["essential", "premium", "luxe"],
  cities: ["Hyderabad"],
  items: [
    { code: "flooring", label: "Flooring", category: "Civil", basis: "floor_area", unit: "sq ft", rooms: ["living"] },
    { code: "modular-kitchen", label: "Modular kitchen", category: "Carpentry", basis: "running_ft", unit: "running ft", rooms: ["kitchen"] },
    { code: "tv-unit", label: "TV unit", category: "Carpentry", basis: "each", unit: "each", rooms: ["living"] },
  ],
  rangePercent: 10,
  gstPercent: 18,
  disclaimer: "Estimate only.",
};

const room = (over: Partial<RoomDraft> = {}): RoomDraft => ({ key: "r1", name: "Living room", type: "living", length: "15", width: "12", height: "10", items: {}, ...over });

describe("room dimensions", () => {
  it("offers typical sizes in the chosen unit and converts between units", () => {
    expect(newRoom("living", "ft")).toMatchObject({ length: "15", width: "12", height: "10", name: "Living room" });
    expect(newRoom("living", "m")).toMatchObject({ length: "4.6", width: "3.7", height: "3" });
    const metric = convertRoom(room(), "ft", "m");
    expect([metric.length, metric.width, metric.height]).toEqual(["4.6", "3.7", "3"]);
    expect(convertRoom(room({ length: "" }), "ft", "m").length).toBe(""); // empty stays empty
    expect(convertRoom(room(), "ft", "ft")).toEqual(room());
    expect(FT_PER_METRE).toBeCloseTo(3.28084);
  });

  it("works out the floor area for the live hint", () => {
    expect(floorAreaSqft(room(), "ft")).toBe(180);
    expect(floorAreaSqft(room({ length: "4.5", width: "3.5" }), "m")).toBe(169.5);
    expect(floorAreaSqft(room({ width: "" }), "ft")).toBeNull();
  });

  it("checks the limits the API enforces, in the unit the visitor uses", () => {
    expect(roomProblems(room(), "ft")).toEqual({});
    expect(roomProblems(room({ length: "2", height: "30" }), "ft")).toEqual({ length: "Length must be at least 3 ft", height: "Height can be at most 20 ft" });
    expect(roomProblems(room({ width: "" }), "ft")).toEqual({ width: "Enter the width" });
    expect(roomProblems(room({ length: "0.5" }), "m").length).toBe("Length must be at least 0.9 m");
  });
});

describe("estimate request", () => {
  it("is built from valid rooms with at least one item, converting to feet", () => {
    const r = room({ items: { flooring: { qty: "" }, "tv-unit": { qty: "2" } } });
    expect(toEstimateInput([r], "ft", "premium", "Hyderabad", config)).toEqual({
      tier: "premium",
      city: "Hyderabad",
      rooms: [{ name: "Living room", type: "living", lengthFt: 15, widthFt: 12, heightFt: 10, items: [{ code: "flooring" }, { code: "tv-unit", qty: 2 }] }],
    });
    const metric = toEstimateInput([room({ length: "4.6", width: "3.7", height: "3", items: { flooring: { qty: "" } } })], "m", "essential", "Hyderabad", config);
    expect(metric?.rooms[0]).toMatchObject({ lengthFt: 15.09, widthFt: 12.14, heightFt: 9.84 });
  });

  it("ignores a typed quantity on area-based items and a bad quantity elsewhere", () => {
    const r = room({ items: { flooring: { qty: "999" }, "tv-unit": { qty: "abc" } } });
    expect(toEstimateInput([r], "ft", "essential", "Hyderabad", config)?.rooms[0]?.items).toEqual([{ code: "flooring" }, { code: "tv-unit" }]);
  });

  it("is null until there is something to estimate", () => {
    expect(toEstimateInput([], "ft", "essential", "Hyderabad", config)).toBeNull();
    expect(toEstimateInput([room()], "ft", "essential", "Hyderabad", config)).toBeNull(); // no item chosen
    expect(toEstimateInput([room({ length: "1", items: { flooring: { qty: "" } } })], "ft", "essential", "Hyderabad", config)).toBeNull(); // invalid size
    expect(toEstimateInput([room({ items: { flooring: { qty: "" } } })], "ft", "essential", "", config)).toBeNull(); // no city
  });
});

describe("small helpers", () => {
  it("formats rupees with Indian digit grouping", () => {
    expect(formatInr(235620)).toBe("₹2,35,620");
    expect(formatInr(0)).toBe("₹0");
  });

  it("turns an item name into its code", () => {
    expect(slugify("  Wall paneling (premium)! ")).toBe("wall-paneling-premium");
    expect(slugify("!!!")).toBe("");
  });

  it("works out dates in India", () => {
    const now = Date.UTC(2026, 10, 8, 20, 0, 0); // 8 Nov 2026 20:00 UTC = 9 Nov 01:30 IST
    expect(istDate(0, now)).toBe("2026-11-09");
    expect(istDate(90, now)).toBe("2027-02-07");
  });
});

describe("staff roles", () => {
  it("knows who is staff and where each role starts", () => {
    expect(["ta", "admin", "interiors"].every((r) => isStaff(r as never))).toBe(true);
    expect(isStaff("candidate")).toBe(false);
    expect(staffHome("interiors")).toBe("/admin/interiors");
    expect(staffHome("ta")).toBe("/admin");
    expect(homeFor("interiors")).toBe("/admin/interiors");
    expect(homeFor("interiors", "/admin/leads")).toBe("/admin/interiors"); // not theirs: starts at their own page
    expect(homeFor("interiors", "/admin/interiors/rate-card")).toBe("/admin/interiors/rate-card");
    expect(homeFor("ta", "/admin/payments")).toBe("/admin/payments");
    expect(homeFor("ta", "/admin/interiors")).toBe("/admin");
  });

  it("limits each role to its own screens", () => {
    expect(canUseAdminPath("interiors", "/admin/interiors")).toBe(true);
    expect(canUseAdminPath("interiors", "/admin/interiors/consultations")).toBe(true);
    expect(canUseAdminPath("interiors", "/admin/leads")).toBe(false);
    expect(canUseAdminPath("ta", "/admin/leads")).toBe(true);
    expect(canUseAdminPath("ta", "/admin/interiors")).toBe(false);
    expect(canUseAdminPath("admin", "/admin/interiors")).toBe(true);
    expect(canUseAdminPath("admin", "/admin/leads")).toBe(true);
    expect(canUseAdminPath("candidate", "/admin/leads")).toBe(false);
  });

  it("shows each role its own tabs", () => {
    expect(tabsFor("interiors").map((t) => t.label)).toEqual(["Interiors quotes", "Consultations", "Rate card"]);
    expect(tabsFor("ta").map((t) => t.label)).not.toContain("Rate card");
    expect(tabsFor("admin").map((t) => t.label)).toEqual(expect.arrayContaining(["Leads", "Enquiries", "Interiors quotes", "Rate card"]));
  });
});
