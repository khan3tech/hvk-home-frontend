import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { TechHeader } from "@/components/tech/tech-header";
import { TechHero } from "@/components/tech/tech-hero";
import { TechTicker } from "@/components/tech/tech-ticker";
import { TechServices } from "@/components/tech/tech-services";
import { TechWhy } from "@/components/tech/tech-why";
import { TechAbout } from "@/components/tech/tech-about";
import { TechProcess } from "@/components/tech/tech-process";
import { TechCta } from "@/components/tech/tech-cta";
import { TechFooter } from "@/components/tech/tech-footer";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const title = "HVK | Creating Experiences Beyond Limits";
const description =
  "One brand, six capabilities — event management, food services, interiors, photography, software solutions and digital marketing.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, siteName: "HVK" },
  twitter: { title, description },
};

export const viewport = {
  themeColor: "#0a0a0a",
};

export default function HomePage() {
  return (
    <div className={`${outfit.variable} flex flex-1 flex-col bg-tech-bg font-display text-tech-text`}>
      <TechHeader />
      <main id="main-content" className="flex-1">
        <TechHero />
        <TechTicker />
        <TechServices />
        <TechWhy />
        <TechAbout />
        <TechProcess />
        <TechCta />
      </main>
      <TechFooter />
    </div>
  );
}
