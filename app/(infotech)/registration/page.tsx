import type { Metadata } from "next";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { RegistrationHashOpener } from "@/components/auth/registration-hash-opener";
import { ServicesSection } from "@/components/home/services-section";
import { AboutSection } from "@/components/home/about-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { CtaSection } from "@/components/home/cta-section";

export const metadata: Metadata = {
  title: "Registration | HVK Tech Online Examination",
};

export default function RegistrationPage() {
  return (
    <>
      <HeroCarousel />
      <RegistrationHashOpener />
      <ServicesSection />
      <TestimonialsSection />
      <CtaSection />
      <AboutSection />
    </>
  );
}
