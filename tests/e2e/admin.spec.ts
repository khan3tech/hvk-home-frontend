import { expect, test, type Page, type Route } from "@playwright/test";
import { installFakeApi } from "./fake-api";

const API = "http://api.test/api/v1";

/** Fake TA backend: one staff user, one lead, one follow-up. */
async function installTaApi(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  const cors = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type,authorization,x-session-mode",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  };
  const ok = (route: Route, data: unknown) =>
    route.fulfill({ status: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ data, meta: { requestId: "e2e" } }) });
  const me = { id: "ta-1", fullName: "Tara Admin", email: "ta@example.com", phone: "+919000000001", city: null, state: null, pincode: null, college: null, place: null, role: "ta", onboardingStep: "completed", demoAction: null, createdAt: null };
  const candidate = { id: "c1", fullName: "Ravi Kumar", email: "ravi@example.com", phone: "+919812345678", city: "Nagpur", state: "Maharashtra", college: "XYZ University", place: "Sitabuldi", onboardingStep: "fee_pending" };
  const state = {
    lead: { id: "lead-1", candidate, status: "new", assignedTo: null as string | null, lastContactAt: null as string | null, nextActionAt: null, notes: [] as { by: string; text: string; at: string }[], createdAt: "2026-10-14T05:00:00Z" },
    followUp: { id: "fu-1", type: "unpaid_payment", candidate, dueAt: "2026-10-15T05:00:00Z", status: "open", assignedTo: null as string | null, completedAt: null, outcome: null as string | null },
    leadQueries: [] as string[],
  };

  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    const key = `${req.method()} ${url.pathname.replace("/api/v1", "")}`;
    switch (key) {
      case "POST /auth/refresh":
      case "POST /auth/login":
        return ok(route, { accessToken: "ta-token", accessTokenExpiresIn: 900, candidate: me });
      case "GET /admin/staff":
        return ok(route, [{ id: "ta-1", fullName: "Tara Admin", role: "ta" }]);
      case "GET /admin/ta-leads": {
        state.leadQueries.push(url.search);
        const status = url.searchParams.get("status");
        const items = !status || status === state.lead.status ? [state.lead] : [];
        return ok(route, { items, page: 1, limit: 20, total: items.length });
      }
      case "GET /admin/ta-leads/lead-1":
        return ok(route, state.lead);
      case "PATCH /admin/ta-leads/lead-1": {
        const patch = req.postDataJSON() as { status?: string; assignedTo?: string; note?: string };
        if (patch.status) state.lead.status = patch.status;
        if (patch.status === "contacted") state.lead.lastContactAt = new Date().toISOString();
        if (patch.assignedTo !== undefined) state.lead.assignedTo = patch.assignedTo;
        if (patch.note) state.lead.notes.push({ by: "ta-1", text: patch.note, at: new Date().toISOString() });
        return ok(route, state.lead);
      }
      case "GET /admin/payments/pending-follow-up": {
        const status = url.searchParams.get("status");
        const items = status === state.followUp.status ? [state.followUp] : [];
        return ok(route, { items, page: 1, limit: 50, total: items.length });
      }
      case "PATCH /admin/follow-ups/fu-1": {
        Object.assign(state.followUp, req.postDataJSON());
        return ok(route, state.followUp);
      }
      default:
        return route.fulfill({ status: 404, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ error: { code: "NOT_FOUND", message: "", details: [] }, meta: { requestId: "e2e" } }) });
    }
  });
  return state;
}

test("TA works a lead and a payment follow-up", async ({ page, baseURL }) => {
  const api = await installTaApi(page, baseURL!);
  await page.context().addCookies([{ name: "hvk_signed_in", value: "1", url: baseURL! }]);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/leads$/);

  await page.getByLabel("Status").selectOption("new");
  await expect(page).toHaveURL(/status=new/);
  expect(api.leadQueries.at(-1)).toContain("status=new");

  await page.getByRole("link", { name: "Ravi Kumar" }).click();
  await expect(page.getByText("XYZ University")).toBeVisible();
  await page.getByRole("button", { name: "Assign to me" }).click();
  await expect(page.getByText("Lead updated.")).toBeVisible();

  await page.getByLabel("Status").selectOption("assigned");
  await page.getByLabel("Add a note").fill("Spoke to Ravi, paying tonight");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Spoke to Ravi, paying tonight")).toBeVisible();
  expect(api.lead).toMatchObject({ status: "assigned", assignedTo: "ta-1" });

  await page.getByRole("link", { name: "Payment follow-ups" }).click();
  await page.getByRole("button", { name: "Mark done" }).click();
  await page.getByLabel("Outcome").fill("Paid after call");
  await page.getByRole("button", { name: "Save outcome" }).click();
  await expect(page.getByText("Nothing here.")).toBeVisible();
  expect(api.followUp).toMatchObject({ status: "done", outcome: "Paid after call" });
});

test("candidates cannot open the TA dashboard", async ({ page, baseURL }) => {
  await installFakeApi(page, baseURL!, { signedIn: true, step: "fee_pending" });
  await page.context().addCookies([{ name: "hvk_signed_in", value: "1", url: baseURL! }]);
  await page.goto("/admin/leads");
  // Spec (contracts/routes.md): candidates opening /admin/** are sent to their dashboard.
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: /Pay registration fee/ })).toBeVisible();
});
