import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ManualApproval, PendingCandidate } from "@/types/api";
import { API, fail, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav } from "../helpers/navigation";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { Payments, rupeesToMinor } = await import("@/components/admin/payments");

const waiting = (id: string, fullName: string, over: Partial<PendingCandidate> = {}): PendingCandidate => ({
  id,
  fullName,
  email: `${id}@example.com`,
  phone: "+919876543210",
  college: "ABC College",
  city: "Pune",
  step: "demo_pending",
  registeredAt: "2026-11-02T10:00:00.000Z",
  ...over,
});

function serve(opts: { candidates?: PendingCandidate[]; history?: ManualApproval[]; total?: number } = {}) {
  const calls = { queries: [] as string[], approvals: [] as unknown[] };
  let candidates = opts.candidates ?? [waiting("c1", "Asha Verma"), waiting("c2", "Ravi Kumar")];
  let history = opts.history ?? [];
  server.use(
    http.get(`${API}/payments/config`, () => ok({ mode: "manual", feeMinor: 49900, currency: "INR", instructions: "" })),
    http.get(`${API}/admin/payments/pending`, ({ request }) => {
      const url = new URL(request.url);
      calls.queries.push(url.search);
      const q = url.searchParams.get("q")?.toLowerCase();
      const items = q ? candidates.filter((c) => c.fullName.toLowerCase().includes(q)) : candidates;
      return ok({ items, page: Number(url.searchParams.get("page") ?? 1), limit: 20, total: opts.total ?? items.length });
    }),
    http.get(`${API}/admin/payments/manual`, () => ok(history)),
    http.post(`${API}/admin/payments/manual`, async ({ request }) => {
      const body = (await request.json()) as { candidateId: string; method: ManualApproval["method"]; reference?: string; amountMinor?: number };
      calls.approvals.push(body);
      const person = candidates.find((c) => c.id === body.candidateId)!;
      candidates = candidates.filter((c) => c.id !== body.candidateId);
      history = [{ id: "p1", candidateId: person.id, candidateName: person.fullName, amountMinor: body.amountMinor ?? 49900, currency: "INR", method: body.method, reference: body.reference ?? null, note: null, approvedAt: "2026-11-04T08:00:00.000Z", approvedBy: "Tara Nair" }, ...history];
      return ok({ id: "p1", status: "paid", amountMinor: body.amountMinor ?? 49900, currency: "INR", providerOrderId: "manual_x", verifiedAt: "2026-11-04T08:00:00.000Z", createdAt: null }, 201);
    }),
  );
  return calls;
}

beforeEach(() => {
  nav.reset();
  nav.pathname = "/admin/payments";
});

describe("rupeesToMinor", () => {
  it("turns rupees into minor units and rejects anything else", () => {
    expect(rupeesToMinor("499")).toBe(49900);
    expect(rupeesToMinor(" 499.5 ")).toBe(49950);
    expect(rupeesToMinor("0.01")).toBe(1);
    for (const bad of ["", "abc", "0", "-5", "12.345", "1,000", "₹499"]) expect(rupeesToMinor(bad), bad).toBeNull();
  });
});

describe("staff payments page", () => {
  it("lists the candidates waiting for approval", async () => {
    serve();
    render(<Payments />);
    const table = (await screen.findByText("Asha Verma")).closest("table")!;
    expect(within(table).getAllByRole("row")).toHaveLength(3); // header + 2
    expect(within(table).getByText("ravi@example.com".replace("ravi", "c2"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve payment for Asha Verma" })).toBeEnabled();
    expect(screen.getByText("No payments approved yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Payments" })).toHaveAttribute("aria-current", "page"); // its own tab
  });

  it("searches by name, phone or email", async () => {
    const calls = serve();
    const user = userEvent.setup();
    render(<Payments />);
    await screen.findByText("Asha Verma");
    await user.type(screen.getByLabelText("Search by name, phone or email"), "ravi");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(screen.queryByText("Asha Verma")).toBeNull());
    expect(screen.getByText("Ravi Kumar")).toBeInTheDocument();
    expect(calls.queries.at(-1)).toContain("q=ravi");
    await user.clear(screen.getByLabelText("Search by name, phone or email"));
    await user.type(screen.getByLabelText("Search by name, phone or email"), "nobody");
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(await screen.findByText("Nobody waiting matches that search.")).toBeInTheDocument();
  });

  it("approves a payment with how it was paid, then updates both lists", async () => {
    const calls = serve();
    const user = userEvent.setup();
    render(<Payments />);
    await user.click(await screen.findByRole("button", { name: "Approve payment for Asha Verma" }));
    const dialog = screen.getByRole("dialog", { name: "Asha Verma" });
    expect(within(dialog).getByText(/Only approve after the money has arrived/)).toBeInTheDocument();
    expect(within(dialog).getByText(/default ₹499\.00/)).toBeInTheDocument();

    await user.selectOptions(within(dialog).getByLabelText("How was it paid?"), "upi_qr");
    await user.type(within(dialog).getByLabelText(/Receipt or transaction reference/), "UTR 4242");
    await user.click(within(dialog).getByRole("button", { name: "Approve payment" }));

    expect(await screen.findByText(/Approved Asha Verma/)).toBeInTheDocument();
    expect(calls.approvals).toEqual([{ candidateId: "c1", method: "upi_qr", reference: "UTR 4242" }]); // no amount: the fee applies
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(screen.queryByText("Asha Verma", { selector: "span" })).toBeNull()); // gone from the waiting list
    const approved = (await screen.findByRole("heading", { name: "Recently approved" })).closest("section")!;
    expect(within(approved).getByText("Asha Verma")).toBeInTheDocument();
    expect(within(approved).getByText("UPI QR")).toBeInTheDocument();
    expect(within(approved).getByText("UTR 4242")).toBeInTheDocument();
    expect(within(approved).getByText("Tara Nair")).toBeInTheDocument();
  });

  it("sends a different amount in minor units, and rejects a malformed one without calling the API", async () => {
    const calls = serve();
    const user = userEvent.setup();
    render(<Payments />);
    await user.click(await screen.findByRole("button", { name: "Approve payment for Ravi Kumar" }));
    const dialog = screen.getByRole("dialog", { name: "Ravi Kumar" });
    await user.type(within(dialog).getByLabelText(/Amount received in rupees/), "5x");
    await user.click(within(dialog).getByRole("button", { name: "Approve payment" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Enter the amount in rupees");
    expect(calls.approvals).toEqual([]);

    await user.clear(within(dialog).getByLabelText(/Amount received in rupees/));
    await user.type(within(dialog).getByLabelText(/Amount received in rupees/), "300");
    await user.click(within(dialog).getByRole("button", { name: "Approve payment" }));
    await screen.findByText(/Approved Ravi Kumar/);
    expect(calls.approvals).toEqual([{ candidateId: "c2", method: "cash", amountMinor: 30000 }]);
  });

  it("shows the server's message and keeps the dialog open when approval fails", async () => {
    serve();
    server.use(http.post(`${API}/admin/payments/manual`, () => fail(422, "INVALID_STATE")));
    const user = userEvent.setup();
    render(<Payments />);
    await user.click(await screen.findByRole("button", { name: "Approve payment for Asha Verma" }));
    const dialog = screen.getByRole("dialog", { name: "Asha Verma" });
    await user.click(within(dialog).getByRole("button", { name: "Approve payment" }));
    expect(await within(dialog).findByRole("alert")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Approve payment" })).toBeEnabled(); // can try again
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Asha Verma")).toBeInTheDocument();
  });

  it("pages through a long waiting list", async () => {
    const calls = serve({ total: 45 });
    const user = userEvent.setup();
    render(<Payments />);
    await screen.findByText("Asha Verma");
    expect(screen.getByText("45 waiting · page 1 of 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(calls.queries.at(-1)).toContain("page=2"));
  });

  it("says so when nobody is waiting, and when the list cannot be loaded", async () => {
    serve({ candidates: [] });
    const { unmount } = render(<Payments />);
    expect(await screen.findByText("Nobody is waiting for approval.")).toBeInTheDocument();
    unmount();
    server.use(http.get(`${API}/admin/payments/pending`, () => fail(500, "INTERNAL_ERROR")));
    render(<Payments />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
