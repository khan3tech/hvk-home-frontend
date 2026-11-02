import { render, screen } from "@testing-library/react";
import { http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/lib/session/session-provider";
import { mobileOtpEnabled } from "@/lib/features";
import { API, fail } from "../msw/handlers";
import { server } from "../msw/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));

const { LoginForm } = await import("@/components/portal/login-form");

afterEach(() => vi.unstubAllEnvs());

function renderLogin() {
  server.use(http.post(`${API}/auth/refresh`, () => fail(401, "UNAUTHENTICATED")));
  render(
    <SessionProvider>
      <LoginForm />
    </SessionProvider>,
  );
}

describe("mobile OTP sign-in switch", () => {
  it("is off unless NEXT_PUBLIC_MOBILE_OTP_ENABLED is exactly \"true\"", () => {
    for (const [value, expected] of [["true", true], ["false", false], ["", false], ["1", false], ["TRUE", false]] as const) {
      vi.stubEnv("NEXT_PUBLIC_MOBILE_OTP_ENABLED", value);
      expect(mobileOtpEnabled(), value).toBe(expected);
    }
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_MOBILE_OTP_ENABLED", undefined as unknown as string);
    expect(mobileOtpEnabled()).toBe(false);
  });

  it("when off, shows only the email and password form (no tabs)", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOBILE_OTP_ENABLED", "false");
    renderLogin();
    expect(await screen.findByLabelText(/Password/)).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("tab", { name: "Mobile number" })).toBeNull();
    expect(screen.queryByText(/Send (code|OTP)/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create an account" })).toBeInTheDocument();
  });

  it("when on, offers both tabs", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOBILE_OTP_ENABLED", "true");
    renderLogin();
    expect(await screen.findByRole("tab", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Mobile number" })).toBeInTheDocument();
  });
});
