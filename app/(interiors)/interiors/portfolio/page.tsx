import type { Metadata } from "next";
import { PortfolioGallery } from "@/components/interiors/portfolio-gallery";
import { SectionTitle } from "@/components/interiors/ui";

export const metadata: Metadata = { title: "Portfolio", description: "Interior projects by HVK Interiors. Filter by room and style." };

export default function PortfolioPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <SectionTitle>Our Portfolios</SectionTitle>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed">Designed with our knowledge, skills and passion. Filter by room or style.</p>
      <div className="mt-8">
        <PortfolioGallery />
      </div>
    </div>
  );
}
