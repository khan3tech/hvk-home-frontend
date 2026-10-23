import { expect, test } from "@playwright/test";
import { installFakeApi } from "./fake-api";

test("candidate journey: register → demo → pay → exam → feedback → result", async ({ page, baseURL }) => {
  const api = await installFakeApi(page, baseURL!);

  // Register through the popup on the /registration page.
  await page.goto("/registration");
  await page.getByRole("button", { name: /Register now/ }).click();
  await expect(page.getByRole("dialog", { name: "Candidate Registration" })).toBeVisible();
  await page.getByLabel(/Full Name/).fill("Asha Verma");
  await page.getByLabel(/Email Address/).fill("asha@example.com");
  await page.getByLabel(/Contact Number/).fill("9876543210");
  await page.getByLabel(/College/).fill("ABC Engineering College");
  await page.getByLabel(/Place/).fill("Kothrud");
  await page.getByLabel(/^City/).fill("Pune");
  await page.getByRole("combobox").fill("Mahara");
  await page.getByRole("option", { name: "Maharashtra" }).click();
  await page.getByLabel(/Pincode/).fill("411001");
  await page.getByLabel(/Create Password/).fill("Str0ng-passw0rd");
  await page.getByLabel(/Confirm Password/).fill("Str0ng-passw0rd");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Create Account/ }).click();

  // Demo → skip.
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: /Skip/ }).click();

  // Payment via (stubbed) Razorpay Checkout, verified by the API.
  await expect(page).toHaveURL(/\/payment$/);
  await page.getByRole("button", { name: "Pay ₹499.00" }).click();
  await expect(page.getByRole("heading", { name: "Payment successful" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __rzpOptions: { order_id: string; key: string } }).__rzpOptions)).toMatchObject({
    order_id: "order_e2e",
    key: "rzp_test_e2e",
  });
  await page.getByRole("button", { name: "Go to your exam" }).click();

  // Exam hand-off.
  await expect(page).toHaveURL(/\/exam$/);
  await expect(page.getByRole("link", { name: /Start exam/ })).toHaveAttribute("href", "https://exam.test/start?attempt=att-1");
  await page.getByRole("button", { name: /finished the exam/ }).click();
  await expect(page.getByText(/Waiting for the exam platform/)).toBeVisible();

  // Provider confirmed completion: the dashboard now points to feedback.
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /Give feedback/ }).click();
  await expect(page).toHaveURL(/\/feedback$/);
  await page.getByRole("radio", { name: "5 stars" }).click();
  await page.getByLabel(/Anything else/).fill("Great experience");
  await page.getByRole("button", { name: "Submit feedback" }).click();

  await expect(page).toHaveURL(/\/thank-you$/);
  await page.getByRole("link", { name: "View result status" }).click();
  await expect(page.getByText(/isn't published yet/)).toBeVisible();

  api.resultPublished = true;
  await page.reload();
  await expect(page.getByText("Passed")).toBeVisible();
  expect(api.feedback).toMatchObject({ rating: 5, comments: "Great experience" });
});

test("session survives a reload; sign-out protects portal pages", async ({ page, baseURL }) => {
  await installFakeApi(page, baseURL!, { signedIn: true, step: "fee_pending" });
  await page.context().addCookies([{ name: "hvk_signed_in", value: "1", url: baseURL! }]);

  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /Pay registration fee/ })).toBeVisible();
  // Regression: the signed-in header used to overflow the page horizontally.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole("link", { name: /Join Us/ })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("link", { name: /Pay registration fee/ })).toBeVisible();

  // Out-of-order page → routed to the current step.
  await page.goto("/exam");
  await expect(page).toHaveURL(/\/payment$/);

  const menu = page.getByRole("button", { name: "Open menu" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
});

test("legacy links redirect to the new flow", async ({ page, baseURL }) => {
  await installFakeApi(page, baseURL!);
  await page.goto("/exam/access/some-old-token");
  await expect(page).toHaveURL(/\/login\?next=(%2F|\/)exam$/);
});
