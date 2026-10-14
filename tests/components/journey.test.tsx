import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { stageStates } from "@/components/portal/journey-stepper";
import { API, fail, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav, renderPortal } from "../helpers/portal";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { Dashboard } = await import("@/components/portal/dashboard");
const { DemoVideo } = await import("@/components/portal/demo-video");

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

describe("Demo video (US4)", () => {
  it("Next is disabled until the video ends, then completes the demo and goes to payment", async () => {
    let called = "";
    server.use(
      http.post(`${API}/onboarding/demo/complete`, () => {
        called = "complete";
        return ok({ step: "fee_pending", demoAction: "completed", nextStep: "exam_ready" });
      }),
    );
    const user = userEvent.setup();
    const { container } = renderPortal(<DemoVideo />, { pathname: "/onboarding", step: "demo_pending" });
    const next = await screen.findByRole("button", { name: /Next/ });
    expect(next).toBeDisabled();
    const video = container.querySelector("video")!;
    expect(video).toHaveAttribute("src", "https://cdn.test/demo.mp4");

    fireEvent.ended(video);
    expect(next).toBeEnabled();
    await user.click(next);
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/payment"));
    expect(called).toBe("complete");
  });

  it("Skip is always available and records a skip", async () => {
    let called = "";
    server.use(
      http.post(`${API}/onboarding/demo/skip`, () => {
        called = "skip";
        return ok({ step: "fee_pending", demoAction: "skipped", nextStep: "exam_ready" });
      }),
    );
    const user = userEvent.setup();
    renderPortal(<DemoVideo />, { pathname: "/onboarding", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: /Skip/ }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/payment"));
    expect(called).toBe("skip");
  });

  it("shows an error and re-enables the buttons when the API fails", async () => {
    server.use(http.post(`${API}/onboarding/demo/skip`, () => fail(500, "INTERNAL_ERROR")));
    const user = userEvent.setup();
    renderPortal(<DemoVideo />, { pathname: "/onboarding", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: /Skip/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong on our side");
    expect(screen.getByRole("button", { name: /Skip/ })).toBeEnabled();
  });
});
