import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { installFakeApi } from "./fake-api";
import { installTaApi } from "./fake-ta-api";

/** WCAG 2.1 A/AA checks; serious and critical issues fail the build. */
async function expectAccessible(page: Page) {
  // Reveal every scroll-triggered (framer-motion) section and let fades finish, so contrast is
  // measured on the final rendering rather than mid-animation.
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")})`),
  ).toEqual([]);
}

test.describe("accessibility", () => {
  test("registration and sign-in pages", async ({ page, baseURL }) => {
    await installFakeApi(page, baseURL!);
    for (const path of ["/registration", "/login", "/forgot-password"]) {
      await page.goto(path);
      await page.locator("h1, h2").first().waitFor();
      await expectAccessible(page);
    }
  });

  test("registration and sign-in popups", async ({ page, baseURL }) => {
    await installFakeApi(page, baseURL!);
    await page.goto("/registration");
    await page.getByRole("button", { name: /Register now/ }).click();
    const registration = page.getByRole("dialog", { name: "Candidate Registration" });
    await registration.waitFor();
    await expectAccessible(page);
    await registration.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("dialog", { name: "Sign in" }).waitFor();
    await expectAccessible(page);
  });

  test("candidate dashboard and payment", async ({ page, baseURL }) => {
    await installFakeApi(page, baseURL!, { signedIn: true, step: "fee_pending" });
    await page.context().addCookies([{ name: "hvk_signed_in", value: "1", url: baseURL! }]);
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /Pay registration fee/ }).waitFor();
    await expectAccessible(page);
    await page.goto("/payment");
    await page.getByRole("button", { name: /Pay ₹/ }).waitFor();
    await expectAccessible(page);
  });

  test("TA leads list", async ({ page, baseURL }) => {
    await installTaApi(page, baseURL!);
    await page.context().addCookies([{ name: "hvk_signed_in", value: "1", url: baseURL! }]);
    await page.goto("/admin/leads");
    await page.getByRole("link", { name: "Ravi Kumar" }).waitFor();
    await expectAccessible(page);
  });
});
