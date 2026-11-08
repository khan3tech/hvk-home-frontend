import { expect, test, type Page } from "@playwright/test";

// "Join Us" in the page's own call-to-action band (the header copy is hidden on phones).
const joinUs = (page: Page) =>
  page.locator("section", { hasText: "Ready to Build Your Future?" }).getByRole("link", { name: /Join Us/ });

test("home page renders (unchanged by the portal work)", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/HVK/);
  await expect(page.locator("#main-content")).toBeVisible();
});

test("registration page offers the candidate form as a popup", async ({ page }) => {
  await page.goto("/registration");
  // The form is not on the page itself: "Join Us" opens it in a popup.
  await expect(page.getByRole("form", { name: "Candidate registration" })).toHaveCount(0);
  await joinUs(page).click();
  const dialog = page.getByRole("dialog", { name: "Candidate Registration" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel(/Full Name/)).toBeVisible();

  // Switch to sign-in inside the popup, then close it.
  await dialog.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("dialog", { name: "Sign in" })).toBeVisible();
  await page.getByRole("button", { name: "Close sign in" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/registration$/);
});

test("/registration#registration opens the registration popup straight away", async ({ page }) => {
  await page.goto("/registration#registration");
  await expect(page.getByRole("dialog", { name: "Candidate Registration" })).toBeVisible();
});

test("the registration popup fits on a laptop screen without a scrollbar", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 680 });
  await page.goto("/registration#registration");
  const dialog = page.getByRole("dialog", { name: "Candidate Registration" });
  await expect(dialog).toBeVisible();
  const overflow = await dialog.evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("a service card opens its detail page, and the footer links to it too", async ({ page }) => {
  await page.goto("/registration");
  await page.locator("#services").getByRole("link", { name: "Placement Assistance" }).click();
  await expect(page).toHaveURL(/\/services\/placement-assistance$/);
  await expect(page.getByRole("heading", { level: 1, name: "Placement Assistance" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Explore our other services" })).toBeVisible();
  await page.getByRole("link", { name: "Career Guidance" }).first().click();
  await expect(page).toHaveURL(/\/services\/career-guidance$/);
  await page.goto("/services/not-a-service");
  await expect(page.getByText(/not found|404/i).first()).toBeVisible();
});
