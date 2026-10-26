import { act, render, screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider, useSession } from "@/lib/session/session-provider";
import { API, authResult, fail, ok } from "../msw/handlers";
import { server } from "../msw/server";

const replace = vi.fn();
let pathname = "/dashboard";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => pathname,
}));

const { PortalGate, useJourney } = await import("@/components/portal/portal-gate");

function Probe() {
  const { status, candidate, signIn, signOut } = useSession();
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="name">{candidate?.fullName ?? "-"}</p>
      <button onClick={() => signIn(authResult({ token: "manual" }))}>sign in</button>
      <button onClick={() => void signOut()}>sign out</button>
    </div>
  );
}

function StepProbe() {
  return <p data-testid="step">{useJourney().status.step}</p>;
}

beforeEach(() => {
  replace.mockReset();
  pathname = "/dashboard";
  document.cookie = "hvk_signed_in=; Path=/; Max-Age=0";
});

describe("SessionProvider", () => {
  it("restores the session from the refresh cookie on load", async () => {
    let mode: string | null = null;
    server.use(
      http.post(`${API}/auth/refresh`, ({ request }) => {
        mode = request.headers.get("x-session-mode");
        return ok(authResult());
      }),
    );
    render(<SessionProvider><Probe /></SessionProvider>);
    expect(screen.getByTestId("status")).toHaveTextContent("loading");
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authenticated"));
    expect(screen.getByTestId("name")).toHaveTextContent("Asha Verma");
    expect(mode).toBe("cookie");
    expect(document.cookie).toContain("hvk_signed_in=1");
  });

  it("becomes anonymous when there is no session", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => fail(401, "UNAUTHENTICATED")));
    render(<SessionProvider><Probe /></SessionProvider>);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));
    expect(document.cookie).not.toContain("hvk_signed_in=1");
  });

  it("signOut calls the API, clears state and the hint cookie", async () => {
    const logout = vi.fn();
    server.use(
      http.post(`${API}/auth/refresh`, () => ok(authResult())),
      http.post(`${API}/auth/logout`, () => {
        logout();
        return new Response(null, { status: 204 });
      }),
    );
    render(<SessionProvider><Probe /></SessionProvider>);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authenticated"));
    await act(async () => screen.getByText("sign out").click());
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));
    expect(logout).toHaveBeenCalledOnce();
    expect(document.cookie).not.toContain("hvk_signed_in=1");
  });

  it("signIn stores a fresh session", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => fail(401, "UNAUTHENTICATED")));
    render(<SessionProvider><Probe /></SessionProvider>);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));
    act(() => screen.getByText("sign in").click());
    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
  });
});

describe("PortalGate", () => {
  it("sends anonymous visitors to /login with a next parameter", async () => {
    pathname = "/payment";
    server.use(http.post(`${API}/auth/refresh`, () => fail(401, "UNAUTHENTICATED")));
    render(<SessionProvider><PortalGate area="candidate"><p>secret</p></PortalGate></SessionProvider>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?next=%2Fpayment"));
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("routes a candidate to the page for their step", async () => {
    pathname = "/exam";
    server.use(
      http.post(`${API}/auth/refresh`, () => ok(authResult({ step: "fee_pending" }))),
      http.get(`${API}/onboarding/status`, () => ok({ step: "fee_pending", demoAction: "skipped", nextStep: "exam_ready" })),
    );
    render(<SessionProvider><PortalGate area="candidate"><p>exam page</p></PortalGate></SessionProvider>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/payment"));
    expect(screen.queryByText("exam page")).not.toBeInTheDocument();
  });

  it("renders the page and exposes the journey when the step matches", async () => {
    pathname = "/payment";
    server.use(
      http.post(`${API}/auth/refresh`, () => ok(authResult({ step: "fee_pending" }))),
      http.get(`${API}/onboarding/status`, () => ok({ step: "fee_pending", demoAction: "skipped", nextStep: "exam_ready" })),
    );
    render(<SessionProvider><PortalGate area="candidate"><StepProbe /></PortalGate></SessionProvider>);
    await waitFor(() => expect(screen.getByTestId("step")).toHaveTextContent("fee_pending"));
    expect(replace).not.toHaveBeenCalled();
  });

  it("keeps staff out of the candidate portal and candidates out of admin", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => ok(authResult({ role: "ta" }))));
    render(<SessionProvider><PortalGate area="candidate"><p>x</p></PortalGate></SessionProvider>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));

    replace.mockReset();
    pathname = "/admin";
    server.use(http.post(`${API}/auth/refresh`, () => ok(authResult({ role: "candidate" }))));
    render(<SessionProvider><PortalGate area="admin"><p>y</p></PortalGate></SessionProvider>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows a retryable error when the status cannot be loaded", async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () => ok(authResult())),
      http.get(`${API}/onboarding/status`, () => fail(500, "INTERNAL_ERROR")),
    );
    render(<SessionProvider><PortalGate area="candidate"><p>x</p></PortalGate></SessionProvider>);
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong on our side");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
