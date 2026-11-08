import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionTitle, Visual } from "@/components/interiors/ui";
import { INTERIORS_BASE, INTERIOR_SERVICES } from "@/lib/interiors/content";

export const metadata: Metadata = { title: "Services", description: "Interior design, custom fabrication, floor planning, modern furniture, home renovation, site inspection, soft furnishing and structural drawing." };

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <SectionTitle>Our Services</SectionTitle>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed">Everything your space needs, from the first measurement to the last cushion, handled by one team.</p>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {INTERIOR_SERVICES.map((service, index) => (
          <li key={service.slug} className="flex flex-col overflow-hidden rounded-lg border border-[#d8dcd2] bg-white">
            <Visual alt={service.title} index={index} icon={service.icon} className="h-40" />
            <div className="flex flex-1 flex-col p-5">
              <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[#0f3b32]">{service.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed">{service.summary}</p>
              <Link href={`${INTERIORS_BASE}/services/${service.slug}`} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#0f3b32] hover:text-[#b8860b]" aria-label={`View more about ${service.title}`}>
                View more <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
