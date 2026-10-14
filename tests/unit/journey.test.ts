import { describe, expect, it } from "vitest";
import { homeFor, redirectForStep, STEP_ACTION, STEP_ROUTE } from "@/lib/journey";
import { ONBOARDING_STEPS } from "@/types/api";
import { messageForCode } from "@/lib/api/errors";

describe("journey routing", () => {
  it("maps every onboarding step to a route and an action", () => {
    for (const step of ONBOARDING_STEPS) {
      expect(STEP_ROUTE[step]).toMatch(/^\//);
      expect(STEP_ACTION[step].length).toBeGreaterThan(0);
    }
  });

  it.each([
    ["/exam", "fee_pending", "/payment"],
    ["/payment", "exam_ready", "/exam"],
    ["/onboarding", "fee_pending", "/payment"],
    ["/feedback", "exam_ready", "/exam"],
    ["/result", "fee_pending", "/payment"],
  ] as const)("redirects %s at step %s to %s", (path, step, target) => {
    expect(redirectForStep(path, step)).toBe(target);
  });

  it.each([
    ["/payment", "fee_pending"],
    ["/exam", "exam_in_progress"],
    ["/dashboard", "fee_pending"],
    ["/profile", "exam_ready"],
    ["/result", "completed"],
    ["/thank-you", "completed"],
    ["/result", "feedback_submitted"],
  ] as const)("allows %s at step %s", (path, step) => {
    expect(redirectForStep(path, step)).toBeNull();
  });

  it("sends staff to /admin and candidates to the dashboard, honouring safe `next` paths only", () => {
    expect(homeFor("ta")).toBe("/admin");
    expect(homeFor("admin", "/admin/follow-ups")).toBe("/admin/follow-ups");
    expect(homeFor("ta", "/payment")).toBe("/admin");
    expect(homeFor("candidate")).toBe("/dashboard");
    expect(homeFor("candidate", "/payment")).toBe("/payment");
    expect(homeFor("candidate", "//evil.example")).toBe("/dashboard");
    expect(homeFor("candidate", "https://evil.example")).toBe("/dashboard");
    expect(homeFor("candidate", "/admin")).toBe("/dashboard");
  });

  it("has a message for unknown error codes", () => {
    expect(messageForCode("SOMETHING_NEW")).toBe("Something went wrong. Please try again.");
  });
});
