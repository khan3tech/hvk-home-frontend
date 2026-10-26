import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FollowUp, TaLead } from "@/types/api";
import { FOLLOW_UP_TRANSITIONS, LEAD_TRANSITIONS } from "@/lib/ta";
import { API, fail, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav, renderPortal } from "../helpers/portal";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { LeadsList } = await import("@/components/admin/leads-list");
const { LeadDetail } = await import("@/components/admin/lead-detail");
const { FollowUps } = await import("@/components/admin/follow-ups");

const ME = "6729f0c2a1b2c3d4e5f60718"; // staff id from authResult()
const summary = {
  id: "c1",
  fullName: "Ravi Kumar",
  email: "ravi@example.com",
  phone: "+919812345678",
  city: "Nagpur",
  state: "Maharashtra",
  college: "XYZ University",
  place: "Sitabuldi",
  onboardingStep: "fee_pending" as const,
};
const lead = (overrides: Partial<TaLead> = {}): TaLead => ({
  id: "lead-1",
  candidate: summary,
  status: "new",
  assignedTo: null,
  lastContactAt: null,
  nextActionAt: null,
  notes: [],
  createdAt: "2026-10-14T05:00:00Z",
  ...overrides,
});
const staff = [
  { id: ME, fullName: "Asha Verma", role: "ta" },
  { id: "staff-2", fullName: "Neha TA", role: "ta" },
];

beforeEach(() => nav.reset());

describe("transition tables mirror the backend", () => {
  it("lead and follow-up transitions", () => {
    expect(LEAD_TRANSITIONS.new).toEqual(["queued", "assigned", "closed"]);
    expect(LEAD_TRANSITIONS.contacted).toEqual(["in_progress", "resolved", "closed"]);
    expect(LEAD_TRANSITIONS.closed).toEqual([]);
    expect(FOLLOW_UP_TRANSITIONS.open).toEqual(["in_progress", "done", "cancelled"]);
    expect(FOLLOW_UP_TRANSITIONS.done).toEqual([]);
  });
});

describe("Leads list (US8)", () => {
  it("passes URL filters to the API and shows candidate rows", async () => {
    nav.search = new URLSearchParams({ status: "new", page: "2" });
    let url = "";
    server.use(
      http.get(`${API}/admin/ta-leads`, ({ request }) => {
        url = request.url;
        return ok({ items: [lead()], page: 2, limit: 20, total: 21 });
      }),
    );
    renderPortal(<LeadsList />, { pathname: "/admin/leads", step: "completed", role: "ta", area: "admin" });
    const row = (await screen.findByRole("link", { name: "Ravi Kumar" })).closest("tr")!;
    expect(row).toHaveTextContent("Nagpur");
    expect(row).toHaveTextContent("Fee pending");
    expect(row).toHaveTextContent("New");
    expect(Object.fromEntries(new URL(url).searchParams)).toEqual({ status: "new", page: "2", limit: "20" });
    expect(screen.getByText(/21 leads · page 2 of 2/)).toBeInTheDocument();
  });

  it("changing a filter updates the URL and resets the page", async () => {
    nav.search = new URLSearchParams({ page: "3" });
    server.use(http.get(`${API}/admin/ta-leads`, () => ok({ items: [], page: 3, limit: 20, total: 0 })));
    const user = userEvent.setup();
    renderPortal(<LeadsList />, { pathname: "/admin/leads", step: "completed", role: "ta", area: "admin" });
    await screen.findByText("No leads match these filters.");
    await user.selectOptions(screen.getByLabelText("Status"), "assigned");
    expect(nav.replace).toHaveBeenLastCalledWith("/admin/leads?status=assigned");
  });
});

describe("Lead detail (US8)", () => {
  function setup(initial = lead()) {
    let patch: unknown = null;
    let current = initial;
    server.use(
      http.get(`${API}/admin/ta-leads/lead-1`, () => ok(current)),
      http.get(`${API}/admin/staff`, () => ok(staff)),
      http.patch(`${API}/admin/ta-leads/lead-1`, async ({ request }) => {
        patch = await request.json();
        current = { ...current, ...(patch as Partial<TaLead>) };
        return ok(current);
      }),
    );
    renderPortal(<LeadDetail id="lead-1" />, { pathname: "/admin/leads/lead-1", step: "completed", role: "ta", area: "admin" });
    return { patch: () => patch };
  }

  it("shows candidate details including college and place", async () => {
    setup();
    expect(await screen.findByText("XYZ University")).toBeInTheDocument();
    expect(screen.getByText("Sitabuldi")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+919812345678" })).toHaveAttribute("href", "tel:+919812345678");
  });

  it("offers only allowed status transitions", async () => {
    setup();
    const select = await screen.findByLabelText("Status");
    expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual(["New", "Queued", "Assigned", "Closed"]);
  });

  it("saves changed fields and a note", async () => {
    const s = setup();
    const user = userEvent.setup();
    await user.selectOptions(await screen.findByLabelText("Status"), "assigned");
    await user.selectOptions(screen.getByLabelText("Assigned to"), "staff-2");
    await user.type(screen.getByLabelText("Add a note"), "Called, will pay tomorrow");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Lead updated.")).toBeInTheDocument();
    expect(s.patch()).toEqual({ status: "assigned", assignedTo: "staff-2", note: "Called, will pay tomorrow" });
  });

  it("assign to me in one click", async () => {
    const s = setup();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Assign to me" }));
    await waitFor(() => expect(s.patch()).toEqual({ assignedTo: ME }));
    expect(screen.queryByRole("button", { name: "Assign to me" })).not.toBeInTheDocument();
  });

  it("reloads and explains when someone else changed the lead", async () => {
    let gets = 0;
    server.use(
      http.get(`${API}/admin/ta-leads/lead-1`, () => {
        gets += 1;
        return ok(gets === 1 ? lead() : lead({ status: "assigned", assignedTo: "staff-2" }));
      }),
      http.get(`${API}/admin/staff`, () => ok(staff)),
      http.patch(`${API}/admin/ta-leads/lead-1`, () => fail(422, "INVALID_STATE")),
    );
    const user = userEvent.setup();
    renderPortal(<LeadDetail id="lead-1" />, { pathname: "/admin/leads/lead-1", step: "completed", role: "ta", area: "admin" });
    await user.selectOptions(await screen.findByLabelText("Status"), "queued");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("updated by someone else");
    expect(screen.getByLabelText("Assigned to")).toHaveValue("staff-2");
  });

  it("closed leads cannot change status", async () => {
    setup(lead({ status: "closed" }));
    expect(await screen.findByLabelText("Status")).toBeDisabled();
  });

  it("sends a paid candidate a new 24-hour exam link", async () => {
    let reissued = false;
    server.use(
      http.post(`${API}/admin/exams/candidates/c1/reissue-link`, () => {
        reissued = true;
        return ok({ attemptId: "att-1", status: "link_issued", examUrl: "https://x.test/exam/invite/t", completedAt: null, mode: "managed", linkStatus: "active", linkExpiresAt: "2026-10-22T09:30:00Z" });
      }),
    );
    setup(lead({ candidate: { ...summary, onboardingStep: "exam_ready" } }));
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Send a new exam link" }));
    expect(await screen.findByText(/New exam link emailed/)).toBeInTheDocument();
    expect(reissued).toBe(true);
  });

  it("offers a new exam link only to paid candidates who have not started", async () => {
    setup();
    await screen.findByText("XYZ University");
    expect(screen.queryByRole("button", { name: "Send a new exam link" })).not.toBeInTheDocument();
  });
});

describe("Follow-ups (US8)", () => {
  it("marks an open follow-up done with an outcome", async () => {
    const fu: FollowUp = {
      id: "fu-1",
      type: "unpaid_payment",
      candidate: summary,
      dueAt: "2026-10-15T05:00:00Z",
      status: "open",
      assignedTo: null,
      completedAt: null,
      outcome: null,
    };
    let patch: unknown = null;
    let listed = 0;
    server.use(
      http.get(`${API}/admin/payments/pending-follow-up`, ({ request }) => {
        listed += 1;
        const status = new URL(request.url).searchParams.get("status");
        return ok({ items: status === "open" && !patch ? [fu] : [], page: 1, limit: 50, total: 0 });
      }),
      http.patch(`${API}/admin/follow-ups/fu-1`, async ({ request }) => {
        patch = await request.json();
        return ok({ ...fu, status: "done" });
      }),
    );
    const user = userEvent.setup();
    renderPortal(<FollowUps />, { pathname: "/admin/follow-ups", step: "completed", role: "ta", area: "admin" });
    expect(await screen.findByText("Ravi Kumar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark done" }));
    await user.type(screen.getByLabelText("Outcome"), "Will pay today");
    await user.click(screen.getByRole("button", { name: "Save outcome" }));
    await waitFor(() => expect(screen.getByText("Nothing here.")).toBeInTheDocument());
    expect(patch).toEqual({ status: "done", outcome: "Will pay today" });
    expect(listed).toBe(2);
  });

  it("Start assigns the follow-up to me", async () => {
    const fu: FollowUp = {
      id: "fu-1",
      type: "unpaid_payment",
      candidate: summary,
      dueAt: "2026-10-15T05:00:00Z",
      status: "open",
      assignedTo: null,
      completedAt: null,
      outcome: null,
    };
    let patch: unknown = null;
    server.use(
      http.get(`${API}/admin/payments/pending-follow-up`, () => ok({ items: [fu], page: 1, limit: 50, total: 1 })),
      http.patch(`${API}/admin/follow-ups/fu-1`, async ({ request }) => {
        patch = await request.json();
        return ok({ ...fu, status: "in_progress" });
      }),
    );
    const user = userEvent.setup();
    renderPortal(<FollowUps />, { pathname: "/admin/follow-ups", step: "completed", role: "ta", area: "admin" });
    await user.click(await screen.findByRole("button", { name: "Start" }));
    await waitFor(() => expect(patch).toEqual({ status: "in_progress", assignedTo: ME }));
  });
});
