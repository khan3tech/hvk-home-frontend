import { expect, test } from "@playwright/test";
import { installFakeApi } from "./fake-api";
import { installTaApi } from "./fake-ta-api";

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
