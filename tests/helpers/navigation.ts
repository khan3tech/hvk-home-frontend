import { vi } from "vitest";

/**
 * Shared next/navigation mock. Must not import app code (the mock factory would import itself).
 * Use in a test file with:
 *   vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);
 */
export const nav = {
  pathname: "/dashboard",
  search: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
  reset() {
    this.pathname = "/dashboard";
    this.search = new URLSearchParams();
    this.push.mockReset();
    this.replace.mockReset();
  },
};

export const navigationModule = {
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.search,
};
