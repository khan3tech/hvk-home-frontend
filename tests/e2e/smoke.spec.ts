import { expect, test } from "@playwright/test";

test("home page renders (unchanged by the portal work)", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/HVK/);
  await expect(page.locator("#main-content")).toBeVisible();
});

test("registration page offers the candidate form as a popup", async ({ page }) => {
  await page.goto("/registration");
  // The form is no longer inline: the page has a call to action that opens it.
  await expect(page.getByRole("form", { name: "Candidate registration" })).toHaveCount(0);
  await page.getByRole("button", { name: /Register now/ }).click();
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
