import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/lib/session/session-provider";
import { API, authResult, fail, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav } from "../helpers/navigation";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { AuthDialogProvider } = await import("@/components/auth/auth-dialog");
const { AuthLink } = await import("@/components/auth/auth-link");
const { RegistrationHashOpener } = await import("@/components/auth/registration-hash-opener");
const { Header } = await import("@/components/layout/header");

// jsdom has no modal <dialog> API; this is the part of it the popup relies on.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

beforeEach(() => {
  nav.reset();
  nav.pathname = "/registration";
  server.use(http.post(`${API}/auth/refresh`, () => fail(401, "UNAUTHENTICATED")));
});

function Harness() {
  return (
    <SessionProvider>
      <AuthDialogProvider>
        <AuthLink view="login" href="/login">Sign in</AuthLink>
        <AuthLink view="register" href="/registration#registration">Join Us</AuthLink>
      </AuthDialogProvider>
    </SessionProvider>
  );
}

const signInDialog = () => screen.getByRole("dialog", { name: "Sign in" });
const registerDialog = () => screen.getByRole("dialog", { name: "Candidate Registration" });

describe("sign-in / create-account popup", () => {
  it("opens sign-in as a popup without leaving the page", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Sign in" }));

    const dialog = signInDialog();
    expect(within(dialog).getByLabelText(/Email or mobile/)).toBeInTheDocument();
    expect(within(dialog).getByRole("tab", { name: "Mobile OTP" })).toBeInTheDocument();
    expect(nav.push).not.toHaveBeenCalled();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("opens the registration form as a popup and switches between the two views", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("link", { name: "Join Us" }));
    const registration = registerDialog();
    expect(within(registration).getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(within(registration).getByLabelText(/Pincode/)).toBeInTheDocument();

    await user.click(within(registration).getByRole("button", { name: "Sign in" }));
    expect(within(signInDialog()).getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Candidate Registration" })).not.toBeInTheDocument();

    await user.click(within(signInDialog()).getByRole("button", { name: "Create an account" }));
    expect(registerDialog()).toBeInTheDocument();
  });

  it("closes with the close button, Escape and a click on the backdrop", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("link", { name: "Sign in" }));
    await user.click(within(signInDialog()).getByRole("button", { name: "Close sign in" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Join Us" }));
    fireEvent(registerDialog(), new Event("cancel", { cancelable: true })); // Escape
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Sign in" }));
    fireEvent.click(signInDialog()); // the dialog element itself is the backdrop area
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("signs in from the popup, goes to the candidate's page, and closes once the page changes", async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        body = await request.json();
        return ok(authResult());
      }),
    );
    const user = userEvent.setup();
    const { rerender } = render(<Harness />);
    await user.click(screen.getByRole("link", { name: "Sign in" }));
    const dialog = signInDialog();
    await user.type(within(dialog).getByLabelText(/Email or mobile/), "9876543210");
    await user.type(within(dialog).getByLabelText(/^Password/), "Str0ng-passw0rd");
    await user.click(within(dialog).getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/dashboard"));
    expect(body).toEqual({ emailOrPhone: "+919876543210", password: "Str0ng-passw0rd" });

    nav.pathname = "/dashboard"; // the redirect lands
    rerender(<Harness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps normal link behaviour for new-tab clicks and when the popup is unavailable", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness />);
    fireEvent.click(screen.getByRole("link", { name: "Sign in" }), { ctrlKey: true });
    fireEvent.click(screen.getByRole("link", { name: "Join Us" }), { metaKey: true });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    unmount();

    // Outside the provider the link is just a link (e.g. isolated component tests).
    render(<AuthLink view="login" href="/login">Sign in</AuthLink>);
    await user.click(screen.getByRole("link", { name: "Sign in" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the registration popup for visitors who arrive at /registration#registration", async () => {
    window.location.hash = "#registration";
    try {
      render(
        <SessionProvider>
          <AuthDialogProvider>
            <RegistrationHashOpener />
          </AuthDialogProvider>
        </SessionProvider>,
      );
      expect(await screen.findByRole("dialog", { name: "Candidate Registration" })).toBeInTheDocument();
    } finally {
      window.location.hash = "";
    }
  });

  it("does not open it without the #registration link, or for signed-in visitors", async () => {
    const { unmount } = render(
      <SessionProvider>
        <AuthDialogProvider>
          <RegistrationHashOpener />
        </AuthDialogProvider>
      </SessionProvider>,
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    unmount();

    window.location.hash = "#registration";
    try {
      server.use(http.post(`${API}/auth/refresh`, () => ok(authResult())));
      render(
        <SessionProvider>
          <AuthDialogProvider>
            <RegistrationHashOpener />
          </AuthDialogProvider>
        </SessionProvider>,
      );
      await new Promise((resolve) => setTimeout(resolve, 150)); // the session resolves as signed in
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    } finally {
      window.location.hash = "";
    }
  });

  it("the header's Sign in and Join Us buttons open the popups", async () => {
    const user = userEvent.setup();
    render(
      <SessionProvider>
        <AuthDialogProvider>
          <Header />
        </AuthDialogProvider>
      </SessionProvider>,
    );

    // Desktop and mobile menus each render the buttons; the first one is the desktop control.
    await user.click((await screen.findAllByRole("link", { name: "Sign in" }))[0]!);
    expect(signInDialog()).toBeInTheDocument();
    await user.click(within(signInDialog()).getByRole("button", { name: "Close sign in" }));

    await user.click(screen.getAllByRole("link", { name: /Join Us/ })[0]!);
    expect(registerDialog()).toBeInTheDocument();
  });
});
