import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { stageStates } from "@/components/portal/journey-stepper";
import { nav, renderPortal } from "../helpers/portal";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { Dashboard } = await import("@/components/portal/dashboard");

beforeEach(() => nav.reset());

describe("Dashboard (US3)", () => {
  it.each([
    ["demo_pending", "Watch demo", "/onboarding"],
    ["fee_pending", "Pay registration fee", "/payment"],
    ["exam_ready", "Go to exam", "/exam"],
    ["exam_in_progress", "Go to exam", "/exam"],
    ["exam_completed", "Give feedback", "/feedback"],
    ["feedback_submitted", "View result status", "/thank-you"],
    ["completed", "View result", "/result"],
  ] as const)("at %s the primary action is “%s”", async (step, label, href) => {
    renderPortal(<Dashboard />, { pathname: "/dashboard", step });
    const link = await screen.findByRole("link", { name: new RegExp(label) });
    expect(link).toHaveAttribute("href", href);
    expect(screen.getByRole("heading", { name: "Welcome, Asha" })).toBeInTheDocument();
  });

  it("marks completed, current and upcoming stages", async () => {
    expect(stageStates("fee_pending")).toEqual(["done", "done", "current", "upcoming", "upcoming", "upcoming"]);
    expect(stageStates("completed")).toEqual(["done", "done", "done", "done", "done", "done"]);
    renderPortal(<Dashboard />, { pathname: "/dashboard", step: "exam_ready" });
    const current = await screen.findByText("Exam", { selector: "span" });
    expect(current.closest("li")).toHaveAttribute("aria-current", "step");
  });
});

describe("PortalGate after a step change (regression)", () => {
  it("does not bounce back using the previous page's step after navigating", async () => {
    const { rerender, statusCalls } = renderPortal(<p>page</p>, { pathname: "/onboarding", step: "demo_pending" });
    await screen.findByText("page");

    // Candidate skipped the demo: the API is now at fee_pending and the app navigates to /payment.
    statusCalls.step = "fee_pending";
    nav.pathname = "/payment";
    rerender(<p>page</p>);

    await screen.findByText("page");
    expect(nav.replace).not.toHaveBeenCalledWith("/onboarding");
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
