import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/lib/session/session-provider";
import { API, authResult, fail, ok } from "../msw/handlers";
import { server } from "../msw/server";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/registration",
  useSearchParams: () => new URLSearchParams(),
}));

const { RegistrationForm } = await import("@/components/home/registration-form");

function renderForm() {
  server.use(http.post(`${API}/auth/refresh`, () => fail(401, "UNAUTHENTICATED")));
  return render(<SessionProvider><RegistrationForm /></SessionProvider>);
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Full Name/), "Asha Verma");
  await user.type(screen.getByLabelText(/Email Address/), "asha@example.com");
  await user.type(screen.getByLabelText(/Contact Number/), "9876543210");
  await user.type(screen.getByLabelText(/College/), "ABC Engineering College");
  await user.type(screen.getByLabelText(/Place/), "Kothrud");
  await user.type(screen.getByLabelText(/^City/), "Pune");
  await user.type(screen.getByRole("combobox"), "Mahara");
  await user.click(await screen.findByRole("option", { name: "Maharashtra" }));
  await user.type(screen.getByLabelText(/Pincode/), "411001");
  await user.type(screen.getByLabelText(/Create Password/), "Str0ng-passw0rd");
  await user.type(screen.getByLabelText(/Confirm Password/), "Str0ng-passw0rd");
  await user.click(screen.getByRole("checkbox"));
}

beforeEach(() => push.mockReset());

describe("RegistrationForm", () => {
  it("registers with the API contract (+91 phone, cookie session) and continues to the demo", async () => {
    let body: unknown;
    let mode: string | null = null;
    server.use(
      http.post(`${API}/auth/register`, async ({ request }) => {
        body = await request.json();
        mode = request.headers.get("x-session-mode");
        return ok({ ...authResult(), nextStep: "demo_pending" }, 201);
      }),
    );
    const user = userEvent.setup();
    renderForm();
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: /Create Account/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/onboarding"));
    expect(body).toEqual({
      fullName: "Asha Verma",
      email: "asha@example.com",
      phone: "+919876543210",
      college: "ABC Engineering College",
      place: "Kothrud",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      password: "Str0ng-passw0rd",
      acceptTerms: true,
    });
    expect(mode).toBe("cookie");
  });

  it("blocks submission with client-side errors and sends nothing", async () => {
    const register = vi.fn();
    server.use(http.post(`${API}/auth/register`, () => { register(); return ok({}); }));
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Pincode/), "012345");
    await user.type(screen.getByLabelText(/Create Password/), "short");
    await user.type(screen.getByLabelText(/Confirm Password/), "different");
    await user.click(screen.getByRole("button", { name: /Create Account/ }));

    expect(await screen.findByText("Enter a valid 6 digit pincode")).toBeInTheDocument();
    expect(screen.getByText("Use at least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(screen.getByText("Please accept the terms to continue")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("shows API field errors under the matching fields", async () => {
    server.use(
      http.post(`${API}/auth/register`, () =>
        fail(400, "VALIDATION_ERROR", [
          { path: "body.phone", message: "Invalid phone number" },
          { path: "body.college", message: "College is too short" },
        ]),
      ),
    );
    const user = userEvent.setup();
    renderForm();
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: /Create Account/ }));

    expect(await screen.findByText("Invalid phone number")).toBeInTheDocument();
    expect(screen.getByText("College is too short")).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Number/)).toHaveAttribute("aria-invalid", "true");
    expect(push).not.toHaveBeenCalled();
  });

  it("offers sign-in when the account already exists", async () => {
    server.use(http.post(`${API}/auth/register`, () => fail(409, "ACCOUNT_EXISTS")));
    const user = userEvent.setup();
    renderForm();
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: /Create Account/ }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("An account with these details already exists");
    expect(alert.querySelector('a[href="/login"]')).not.toBeNull();
  });

  it("shows a friendly message when the server is unreachable", async () => {
    server.use(http.post(`${API}/auth/register`, () => Response.error()));
    const user = userEvent.setup();
    renderForm();
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: /Create Account/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the server");
  });

  it("signed-in visitors see a link to their dashboard instead of the form", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => ok(authResult())));
    render(<SessionProvider><RegistrationForm /></SessionProvider>);
    expect(await screen.findByRole("link", { name: /Continue to your dashboard/ })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("form", { name: "Candidate registration" })).not.toBeInTheDocument();
  });
});
