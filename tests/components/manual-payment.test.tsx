import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { API, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav, renderPortal } from "../helpers/portal";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { ManualPayment, PaymentSwitch } = await import("@/components/portal/manual-payment");
const { Dashboard } = await import("@/components/portal/dashboard");

const MANUAL = { mode: "manual", feeMinor: 49900, currency: "INR", instructions: "Pay at the HVK office.\nScan the QR at the desk." } as const;
const manual = (over: Record<string, unknown> = {}) => server.use(http.get(`${API}/payments/config`, () => ok({ ...MANUAL, ...over })));

beforeEach(() => {
  nav.reset();
  window.history.replaceState(null, "", "/payment"); // the portal compares the real address with the page it loaded the step for
});

describe("PaymentSwitch", () => {
  it("shows how to pay and that approval is pending when payment is manual", async () => {
    manual();
    renderPortal(<PaymentSwitch online={<p>online payment</p>} />, { pathname: "/payment", step: "fee_pending" });
    expect(await screen.findByRole("heading", { name: "Waiting for payment approval" })).toBeInTheDocument();
    expect(screen.getByText("₹499.00")).toBeInTheDocument();
    const how = screen.getByRole("heading", { name: "How to pay" }).closest("section")!;
    expect(how).toHaveTextContent("Pay at the HVK office.");
    expect(how).toHaveTextContent("Scan the QR at the desk.");
    expect(screen.queryByText("online payment")).toBeNull(); // the online step is hidden
    expect(screen.getByRole("button", { name: "Check approval status" })).toBeEnabled();
  });

  it("falls back to a neutral line when no instructions are configured", async () => {
    manual({ instructions: "" });
    renderPortal(<PaymentSwitch online={<p>online payment</p>} />, { pathname: "/payment", step: "fee_pending" });
    expect(await screen.findByText(/contact the HVK team/)).toBeInTheDocument();
  });

  it("shows the online step when payment is online", async () => {
    renderPortal(<PaymentSwitch online={<p>online payment</p>} />, { pathname: "/payment", step: "fee_pending" });
    expect(await screen.findByText("online payment")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Waiting for payment approval" })).toBeNull();
  });

  it("behaves as online payment when the configuration cannot be loaded (older API)", async () => {
    server.use(http.get(`${API}/payments/config`, () => new Response("{}", { status: 404 })));
    renderPortal(<PaymentSwitch online={<p>online payment</p>} />, { pathname: "/payment", step: "fee_pending" });
    expect(await screen.findByText("online payment")).toBeInTheDocument();
  });

  it("does not show the payment instructions at the first step: the candidate goes to the courses", async () => {
    manual();
    renderPortal(<PaymentSwitch online={<p>videos</p>} />, { pathname: "/onboarding", step: "demo_pending" });
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/learning"));
    expect(screen.queryByRole("heading", { name: "Waiting for payment approval" })).toBeNull();
  });
});

describe("waiting for approval", () => {
  it("says so when a manual check finds the payment still unapproved", async () => {
    manual();
    const user = userEvent.setup();
    const { statusCalls } = renderPortal(<PaymentSwitch online={<p>online</p>} />, { pathname: "/payment", step: "fee_pending" });
    await user.click(await screen.findByRole("button", { name: "Check approval status" }));
    expect(await screen.findByText(/Not approved yet/)).toBeInTheDocument();
    expect(statusCalls.count).toBeGreaterThanOrEqual(2); // the portal's own load plus the check
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("moves the candidate on once staff approved the payment", async () => {
    manual();
    const user = userEvent.setup();
    const { statusCalls } = renderPortal(<PaymentSwitch online={<p>online</p>} />, { pathname: "/payment", step: "fee_pending" });
    const check = await screen.findByRole("button", { name: "Check approval status" });
    statusCalls.step = "exam_ready"; // staff approved in the meantime
    await user.click(check);
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/exam"));
  });

  it("checks quietly in the background", async () => {
    const { statusCalls } = renderPortal(<ManualPayment config={MANUAL} pollMs={30} />, { pathname: "/payment", step: "fee_pending" });
    await waitFor(() => expect(statusCalls.count).toBeGreaterThanOrEqual(3));
  });
});

describe("dashboard while staff approve payments", () => {
  it("starts a candidate with the free videos: no payment status or amount on the dashboard", async () => {
    manual();
    renderPortal(<Dashboard />, { pathname: "/dashboard", step: "demo_pending" });
    const link = await screen.findByRole("link", { name: /Watch free videos/ });
    expect(link).toHaveAttribute("href", "/learning");
    expect(screen.getByRole("heading", { name: "Start with the free videos" })).toBeInTheDocument();
    expect(screen.queryByText(/Waiting for payment approval/)).toBeNull();
    expect(screen.queryByRole("link", { name: /View payment status/ })).toBeNull();
    expect(document.body.textContent).not.toMatch(/₹/);
    const stages = screen.getByRole("list", { name: "Your progress" });
    const labels = within(stages).getAllByRole("listitem").map((li) => (li.textContent ?? "").replace(/^\d+/, "").replace(/\s*\(.*\)\s*$/, "").trim());
    expect(labels).toEqual(["Registered", "Payment approval", "Exam", "Feedback", "Result"]);
    expect(screen.queryByRole("link", { name: /Course videos/ })).toBeNull();
  });

  it("offers the course videos once the payment is approved", async () => {
    manual();
    renderPortal(<Dashboard />, { pathname: "/dashboard", step: "exam_ready" });
    expect(await screen.findByRole("link", { name: /Go to exam/ })).toHaveAttribute("href", "/exam");
    expect(await screen.findByRole("link", { name: /Course videos/ })).toHaveAttribute("href", "/learning");
  });

  it("keeps the usual wording when payment is online", async () => {
    renderPortal(<Dashboard />, { pathname: "/dashboard", step: "fee_pending" });
    expect(await screen.findByRole("link", { name: /Pay registration fee/ })).toBeInTheDocument();
    const stages = screen.getByRole("list", { name: "Your progress" });
    expect(within(stages).getAllByRole("listitem")).toHaveLength(6); // the online journey still has its separate Demo stage
    expect(within(stages).getByText(/^Demo/)).toBeInTheDocument();
  });
});
