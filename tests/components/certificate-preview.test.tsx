import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ServiceDetailPage } from "@/components/services/service-detail-page";
import { SERVICE_DETAILS } from "@/lib/service-details";
import { SessionProvider } from "@/lib/session/session-provider";
import { API, authResult, fail, makeCandidate, ok } from "../msw/handlers";
import { server } from "../msw/server";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { CertificatePreview } = await import("@/components/services/certificate-preview");
const PROGRAMMES = ["Full-Stack Web Development", "Python Programming", "Data Science with Python"];
const sampleLabel = (name: string) => new RegExp(`Sample certificate of completion for ${name},`);

describe("CertificatePreview", () => {
  it("uses a dummy name when nobody is signed in, and says so", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => fail(401, "UNAUTHENTICATED")));
    render(
      <SessionProvider>
        <CertificatePreview programmes={PROGRAMMES} />
      </SessionProvider>,
    );
    expect(await screen.findByRole("img", { name: sampleLabel("Kabir Rao") })).toBeInTheDocument();
    expect(screen.getByText(/a sample name; sign in to see yours/)).toBeInTheDocument();
    expect(screen.getByText("SAMPLE")).toBeInTheDocument();
  });

  it("shows the signed-in user's name, and lets them try another one", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => ok({ ...authResult(), candidate: makeCandidate({ fullName: "Meera Iyer" }) })));
    const user = userEvent.setup();
    render(
      <SessionProvider>
        <CertificatePreview programmes={PROGRAMMES} />
      </SessionProvider>,
    );
    expect(await screen.findByRole("img", { name: sampleLabel("Meera Iyer") })).toBeInTheDocument();
    expect(screen.getByLabelText("Preview with your name")).toHaveValue("Meera Iyer");
    expect(screen.getByText(/your name from your account/)).toBeInTheDocument();

    const input = screen.getByLabelText("Preview with your name");
    await user.clear(input);
    await user.type(input, "Rohan Das");
    expect(screen.getByRole("img", { name: sampleLabel("Rohan Das") })).toBeInTheDocument();
    expect(screen.getByText(/the name you typed/)).toBeInTheDocument();

    await user.clear(input); // empty falls back to the sample name rather than a blank certificate
    expect(screen.getByRole("img", { name: sampleLabel("Kabir Rao") })).toBeInTheDocument();
  });

  it("switches the programme", async () => {
    const user = userEvent.setup();
    render(<CertificatePreview programmes={PROGRAMMES} />); // also works without a session provider
    await user.click(screen.getByRole("radio", { name: "Python Programming" }));
    await waitFor(() => expect(screen.getByRole("img", { name: /Python Programming/ })).toBeInTheDocument());
    expect(screen.getAllByText("Python Programming").length).toBeGreaterThan(1);
  });

  it("limits the name length", () => {
    render(<CertificatePreview programmes={PROGRAMMES} />);
    expect(screen.getByLabelText("Preview with your name")).toHaveAttribute("maxlength", "40");
  });
});

describe("certificate on the service pages", () => {
  it("appears on the training page only", () => {
    const training = SERVICE_DETAILS.find((d) => d.id === "training-certification")!;
    const { unmount } = render(<ServiceDetailPage detail={training} />);
    expect(screen.getByRole("heading", { name: "Proof of what you can do" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Sample certificate of completion/ })).toBeInTheDocument();
    unmount();
    for (const other of SERVICE_DETAILS.filter((d) => d.id !== "training-certification")) {
      const view = render(<ServiceDetailPage detail={other} />);
      expect(screen.queryByRole("heading", { name: "Proof of what you can do" }), other.id).toBeNull();
      view.unmount();
    }
  });
});
