import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ConsultationForm } from "@/components/interiors/consultation-form";
import { SectionTitle } from "@/components/interiors/ui";
import { INTERIORS_CONTACT, serviceBySlug } from "@/lib/interiors/content";

export const metadata: Metadata = { title: "Contact", description: "Book a free consultation or site visit with HVK Interiors." };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const chosen = service && serviceBySlug(service) ? service : undefined;
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <SectionTitle>Contact Us</SectionTitle>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed">Book a free consultation or site visit, or reach us directly.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <ConsultationForm {...(chosen ? { defaultService: chosen } : {})} />
        <address className="space-y-4 rounded-lg border border-[#d8dcd2] bg-white p-6 text-sm not-italic">
          <p className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0f3b32]" aria-hidden="true" /> {INTERIORS_CONTACT.address}
          </p>
          <p className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#0f3b32]" aria-hidden="true" />
            <a href={`mailto:${INTERIORS_CONTACT.email}`} className="hover:text-[#b8860b]">
              {INTERIORS_CONTACT.email}
            </a>
          </p>
          {INTERIORS_CONTACT.phones.map((phone) => (
            <p key={phone.href} className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#0f3b32]" aria-hidden="true" />
              <a href={phone.href} className="hover:text-[#b8860b]">
                {phone.label}
              </a>
            </p>
          ))}
          <p className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#0f3b32]" aria-hidden="true" /> {INTERIORS_CONTACT.hours}
          </p>
        </address>
      </div>
    </div>
  );
}
