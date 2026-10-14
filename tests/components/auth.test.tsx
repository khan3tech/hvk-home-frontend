import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/lib/session/session-provider";
import { API, authResult, fail, ok } from "../msw/handlers";
import { server } from "../msw/server";

const replace = vi.fn();
let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/login",
  useSearchParams: () => search,
}));

const { LoginForm } = await import("@/components/portal/login-form");
const { ForgotPasswordForm, ResetPasswordForm } = await import("@/components/portal/password-reset-forms");

function anonymous() {
  server.use(http.post(`${API}/auth/refresh`, () => fail(401, "UNAUTHENTICATED")));
}

beforeEach(() => {
  replace.mockReset();
  search = new URLSearchParams();
});

describe("Login with password", () => {
  it("signs in with a 10-digit mobile (sent as +91) and goes to the dashboard", async () => {
    let body: unknown;
    anonymous();
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        body = await request.json();
        return ok(authResult());
      }),
    );
    const user = userEvent.setup();
    render(<SessionProvider><LoginForm /></SessionProvider>);
    await user.type(screen.getByLabelText(/Email or mobile/), "9876543210");
    await user.type(screen.getByLabelText(/^Password/), "Str0ng-passw0rd");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(body).toEqual({ emailOrPhone: "+919876543210", password: "Str0ng-passw0rd" });
  });

  it("honours a safe ?next= and sends staff to /admin", async () => {
    search = new URLSearchParams({ next: "/payment" });
    anonymous();
    server.use(http.post(`${API}/auth/login`, () => ok(authResult())));
    const user = userEvent.setup();
    const { unmount } = render(<SessionProvider><LoginForm /></SessionProvider>);
    await user.type(screen.getByLabelText(/Email or mobile/), "asha@example.com");
    await user.type(screen.getByLabelText(/^Password/), "x");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/payment"));
    unmount();

    replace.mockReset();
    anonymous();
    server.use(http.post(`${API}/auth/login`, () => ok(authResult({ role: "ta" }))));
    render(<SessionProvider><LoginForm /></SessionProvider>);
    await user.type(screen.getByLabelText(/Email or mobile/), "ta@example.com");
    await user.type(screen.getByLabelText(/^Password/), "x");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
  });

  it.each([
    [401, "INVALID_CREDENTIALS", "Incorrect details. Please try again."],
    [429, "RATE_LIMITED", "Too many attempts. Please wait a moment and try again."],
  ])("shows a generic message for %s %s", async (status, code, message) => {
    anonymous();
    server.use(http.post(`${API}/auth/login`, () => fail(status, code)));
    const user = userEvent.setup();
    render(<SessionProvider><LoginForm /></SessionProvider>);
    await user.type(screen.getByLabelText(/Email or mobile/), "asha@example.com");
    await user.type(screen.getByLabelText(/^Password/), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects visitors who are already signed in", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => ok(authResult())));
    render(<SessionProvider><LoginForm /></SessionProvider>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });
});

describe("Login with OTP", () => {
  it("requests a code, enforces the resend cooldown, and verifies", async () => {
    const requests: unknown[] = [];
    let verifyBody: unknown;
    anonymous();
    server.use(
      http.post(`${API}/auth/otp/request`, async ({ request }) => {
        requests.push(await request.json());
        return ok({ challengeId: "ch-1", expiresInSeconds: 300 }, 202);
      }),
      http.post(`${API}/auth/otp/verify`, async ({ request }) => {
        verifyBody = await request.json();
        return ok(authResult());
      }),
    );
    const user = userEvent.setup();
    render(<SessionProvider><LoginForm /></SessionProvider>);
    await user.click(screen.getByRole("tab", { name: "Mobile OTP" }));
    await user.type(screen.getByLabelText(/Mobile number/), "9876543210");
    await user.click(screen.getByRole("button", { name: "Send code" }));

    expect(await screen.findByText(/Resend in 60s/)).toBeDisabled();
    expect(requests).toEqual([{ phoneE164: "+919876543210", purpose: "login" }]);

    await user.type(screen.getByLabelText(/^Code/), "123456");
    await user.click(screen.getByRole("button", { name: "Verify & sign in" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(verifyBody).toEqual({ phoneE164: "+919876543210", challengeId: "ch-1", otp: "123456" });
  });

  it("shows an error for a wrong or expired code", async () => {
    anonymous();
    server.use(
      http.post(`${API}/auth/otp/request`, () => ok({ challengeId: "ch-1", expiresInSeconds: 300 }, 202)),
      http.post(`${API}/auth/otp/verify`, () => fail(401, "INVALID_CREDENTIALS")),
    );
    const user = userEvent.setup();
    render(<SessionProvider><LoginForm /></SessionProvider>);
    await user.click(screen.getByRole("tab", { name: "Mobile OTP" }));
    await user.type(screen.getByLabelText(/Mobile number/), "9876543210");
    await user.click(screen.getByRole("button", { name: "Send code" }));
    await user.type(await screen.findByLabelText(/^Code/), "000000");
    await user.click(screen.getByRole("button", { name: "Verify & sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect details");
  });

  it("re-enables resend after the cooldown", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      anonymous();
      server.use(http.post(`${API}/auth/otp/request`, () => ok({ challengeId: "ch-1", expiresInSeconds: 300 }, 202)));
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<SessionProvider><LoginForm /></SessionProvider>);
      await user.click(screen.getByRole("tab", { name: "Mobile OTP" }));
      await user.type(screen.getByLabelText(/Mobile number/), "9876543210");
      await user.click(screen.getByRole("button", { name: "Send code" }));
      await screen.findByText(/Resend in/);
      for (let i = 0; i < 61; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
      }
      expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Forgot and reset password", () => {
  it("forgot: shows the same confirmation regardless of account existence", async () => {
    server.use(http.post(`${API}/auth/password/forgot`, () => ok({ accepted: true }, 202)));
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/Email address/), "nobody@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText(/If an account exists for that email/)).toBeInTheDocument();
  });

  it("reset: updates the password with the token from the link", async () => {
    search = new URLSearchParams({ token: "reset-token-1234567890" });
    let body: unknown;
    server.use(
      http.post(`${API}/auth/password/reset`, async ({ request }) => {
        body = await request.json();
        return new Response(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    render(<ResetPasswordForm />);
    await user.type(screen.getByLabelText(/^New password/), "Brand-new-pass-1");
    await user.type(screen.getByLabelText(/Confirm new password/), "Brand-new-pass-1");
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(await screen.findByText("Password updated")).toBeInTheDocument();
    expect(body).toEqual({ resetToken: "reset-token-1234567890", newPassword: "Brand-new-pass-1" });
  });

  it("reset: explains an invalid or expired link", async () => {
    search = new URLSearchParams({ token: "reset-token-1234567890" });
    server.use(http.post(`${API}/auth/password/reset`, () => fail(400, "INVALID_TOKEN")));
    const user = userEvent.setup();
    render(<ResetPasswordForm />);
    await user.type(screen.getByLabelText(/^New password/), "Brand-new-pass-1");
    await user.type(screen.getByLabelText(/Confirm new password/), "Brand-new-pass-1");
    await user.click(screen.getByRole("button", { name: "Update password" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("invalid or has expired");
    expect(alert.querySelector('a[href="/forgot-password"]')).not.toBeNull();
  });

  it("reset: handles a missing token", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByText("Reset link missing")).toBeInTheDocument();
  });
});
