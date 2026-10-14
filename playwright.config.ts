import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * E2E runs against a production build. The API is mocked per test with `page.route` on
 * http://api.test (baked in via NEXT_PUBLIC_API_BASE_URL at build time), so no backend is needed.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://api.test",
      NEXT_PUBLIC_DEMO_VIDEO_URL: "https://cdn.test/demo.mp4",
    },
  },
});
