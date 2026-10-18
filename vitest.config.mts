import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/components/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 20_000,
    // Matches the API base used by the MSW handlers.
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://api.test",
      NEXT_PUBLIC_DEMO_VIDEO_URL: "https://cdn.test/demo.mp4",
    },
    coverage: {
      provider: "v8",
      include: ["lib/**/*.{ts,tsx}", "components/portal/**/*.{ts,tsx}", "components/admin/**/*.{ts,tsx}"],
      reporter: ["text-summary", "text", "html", "lcov", "json-summary"],
    },
  },
});
