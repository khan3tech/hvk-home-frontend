import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";

const API = "http://api.test/api/v1";

const config = {
  services: [{ code: "interior-design", title: "Interior Design" }],
  propertyTypes: ["apartment", "villa"],
  roomTypes: ["living", "bedroom", "kitchen"],
  tiers: ["essential", "premium", "luxe"],
  cities: ["Hyderabad", "Bengaluru"],
  items: [
    { code: "flooring", label: "Flooring (tiles)", category: "Civil", basis: "floor_area", unit: "sq ft", rooms: ["living"] },
    { code: "painting", label: "Wall painting", category: "Civil", basis: "wall_area", unit: "sq ft", rooms: ["living"] },
    { code: "tv-unit", label: "TV unit", category: "Carpentry", basis: "each", unit: "each", rooms: ["living"] },
  ],
  rangePercent: 10,
  gstPercent: 18,
  disclaimer: "Estimate only.",
};

const estimate = {
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
};

/** Fake interiors API: the estimator form's choices, an estimate, and an accepted quote or consultation. */
async function installInteriorsApi(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  const cors = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "content-type,authorization,x-session-mode", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
  const ok = (route: Route, data: unknown, status = 200) => route.fulfill({ status, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ data, meta: { requestId: "e2e" } }) });
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const path = new URL(req.url()).pathname.replace("/api/v1", "");
    if (path === "/interiors/config") return ok(route, config);
    if (path === "/interiors/estimate") return ok(route, estimate);
    if (path === "/interiors/quotes") return ok(route, { reference: "IQ-261108-AB12", estimate }, 201);
    if (path === "/interiors/consultations") return ok(route, { reference: "IC-1234ABCD" }, 201);
    return route.fulfill({ status: 404, headers: cors, body: "{}" });
  });
}

/** WCAG 2.1 A/AA; serious and critical issues fail. */
async function expectAccessible(page: Page) {
  await page.waitForTimeout(600);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")})`)).toEqual([]);
}

test.describe("HVK Interiors", () => {
  test("home page shows the studio, its eight services and the way to an estimate", async ({ page }) => {
    await page.goto("/interiors");
    await expect(page).toHaveTitle(/HVK Interiors/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Become Stories");
    await expect(page.getByRole("link", { name: /View more about/ })).toHaveCount(8);
    await page.getByRole("link", { name: /Get an instant estimate/ }).click();
    await expect(page).toHaveURL(/\/interiors\/estimate$/);
  });

  test("a service page and the portfolio filters work", async ({ page }) => {
    await page.goto("/interiors/services");
    await page.getByRole("link", { name: "View more about Floor Planning" }).click();
    await expect(page).toHaveURL(/\/interiors\/services\/floor-planning$/);
    await expect(page.getByRole("heading", { level: 1, name: "Floor Planning" })).toBeVisible();

    await page.goto("/interiors/portfolio");
    await expect(page.getByRole("status")).toContainText("6 projects");
    await page.getByRole("radio", { name: "Kitchen", exact: true }).check({ force: true });
    await expect(page.getByRole("status")).toContainText("1 project");
  });

  test("the estimator shows an estimate and sends a quote request", async ({ page, baseURL }) => {
    await installInteriorsApi(page, baseURL!);
    await page.goto("/interiors/estimate");
    await expect(page.getByTestId("estimate-range")).toContainText("₹12,000 to ₹14,000");
    await page.getByLabel(/Your name/).fill("Asha Verma");
    await page.getByLabel(/Mobile number/).fill("9876543210");
    await page.getByLabel(/^Email/).fill("asha@example.com");
    await page.getByRole("button", { name: "Send my request" }).click();
    await expect(page.getByText("Thank you! We have your request")).toBeVisible();
    await expect(page.getByText("IQ-261108-AB12")).toBeVisible();
  });

  test("a consultation can be booked from the contact page", async ({ page, baseURL }) => {
    await installInteriorsApi(page, baseURL!);
    await page.goto("/interiors/contact?service=site-inspection");
    await expect(page.getByLabel(/What do you need/)).toHaveValue("site-inspection");
    await page.getByLabel(/Your name/).fill("Ravi Kumar");
    await page.getByLabel(/Mobile number/).fill("9123456780");
    await page.getByLabel(/^Email/).fill("ravi@example.com");
    await page.getByRole("button", { name: "Book my free consultation" }).click();
    await expect(page.getByText("Your consultation request is in")).toBeVisible();
  });

  test("the main site opens HVK Interiors in a new tab", async ({ page, context }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /HVK Interior\b/ });
    await expect(link).toHaveAttribute("target", "_blank");
    const [popup] = await Promise.all([context.waitForEvent("page"), link.click()]);
    await expect(popup).toHaveURL(/\/interiors$/);
  });

  test("pages are accessible", async ({ page, baseURL }) => {
    await installInteriorsApi(page, baseURL!);
    for (const path of ["/interiors", "/interiors/services", "/interiors/services/interior-design", "/interiors/portfolio", "/interiors/about", "/interiors/contact", "/interiors/blog"]) {
      await page.goto(path);
      await page.locator("h1, h2").first().waitFor();
      await expectAccessible(page);
    }
    await page.goto("/interiors/estimate");
    await page.getByTestId("estimate-range").waitFor();
    await expectAccessible(page);
  });
});
