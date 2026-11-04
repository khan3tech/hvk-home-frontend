import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Enquiry } from "@/types/api";
import { API, fail, ok } from "../msw/handlers";
import { server } from "../msw/server";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { TalkToUs } = await import("@/components/tech/tech-contact-modal");
const { Enquiries } = await import("@/components/admin/enquiries");

beforeAll(() => {
  // jsdom has no <dialog> modal support.
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

describe("Talk to us modal", () => {
  async function fill(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: /talk to us/i }));
    await user.type(screen.getByLabelText(/^Email/), "visitor@example.com");
    await user.type(screen.getByLabelText(/Contact number/), "9876543210");
    await user.type(screen.getByLabelText(/Your query/), "Tell me about the Full Stack course please");
  }

  it("validates before sending", async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(
      http.post(`${API}/enquiries`, () => {
        calls += 1;
        return ok({ received: true }, 201);
      }),
    );
    render(<TalkToUs />);
    await user.click(screen.getByRole("button", { name: /talk to us/i }));
    await user.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByText(/email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/valid 10 digit mobile number/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(calls).toBe(0);
  });

  it("sends the enquiry and thanks the visitor", async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    server.use(
      http.post(`${API}/enquiries`, async ({ request }) => {
        bodies.push(await request.json());
        return ok({ received: true }, 201);
      }),
    );
    render(<TalkToUs />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByText("Thank you!")).toBeInTheDocument();
    expect(bodies).toEqual([{ email: "visitor@example.com", phone: "9876543210", message: "Tell me about the Full Stack course please" }]);
  });

  it("tells the visitor when sending fails", async () => {
    const user = userEvent.setup();
    server.use(http.post(`${API}/enquiries`, () => fail(429, "RATE_LIMITED")));
    render(<TalkToUs />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Thank you!")).not.toBeInTheDocument();
  });
});

const enquiry = (id: string, over: Partial<Enquiry> = {}): Enquiry => ({
  id,
  email: `${id}@example.com`,
  phone: "+919876543210",
  message: "Do you run weekend batches?",
  source: "home",
  status: "new",
  createdAt: "2026-11-05T10:00:00.000Z",
  ...over,
});

describe("Staff enquiries", () => {
  it("lists enquiries, filters and updates the status", async () => {
    const user = userEvent.setup();
    const queries: string[] = [];
    const patches: unknown[] = [];
    server.use(
      http.get(`${API}/admin/enquiries`, ({ request }) => {
        queries.push(new URL(request.url).search);
        return ok({ items: [enquiry("e1")], page: 1, limit: 20, total: 1 });
      }),
      http.patch(`${API}/admin/enquiries/e1`, async ({ request }) => {
        patches.push(await request.json());
        return ok(enquiry("e1", { status: "resolved" }));
      }),
    );
    render(<Enquiries />);
    expect(await screen.findByText("Do you run weekend batches?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "e1@example.com" })).toHaveAttribute("href", "mailto:e1@example.com");

    await user.selectOptions(screen.getByLabelText("Status for e1@example.com"), "resolved");
    await waitFor(() => expect(patches).toEqual([{ status: "resolved" }]));

    await user.selectOptions(screen.getByLabelText(/^Show/), "new");
    await waitFor(() => expect(queries.some((q) => q.includes("status=new"))).toBe(true));
  });

  it("says when there is nothing yet", async () => {
    server.use(http.get(`${API}/admin/enquiries`, () => ok({ items: [], page: 1, limit: 20, total: 0 })));
    render(<Enquiries />);
    expect(await screen.findByText("No enquiries yet.")).toBeInTheDocument();
  });
});
