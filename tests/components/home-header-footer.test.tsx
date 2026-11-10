import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TECH_ADDRESS, TECH_EMAIL, TECH_PHONES } from "@/lib/tech-constants";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { TechHeader } = await import("@/components/tech/tech-header");
const { TechFooter } = await import("@/components/tech/tech-footer");

describe("Home page header", () => {
  it("has an Our Talent Hub link to the registration site", () => {
    render(<TechHeader />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    const link = within(nav).getByRole("link", { name: "Our Talent Hub" });
    expect(link).toHaveAttribute("href", "/registration");
    expect(link).not.toHaveAttribute("target"); // opens in the same tab
  });

  it("keeps the section links and closes the mobile menu when the link is used", async () => {
    const user = userEvent.setup();
    render(<TechHeader />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    for (const label of ["Home", "Services", "Why HVK", "Contact", "About"]) expect(within(nav).getByRole("link", { name: label })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(screen.getByRole("button", { name: "Close navigation" })).toBeInTheDocument();
    await user.click(within(nav).getByRole("link", { name: "Our Talent Hub" }));
    expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
  });
});

describe("Home page footer", () => {
  it("shows the Hyderabad address and the contact details", () => {
    render(<TechFooter />);
    const details = screen.getByLabelText("HVK office and contact details");
    expect(TECH_ADDRESS).toMatch(/Hyderabad/);
    expect(within(details).getByText(TECH_ADDRESS)).toBeInTheDocument();
    for (const phone of TECH_PHONES) expect(within(details).getByRole("link", { name: phone.label })).toHaveAttribute("href", phone.href);
    expect(within(details).getByRole("link", { name: TECH_EMAIL })).toHaveAttribute("href", `mailto:${TECH_EMAIL}`);
  });
});
