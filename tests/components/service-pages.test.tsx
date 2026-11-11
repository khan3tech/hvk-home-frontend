import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { splitTitle } from "@/components/services/service-poster";
import { ServiceCard } from "@/components/home/service-card";
import { ServiceDetailPage } from "@/components/services/service-detail-page";
import { FOOTER_SERVICE_LINKS, SERVICES } from "@/lib/constants";
import { SERVICE_DETAILS } from "@/lib/service-details";

describe("service content", () => {
  it("has a detail page for every service, and nothing else", () => {
    expect(SERVICE_DETAILS.map((d) => d.id).sort()).toEqual(SERVICES.map((s) => s.id).sort());
  });

  it("is complete for every service", () => {
    for (const d of SERVICE_DETAILS) {
      expect(d.tagline.length, d.id).toBeGreaterThan(20);
      expect(d.cardSummary.length, d.id).toBeGreaterThan(120);
      expect(d.overview.length, d.id).toBeGreaterThanOrEqual(2);
      expect(d.highlights.length, d.id).toBeGreaterThanOrEqual(4);
      expect(d.steps.length, d.id).toBeGreaterThanOrEqual(4);
      expect(d.faqs.length, d.id).toBeGreaterThanOrEqual(3);
      expect(d.photo.src, d.id).toMatch(/^\/images\/.+\.jpg$/);
    }
  });
});

describe("ServiceDetailPage", () => {
  it.each(SERVICE_DETAILS.map((d) => [d.id] as const))("renders %s with its sections", (id) => {
    const detail = SERVICE_DETAILS.find((d) => d.id === id)!;
    const service = SERVICES.find((s) => s.id === id)!;
    render(<ServiceDetailPage detail={detail} />);

    expect(screen.getByRole("heading", { level: 1, name: service.title })).toBeInTheDocument();
    for (const name of ["What this service is", "Everything included", "Your journey, step by step", "Common questions", "Ready to get started?"]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("link", { name: /Register now/ })[0]).toHaveAttribute("href", "/registration#registration");
    expect(screen.getAllByRole("link", { name: /Talk to us|Call us/ })[0]).toHaveAttribute("href", "tel:+919876543210");
    expect(screen.getByAltText(detail.photo.alt)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(20);
  });

  it("links to the five other services, never to itself", () => {
    const detail = SERVICE_DETAILS[0]!;
    render(<ServiceDetailPage detail={detail} />);
    const others = screen.getByRole("heading", { name: "Explore our other services" }).closest("section")!;
    const hrefs = within(others).getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toHaveLength(SERVICES.length - 1);
    expect(hrefs).not.toContain(`/services/${detail.id}`);
  });

  it("shows the learning tracks on the training page only", () => {
    render(<ServiceDetailPage detail={SERVICE_DETAILS.find((d) => d.id === "training-certification")!} />);
    expect(screen.getByRole("heading", { name: "What you can learn" })).toBeInTheDocument();
  });
});

describe("links to the detail pages", () => {
  it("each service card links to its page and shows its light poster", () => {
    const service = SERVICES[0]!;
    render(<ServiceCard id={service.id} title={service.title} description={service.description} />);
    expect(screen.getByRole("link", { name: service.title })).toHaveAttribute("href", `/services/${service.id}`);
    // The poster above the title is decorative (the title already names it) and has the service's 3D illustration.
    const poster = document.querySelector('article [data-poster="light"]');
    expect(poster).not.toBeNull();
    expect(poster).toHaveAttribute("aria-hidden", "true");
    const image = poster!.querySelector("img");
    expect(image).toHaveAttribute("src", expect.stringContaining("training-certification"));
    expect(image).toHaveAttribute("alt", "");
    // The poster carries the three features; the card text is the longer summary.
    for (const feature of SERVICE_DETAILS[0]!.poster.features) expect(poster).toHaveTextContent(feature.label);
    expect(screen.getByText(SERVICE_DETAILS[0]!.cardSummary)).toBeInTheDocument();
  });

  it("every service has a poster with its illustration, a button, a second line and three features", () => {
    for (const detail of SERVICE_DETAILS) {
      expect(detail.poster.image, detail.id).toBe(`/images/posters/${detail.id}.webp`);
      expect(detail.poster.cta.length, detail.id).toBeGreaterThan(2);
      expect(detail.poster.lead.length, detail.id).toBeGreaterThan(5);
      expect(detail.poster.features, detail.id).toHaveLength(3);
    }
  });

  it("splits the poster heading into two lines, keeping an ampersand with the first word", () => {
    expect(splitTitle("Training & Certification")).toEqual(["Training &", "Certification"]);
    expect(splitTitle("Workshops & Events")).toEqual(["Workshops &", "Events"]);
    expect(splitTitle("Career Guidance")).toEqual(["Career", "Guidance"]);
    expect(splitTitle("Custom Solutions")).toEqual(["Custom", "Solutions"]);
  });

  it("the footer lists every service with its page address", () => {
    expect(FOOTER_SERVICE_LINKS.map((l) => l.href)).toEqual(SERVICES.map((s) => `/services/${s.id}`));
  });
});
