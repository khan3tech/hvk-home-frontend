import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Page } from "@/types/api";
import type { ConsultationRow, Estimate, InteriorConfig, InteriorStaff, QuoteDetail, QuoteRow, RateCard } from "@/lib/interiors/types";
import { API, fail, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav } from "../helpers/navigation";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { Estimator } = await import("@/components/interiors/estimator");
const { ConsultationForm, istDate } = await import("@/components/interiors/consultation-form");
const { PortfolioGallery } = await import("@/components/interiors/portfolio-gallery");
const { InteriorsHome } = await import("@/components/interiors/interiors-home");
const { TechServices } = await import("@/components/tech/tech-services");
const { InteriorQuotes } = await import("@/components/admin/interiors/interior-quotes");
const { InteriorConsultations } = await import("@/components/admin/interiors/interior-consultations");
const { InteriorRateCard } = await import("@/components/admin/interiors/interior-rate-card");

const config: InteriorConfig = {
  services: [{ code: "interior-design", title: "Interior Design" }],
  propertyTypes: ["apartment", "villa"],
  roomTypes: ["living", "bedroom", "kitchen"],
  tiers: ["essential", "premium", "luxe"],
  cities: ["Hyderabad", "Bengaluru"],
  items: [
    { code: "flooring", label: "Flooring (tiles)", category: "Civil", basis: "floor_area", unit: "sq ft", rooms: ["living", "bedroom", "kitchen"] },
    { code: "painting", label: "Wall painting", category: "Civil", basis: "wall_area", unit: "sq ft", rooms: ["living", "bedroom", "kitchen"] },
    { code: "tv-unit", label: "TV unit", category: "Carpentry", basis: "each", unit: "each", rooms: ["living"] },
    { code: "wardrobe", label: "Wardrobe", category: "Carpentry", basis: "sqft_front", unit: "sq ft", rooms: ["bedroom"] },
    { code: "modular-kitchen", label: "Modular kitchen", category: "Carpentry", basis: "running_ft", unit: "running ft", rooms: ["kitchen"] },
  ],
  rangePercent: 10,
  gstPercent: 18,
  disclaimer: "Estimate only.",
};

const estimate = (over: Partial<Estimate> = {}): Estimate => ({
  currency: "INR",
  tier: "premium",
  city: "Hyderabad",
  cityFactor: 1,
  rooms: [{ name: "Living room", type: "living", floorAreaSqft: 180, wallAreaSqft: 459, lines: [{ code: "painting", label: "Wall painting", basis: "wall_area", unit: "sq ft", qty: 459, rate: 28, amount: 12852 }], subtotal: 12852 }],
  subtotal: 12852,
  total: 12852,
  low: 12000,
  high: 14000,
  gstPercent: 18,
  gstAmount: 2313,
  totalWithGst: 15165,
  disclaimer: "Estimate only.",
  ...over,
});

beforeEach(() => {
  nav.reset();
});

function serveEstimator() {
  const calls = { estimates: [] as unknown[], quotes: [] as unknown[] };
  server.use(
    http.get(`${API}/interiors/config`, () => ok(config)),
    http.post(`${API}/interiors/estimate`, async ({ request }) => {
      calls.estimates.push(await request.json());
      return ok(estimate());
    }),
    http.post(`${API}/interiors/quotes`, async ({ request }) => {
      calls.quotes.push(await request.json());
      return ok({ reference: "IQ-261108-AB12", estimate: estimate() }, 201);
    }),
  );
  return calls;
}

describe("Estimator", () => {
  it("starts with a living room, shows the estimate worked out by the server and itemises it", async () => {
    const calls = serveEstimator();
    render(<Estimator />);
    expect(await screen.findByLabelText("Length (ft) of Living room")).toHaveValue("15");
    expect(screen.getByText("Floor area: 180 sq ft")).toBeInTheDocument();
    expect(await screen.findByTestId("estimate-range", {}, { timeout: 4000 })).toHaveTextContent("₹12,000 to ₹14,000");
    expect(calls.estimates[0]).toMatchObject({ tier: "premium", city: "Hyderabad", rooms: [{ type: "living", lengthFt: 15, widthFt: 12, heightFt: 10, items: [{ code: "painting" }, { code: "tv-unit" }] }] });
    expect(screen.getByText("GST (18%)")).toBeInTheDocument();
    expect(screen.getByText("₹15,165")).toBeInTheDocument();
    expect(screen.getByText("Estimate only.", { selector: "p" })).toBeInTheDocument();
  });

  it("asks again when something changes, and explains a size that is too small without asking", async () => {
    const calls = serveEstimator();
    const user = userEvent.setup();
    render(<Estimator />);
    await screen.findByTestId("estimate-range", {}, { timeout: 4000 });
    const before = calls.estimates.length;

    const length = screen.getByLabelText("Length (ft) of Living room");
    await user.clear(length);
    await user.type(length, "2");
    expect(await screen.findByText("Length must be at least 3 ft")).toBeInTheDocument();
    expect(screen.getByText(/Enter the sizes of your rooms and choose at least one item/)).toBeInTheDocument();

    await user.clear(length);
    await user.type(length, "20");
    await waitFor(() => expect(calls.estimates.length).toBeGreaterThan(before), { timeout: 4000 });
    expect(calls.estimates.at(-1)).toMatchObject({ rooms: [{ lengthFt: 20 }] });
  });

  it("switches to metres without changing the size of the room", async () => {
    serveEstimator();
    const user = userEvent.setup();
    render(<Estimator />);
    await screen.findByLabelText("Length (ft) of Living room");
    await user.click(screen.getByLabelText("Metres"));
    expect(screen.getByLabelText("Length (m) of Living room")).toHaveValue("4.6");
    expect(screen.getByLabelText("Height (m) of Living room")).toHaveValue("3");
  });

  it("builds a 2 BHK from the quick start and lets rooms be added and removed", async () => {
    serveEstimator();
    const user = userEvent.setup();
    render(<Estimator />);
    await screen.findByLabelText("Length (ft) of Living room");
    await user.click(screen.getByRole("button", { name: "2 BHK" }));
    expect(screen.getAllByRole("listitem").some((li) => li.textContent?.includes("Bedroom 2"))).toBe(true);
    expect(screen.getAllByLabelText(/^Remove /).length).toBe(7);

    await user.click(screen.getByRole("button", { name: "Remove Kitchen" }));
    expect(screen.queryByLabelText("Length (ft) of Kitchen")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Add a room"), "kitchen");
    await user.click(screen.getByRole("button", { name: "Add room" }));
    expect(screen.getAllByLabelText("Length (ft) of Kitchen").length).toBe(1);
  });

  it("takes a quantity for running-feet items and sends it", async () => {
    const calls = serveEstimator();
    const user = userEvent.setup();
    render(<Estimator />);
    await screen.findByLabelText("Length (ft) of Living room");
    await user.click(screen.getByRole("button", { name: "1 BHK" }));
    const qty = await screen.findByLabelText("Modular kitchen quantity in Kitchen");
    await user.type(qty, "14");
    await waitFor(() => expect(JSON.stringify(calls.estimates.at(-1))).toContain('"qty":14'), { timeout: 4000 });
  });

  it("sends a quote request with the contact details and thanks the visitor", async () => {
    const calls = serveEstimator();
    const user = userEvent.setup();
    render(<Estimator />);
    await screen.findByTestId("estimate-range", {}, { timeout: 4000 });

    await user.click(await screen.findByRole("button", { name: "Send my request" }));
    expect(await screen.findByText("Please enter your name")).toBeInTheDocument();
    expect(calls.quotes).toHaveLength(0);

    await user.type(screen.getByLabelText(/Your name/), "Asha Verma");
    await user.type(screen.getByLabelText(/Mobile number/), "9876543210");
    await user.type(screen.getByLabelText(/^Email/), "asha@example.com");
    await user.click(screen.getByRole("button", { name: "Send my request" }));
    expect(await screen.findByText("Thank you! We have your request")).toBeInTheDocument();
    expect(screen.getByText("IQ-261108-AB12")).toBeInTheDocument();
    expect(calls.quotes[0]).toMatchObject({ name: "Asha Verma", phone: "9876543210", email: "asha@example.com", propertyType: "apartment", tier: "premium", city: "Hyderabad" });
  });

  it("shows a friendly message when the quote cannot be sent", async () => {
    serveEstimator();
    server.use(http.post(`${API}/interiors/quotes`, () => fail(429, "RATE_LIMITED")));
    const user = userEvent.setup();
    render(<Estimator />);
    await screen.findByTestId("estimate-range", {}, { timeout: 4000 });
    await user.type(await screen.findByLabelText(/Your name/), "Asha Verma");
    await user.type(screen.getByLabelText(/Mobile number/), "9876543210");
    await user.type(screen.getByLabelText(/^Email/), "asha@example.com");
    await user.click(screen.getByRole("button", { name: "Send my request" }));
    expect(await screen.findByText(/Too many requests from this device/)).toBeInTheDocument();
  });

  it("tells the visitor when the estimator cannot load", async () => {
    server.use(http.get(`${API}/interiors/config`, () => fail(500, "INTERNAL_ERROR")));
    render(<Estimator />);
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't load the estimator");
  });
});

describe("Consultation form", () => {
  const fill = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/Your name/), "Ravi Kumar");
    await user.type(screen.getByLabelText(/Mobile number/), "9123456780");
    await user.type(screen.getByLabelText(/^Email/), "ravi@example.com");
  };

  it("validates, then books a consultation with the chosen service, day and time", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(`${API}/interiors/consultations`, async ({ request }) => {
        bodies.push(await request.json());
        return ok({ reference: "IC-1234ABCD" }, 201);
      }),
    );
    const user = userEvent.setup();
    render(<ConsultationForm defaultService="site-inspection" />);
    await user.click(screen.getByRole("button", { name: "Book my free consultation" }));
    expect(await screen.findByText("Please enter your name")).toBeInTheDocument();
    expect(bodies).toHaveLength(0);

    await fill(user);
    await user.click(screen.getByLabelText(/Evening/));
    await user.click(screen.getByRole("button", { name: "Book my free consultation" }));
    expect(await screen.findByText("Your consultation request is in")).toBeInTheDocument();
    expect(screen.getByText("IC-1234ABCD")).toBeInTheDocument();
    expect(bodies[0]).toMatchObject({ name: "Ravi Kumar", phone: "9123456780", service: "site-inspection", slot: "evening", preferredDate: istDate(1) });
  });

  it("refuses a date outside the next 90 days", async () => {
    const user = userEvent.setup();
    render(<ConsultationForm />);
    await fill(user);
    const date = screen.getByLabelText(/Preferred date/);
    await user.clear(date);
    await user.type(date, istDate(-3));
    await user.click(screen.getByRole("button", { name: "Book my free consultation" }));
    expect(await screen.findByText("Choose a date within the next 90 days")).toBeInTheDocument();
  });

  it("explains too many requests", async () => {
    server.use(http.post(`${API}/interiors/consultations`, () => fail(429, "RATE_LIMITED")));
    const user = userEvent.setup();
    render(<ConsultationForm />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Book my free consultation" }));
    expect(await screen.findByText(/Too many requests from this device/)).toBeInTheDocument();
  });
});

describe("Portfolio, home and the link from the main site", () => {
  it("filters projects by room and style", async () => {
    const user = userEvent.setup();
    render(<PortfolioGallery />);
    expect(screen.getByRole("status")).toHaveTextContent("6 projects");
    await user.click(screen.getByLabelText("Kitchen"));
    expect(screen.getByRole("status")).toHaveTextContent("1 project");
    expect(screen.getByText("Oak and Brass Kitchen")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Minimal"));
    expect(screen.getByText(/No projects match these filters/)).toBeInTheDocument();
    await user.click(screen.getByLabelText("All", { selector: 'input[name="Room"]' }));
    await user.click(screen.getByLabelText("All", { selector: 'input[name="Style"]' }));
    expect(screen.getByRole("status")).toHaveTextContent("6 projects");
  });

  it("shows the home page sections with the eight services and a way to the estimator", () => {
    render(<InteriorsHome />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Where Spacess*Become Stories/);
    for (const service of ["Interior Design", "Custom Fabrication", "Floor Planning", "Modern Furniture", "Home Renovation", "Site Inspection", "Soft Furnishing", "Structural Drawing"]) {
      expect(screen.getByRole("link", { name: `View more about ${service}` })).toHaveAttribute("href", expect.stringContaining("/interiors/services/"));
    }
    expect(screen.getAllByRole("link", { name: /instant estimate|Calculate my estimate/i }).every((l) => l.getAttribute("href") === "/interiors/estimate")).toBe(true);
    expect(screen.getByText("What My Clients Says")).toBeInTheDocument();
  });

  it("opens HVK Interiors in a new tab from the Interior service on the main site, and leaves the others alone", () => {
    render(<TechServices />);
    const interior = screen.getByRole("link", { name: /HVK Interior\b/ });
    expect(interior).toHaveAttribute("href", "/interiors");
    expect(interior).toHaveAttribute("target", "_blank");
    expect(interior).toHaveAttribute("rel", expect.stringContaining("noopener"));
    const events = screen.getByRole("link", { name: /HVK Event Management/ });
    expect(events).toHaveAttribute("href", "#contact");
    expect(events).not.toHaveAttribute("target");
  });
});

const staff: InteriorStaff[] = [{ id: "s1", fullName: "Meera Rao", role: "interiors" }];

const quoteRow = (over: Partial<QuoteRow> = {}): QuoteRow => ({ id: "q1", reference: "IQ-261108-AB12", name: "Asha Verma", phone: "+919876543210", email: "asha@example.com", city: "Hyderabad", propertyType: "apartment", tier: "premium", total: 12852, status: "new", assignedTo: null, createdAt: "2026-11-08T10:00:00.000Z", ...over });
const quoteDetail = (over: Partial<QuoteDetail> = {}): QuoteDetail => ({ ...quoteRow(), notes: "Prefer weekends", input: { rooms: [] }, result: estimate(), staffNotes: [], ...over });

describe("Staff: interiors quotes", () => {
  it("lists quotes, opens one with its breakdown and saves status, assignee and a note", async () => {
    const patches: unknown[] = [];
    server.use(
      http.get(`${API}/admin/interiors/staff`, () => ok(staff)),
      http.get(`${API}/admin/interiors/quotes`, () => ok({ items: [quoteRow()], page: 1, limit: 20, total: 1 } satisfies Page<QuoteRow>)),
      http.get(`${API}/admin/interiors/quotes/q1`, () => ok(quoteDetail())),
      http.patch(`${API}/admin/interiors/quotes/q1`, async ({ request }) => {
        patches.push(await request.json());
        return ok(quoteDetail({ status: "site_visit", assignedTo: "s1", staffNotes: [{ by: "Meera Rao", text: "Visit Saturday", at: "2026-11-08T11:00:00.000Z" }] }));
      }),
    );
    const user = userEvent.setup();
    render(<InteriorQuotes />);
    await user.click(await screen.findByRole("button", { name: /IQ-261108-AB12 · Asha Verma/ }));
    expect(await screen.findByText(/Estimate shown: ₹12,000 to ₹14,000/)).toBeInTheDocument();
    expect(screen.getByText(/Prefer weekends/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+919876543210" })).toHaveAttribute("href", "tel:+919876543210");

    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled(); // nothing changed yet
    await user.selectOptions(screen.getByLabelText("Status"), "site_visit");
    await user.selectOptions(screen.getByLabelText("Assigned to"), "s1");
    await user.type(screen.getByLabelText(/Add a note/), "Visit Saturday");
    await user.click(save);
    await waitFor(() => expect(patches).toEqual([{ status: "site_visit", assignedTo: "s1", note: "Visit Saturday" }]));
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    expect(await screen.findByText(/Visit Saturday/, { selector: "li" })).toBeInTheDocument();
  });

  it("filters by status and says when there is nothing", async () => {
    const queries: string[] = [];
    server.use(
      http.get(`${API}/admin/interiors/staff`, () => ok(staff)),
      http.get(`${API}/admin/interiors/quotes`, ({ request }) => {
        queries.push(new URL(request.url).search);
        return ok({ items: [], page: 1, limit: 20, total: 0 });
      }),
    );
    const user = userEvent.setup();
    render(<InteriorQuotes />);
    expect(await screen.findByText("No quote requests yet.")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Show"), "won");
    await waitFor(() => expect(queries.some((q) => q.includes("status=won"))).toBe(true));
    expect(await screen.findByText("No quotes with that status.")).toBeInTheDocument();
  });
});

describe("Staff: interiors consultations", () => {
  it("lists requests and updates one", async () => {
    const row: ConsultationRow = { id: "c1", name: "Ravi Kumar", phone: "+919123456780", email: "ravi@example.com", city: "Hyderabad", service: "site-inspection", preferredDate: "2026-11-12", slot: "morning", message: "3 BHK handover", status: "new", assignedTo: null, createdAt: "2026-11-08T09:00:00.000Z" };
    const patches: unknown[] = [];
    server.use(
      http.get(`${API}/admin/interiors/staff`, () => ok(staff)),
      http.get(`${API}/admin/interiors/consultations`, () => ok({ items: [row], page: 1, limit: 20, total: 1 })),
      http.patch(`${API}/admin/interiors/consultations/c1`, async ({ request }) => {
        patches.push(await request.json());
        return ok({ ...row, status: "scheduled", staffNotes: [] });
      }),
    );
    const user = userEvent.setup();
    render(<InteriorConsultations />);
    await user.click(await screen.findByRole("button", { name: /Ravi Kumar · Site Inspection/ }));
    expect(screen.getByText(/3 BHK handover/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Status"), "scheduled");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(patches).toEqual([{ status: "scheduled" }]));
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
  });
});

describe("Staff: rate card", () => {
  const card = (): RateCard => ({
    items: [{ code: "flooring", label: "Flooring (tiles)", category: "Civil", basis: "floor_area", rates: { essential: 85, premium: 140, luxe: 260 }, rooms: ["living"], active: true }],
    cities: [{ name: "Hyderabad", factor: 1 }],
    rangePercent: 10,
    gstPercent: 18,
    disclaimer: "Estimate only.",
    updatedAt: null,
  });

  it("edits a rate, adds an item and a city, and saves the whole card", async () => {
    const saved: unknown[] = [];
    server.use(
      http.get(`${API}/admin/interiors/rate-card`, () => ok(card())),
      http.put(`${API}/admin/interiors/rate-card`, async ({ request }) => {
        saved.push(await request.json());
        return ok({ ...card(), updatedAt: "2026-11-08T12:00:00.000Z" });
      }),
    );
    const user = userEvent.setup();
    render(<InteriorRateCard />);
    const rate = await screen.findByLabelText("Flooring (tiles) essential rate");
    await user.clear(rate);
    await user.type(rate, "100");
    await user.type(screen.getByLabelText("New item"), "Wall paneling");
    await user.click(screen.getByRole("button", { name: "Add item" }));
    await user.click(screen.getByRole("button", { name: "Add city" }));
    await user.type(screen.getByLabelText("City 2"), "Pune");
    await user.click(screen.getByRole("button", { name: "Save rate card" }));

    await waitFor(() => expect(saved).toHaveLength(1));
    const body = saved[0] as { items: { code: string; rates: { essential: number }; basis: string }[]; cities: { name: string }[] };
    expect(body.items.map((i) => i.code)).toEqual(["flooring", "wall-paneling"]);
    expect(body.items[0]!.rates.essential).toBe(100);
    expect(body.items[1]).toMatchObject({ basis: "each", rates: { essential: 0, premium: 0, luxe: 0 } });
    expect(body.cities.map((c) => c.name)).toEqual(["Hyderabad", "Pune"]);
    expect(await screen.findByText(/Rate card saved/)).toBeInTheDocument();
  });

  it("will not add an item with no name or a name already taken", async () => {
    server.use(http.get(`${API}/admin/interiors/rate-card`, () => ok(card())));
    const user = userEvent.setup();
    render(<InteriorRateCard />);
    await screen.findByLabelText("Flooring (tiles) essential rate");
    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Give the new item a name");
    await user.type(screen.getByLabelText("New item"), "Flooring Tiles");
    await user.clear(screen.getByLabelText("New item"));
    await user.type(screen.getByLabelText("New item"), "flooring");
    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(within(screen.getByRole("alert")).getByText(/already exists/)).toBeInTheDocument();
  });
});
