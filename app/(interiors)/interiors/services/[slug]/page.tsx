import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, Calculator, Check } from "lucide-react";
import { Visual, interiorsButton, interiorsButtonLight } from "@/components/interiors/ui";
import { INTERIORS_BASE, INTERIOR_FAQS, INTERIOR_PROCESS, INTERIOR_SERVICES, serviceBySlug } from "@/lib/interiors/content";

export function generateStaticParams() {
  return INTERIOR_SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const service = serviceBySlug((await params).slug);
  return service ? { title: service.title, description: service.summary } : {};
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const service = serviceBySlug((await params).slug);
  if (!service) notFound();
  const index = INTERIOR_SERVICES.findIndex((s) => s.slug === service.slug);
  const others = INTERIOR_SERVICES.filter((s) => s.slug !== service.slug);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <nav aria-label="Breadcrumb" className="text-xs text-[#4a5a54]">
        <Link href={`${INTERIORS_BASE}/services`} className="hover:text-[#b8860b]">
          Services
        </Link>{" "}
        / {service.title}
      </nav>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <Visual alt={service.title} index={index} icon={service.icon} className="aspect-[4/3] rounded-lg" />
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#0f3b32]">{service.title}</h1>
          <p className="mt-4 text-sm leading-relaxed">{service.description}</p>
          <dl className="mt-5 space-y-2 text-sm">
            <div>
              <dt className="inline font-semibold text-[#0f3b32]">Ideal for: </dt>
              <dd className="inline">{service.idealFor}</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-[#0f3b32]">Typical timeline: </dt>
              <dd className="inline">{service.timeline}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`${INTERIORS_BASE}/estimate`} className={interiorsButton}>
              <Calculator className="h-4 w-4" aria-hidden="true" /> Get an estimate
            </Link>
            <Link href={`${INTERIORS_BASE}/contact?service=${service.slug}`} className={interiorsButtonLight}>
              <CalendarCheck className="h-4 w-4" aria-hidden="true" /> Book a free consultation
            </Link>
          </div>
        </div>
      </div>

      <section aria-labelledby="includes-title" className="mt-14">
        <h2 id="includes-title" className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#0f3b32]">
          What is included
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {service.includes.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0f3b32]" aria-hidden="true" /> {item}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="process-title" className="mt-14">
        <h2 id="process-title" className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#0f3b32]">
          How it works
        </h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-5">
          {INTERIOR_PROCESS.map((step, i) => (
            <li key={step.title} className="rounded-lg bg-white p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e0a826] text-xs font-bold text-[#0f3b32]">{i + 1}</span>
              <h3 className="mt-2 text-sm font-bold text-[#0f3b32]">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq-title" className="mt-14">
        <h2 id="faq-title" className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#0f3b32]">
          Questions
        </h2>
        <div className="mt-4 space-y-3">
          {INTERIOR_FAQS.map((faq) => (
            <details key={faq.q} className="rounded-lg border border-[#d8dcd2] bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#0f3b32]">{faq.q}</summary>
              <p className="mt-2 text-sm leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="other-title" className="mt-14">
        <h2 id="other-title" className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#0f3b32]">
          Explore our other services
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {others.map((s) => (
            <li key={s.slug}>
              <Link href={`${INTERIORS_BASE}/services/${s.slug}`} className="inline-block rounded-full border border-[#cfd6cf] bg-white px-4 py-1.5 text-sm hover:border-[#0f3b32]">
                {s.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
