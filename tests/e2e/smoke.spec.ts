import { expect, test } from "@playwright/test";

test("home page renders (unchanged by the portal work)", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/HVK/);
  await expect(page.locator("#main-content")).toBeVisible();
});

test("registration page renders the candidate form", async ({ page }) => {
  await page.goto("/registration");
  await expect(page.getByRole("heading", { name: "Candidate Registration" })).toBeVisible();
});
