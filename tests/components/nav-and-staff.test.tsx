import { render, screen, within } from "@testing-library/react";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/lib/session/session-provider";
import { API, authResult, fail, makeCandidate, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav } from "../helpers/navigation";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { Header } = await import("@/components/layout/header");
const { AdminHeader } = await import("@/components/admin/admin-header");

beforeEach(() => {
  nav.reset();
  server.use(http.post(`${API}/auth/refresh`, () => fail(401, "UNAUTHENTICATED")));
});

const renderHeader = (pathname: string) => {
  nav.pathname = pathname;
  render(
    <SessionProvider>
      <Header />
    </SessionProvider>,
  );
  return within(screen.getByRole("navigation", { name: "Primary navigation" }));
};

describe("site menu highlights the current page", () => {
  it("marks Services on a service page, and only Services", () => {
    const menu = renderHeader("/services/placement-assistance");
    expect(menu.getByRole("link", { name: "Services" })).toHaveAttribute("aria-current", "page");
    for (const other of ["Home", "Testimonials", "Contact", "About"]) expect(menu.getByRole("link", { name: other })).not.toHaveAttribute("aria-current");
  });

  it("marks Home on the registration page", () => {
    const menu = renderHeader("/registration");
    expect(menu.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(menu.getByRole("link", { name: "Services" })).not.toHaveAttribute("aria-current");
  });

  it("marks nothing on pages that are not in the menu", () => {
    const menu = renderHeader("/dashboard");
    expect(menu.queryAllByRole("link").filter((a) => a.hasAttribute("aria-current"))).toHaveLength(0);
  });
});

describe("staff portal top bar", () => {
  it("shows who is signed in and sign out, and none of the public menu", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => ok({ ...authResult({ role: "ta" }), candidate: makeCandidate({ role: "ta", fullName: "Tara Nair" }) })));
    render(
      <SessionProvider>
        <AdminHeader />
      </SessionProvider>,
    );
    expect(await screen.findByText("Tara Nair")).toBeInTheDocument();
    expect(screen.getByText("Talent acquisition")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    for (const name of ["Home", "Services", "Testimonials", "Contact", "About", "Join Us"]) expect(screen.queryByRole("link", { name })).toBeNull();
  });

  it("shows no account details to a signed-out visitor", async () => {
    render(
      <SessionProvider>
        <AdminHeader />
      </SessionProvider>,
    );
    expect(await screen.findByText("HVK Staff Portal")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });
});
