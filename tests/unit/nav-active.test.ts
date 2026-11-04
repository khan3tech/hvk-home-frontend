import { describe, expect, it } from "vitest";
import { activeNav } from "@/lib/nav-active";

describe("activeNav", () => {
  it("highlights Services on every service page", () => {
    for (const path of ["/services/training-certification", "/services/custom-solutions", "/services"]) {
      expect(activeNav(path, null), path).toEqual({ label: "Services", kind: "page" });
    }
  });

  it("highlights Home on the registration page, or the section that is in view", () => {
    expect(activeNav("/registration", null)).toEqual({ label: "Home", kind: "page" });
    expect(activeNav("/registration", "services")).toEqual({ label: "Services", kind: "location" });
    expect(activeNav("/registration", "testimonials")).toEqual({ label: "Testimonials", kind: "location" });
    expect(activeNav("/registration", "something-else")).toEqual({ label: "Home", kind: "page" });
  });

  it("highlights nothing on other pages", () => {
    for (const path of ["/dashboard", "/login", "/payment", "/admin/leads", "/servicesx"]) expect(activeNav(path, "services"), path).toBeNull();
  });
});
