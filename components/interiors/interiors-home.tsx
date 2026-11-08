import Link from "next/link";
import { ArrowRight, Calculator, CalendarCheck, Quote } from "lucide-react";
import { INTERIORS_BASE, INTERIOR_PROJECTS, INTERIOR_SERVICES, INTERIOR_TESTIMONIALS } from "@/lib/interiors/content";
import { SectionTitle, ServiceIcon, Visual, interiorsButton, interiorsButtonLight } from "./ui";

const HERO_POINTS = ["Instant estimate from your room sizes", "Free consultation and site visit", "Design, build and handover by one team"];

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-[#e9e3d3]">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,#f7efdc_0%,#d9cbb0_55%,#b9a57f_100%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#0f3b32]">Interior design studio</p>
          <h1 id="hero-title" className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight text-[#0f3b32] sm:text-5xl">
            Where Spaces
            <br />
            Become Stories
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#2f3d38]">We create beautiful, functional and timeless interiors that reflect your personality and lifestyle.</p>
          <ul className="mt-5 space-y-1.5 text-sm text-[#2f3d38]">
            {HERO_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#e0a826]" />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`${INTERIORS_BASE}/estimate`} className={interiorsButton}>
              <Calculator className="h-4 w-4" aria-hidden="true" /> Get an instant estimate
            </Link>
            <Link href={`${INTERIORS_BASE}/portfolio`} className={interiorsButtonLight}>
              View projects <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <Visual alt="A bright living room with a curved sofa and warm wooden furniture" index={0} icon="sofa" className="aspect-[4/3] rounded-t-[8rem] rounded-b-xl shadow-xl" />
      </div>
    </section>
  );
}

function About() {
  return (
    <section aria-labelledby="about-title" className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2">
      <div className="grid grid-cols-2 gap-3">
        <Visual alt="Bedroom with a round mirror and a console" index={1} icon="armchair" className="aspect-[3/4] rounded-md" />
        <Visual alt="Living room with framed art and a sofa" index={2} icon="sofa" className="mt-8 aspect-[3/4] rounded-md" />
      </div>
      <div>
        <SectionTitle id="about-title">About Us</SectionTitle>
        <p className="mt-6 font-[family-name:var(--font-playfair)] text-lg italic text-[#0f3b32]">&ldquo;Transforming Spaces Into Beautiful Experiences&rdquo;</p>
        <p className="mt-4 text-sm leading-relaxed">
          We transform spaces into beautiful, functional and affordable interiors. Our platform helps homeowners and designers explore styles, compare pricing and plan budgets to create spaces that perfectly balance style, comfort and quality.
        </p>
        <Link href={`${INTERIORS_BASE}/about`} className={`${interiorsButtonLight} mt-6`}>
          Read more <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section aria-labelledby="services-title" className="bg-[#eef0e8] py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <SectionTitle id="services-title">Services</SectionTitle>
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {INTERIOR_SERVICES.map((service, index) => (
            <li key={service.slug} className="flex flex-col overflow-hidden rounded-lg border border-[#d8dcd2] bg-white">
              <Visual alt={`${service.title}`} index={index} icon={service.icon} className="h-36" />
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-[family-name:var(--font-playfair)] text-base font-bold text-[#0f3b32]">{service.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed">{service.summary}</p>
                <Link href={`${INTERIORS_BASE}/services/${service.slug}`} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#0f3b32] hover:text-[#b8860b]" aria-label={`View more about ${service.title}`}>
                  View more <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function EstimateBand() {
  return (
    <section aria-labelledby="estimate-title" className="bg-[#0f3b32] py-14 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 id="estimate-title" className="font-[family-name:var(--font-playfair)] text-3xl font-bold">
            What will your interiors cost?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85">
            Enter the length, width and height of your rooms, choose what you need and a package, and see an itemised estimate at once. No sign-in needed.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <Link href={`${INTERIORS_BASE}/estimate`} className="inline-flex items-center gap-2 rounded-md bg-[#e0a826] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#0f3b32] hover:bg-[#f0b93a]">
            <Calculator className="h-4 w-4" aria-hidden="true" /> Calculate my estimate
          </Link>
          <Link href={`${INTERIORS_BASE}/contact`} className="inline-flex items-center gap-2 rounded-md border border-white/60 px-6 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-white/10">
            <CalendarCheck className="h-4 w-4" aria-hidden="true" /> Book a free consultation
          </Link>
        </div>
      </div>
    </section>
  );
}

function Portfolio() {
  return (
    <section aria-labelledby="portfolio-title" className="mx-auto max-w-6xl px-5 py-16">
      <div className="text-center">
        <SectionTitle id="portfolio-title">Our Portfolios</SectionTitle>
        <p className="mt-4 text-sm">Designed with our knowledge, skills and passion.</p>
      </div>
      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {INTERIOR_PROJECTS.slice(0, 3).map((project, index) => (
          <li key={project.slug}>
            <Visual image={project.image} alt={project.title} index={index + 2} className="aspect-[4/5] rounded-md" />
            <h3 className="mt-3 text-center font-[family-name:var(--font-playfair)] text-lg text-[#0f3b32]">{project.title}</h3>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-right">
        <Link href={`${INTERIORS_BASE}/portfolio`} className="text-sm font-semibold text-[#0b6bcb] hover:underline">
          View Gallery →
        </Link>
      </p>
    </section>
  );
}

function Testimonials() {
  return (
    <section aria-labelledby="testimonials-title" className="bg-[#eef0e8] py-16">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5b6a64]">Testimonials</p>
        <h2 id="testimonials-title" className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#0f3b32]">
          What My Clients Says
        </h2>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {INTERIOR_TESTIMONIALS.map((t) => (
            <li key={t.name} className="flex flex-col rounded-lg bg-white p-6">
              <Quote className="h-6 w-6 text-[#e0a826]" aria-hidden="true" />
              <p className="mt-3 flex-1 text-sm leading-relaxed">{t.text}</p>
              <p className="mt-5 text-right font-[family-name:var(--font-playfair)] text-base text-[#0f3b32]">{t.name}</p>
              <p className="text-right text-xs text-[#5b6a64]">{t.place}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ContactBand() {
  return (
    <section aria-labelledby="contact-title" className="mx-auto max-w-6xl px-5 py-16">
      <h2 id="contact-title" className="font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight text-[#0f3b32] sm:text-5xl">
        Feel Free to
        <br />
        Contact Us
      </h2>
      <p className="mt-4 text-sm">If you have any projects in mind, say hello at</p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link href={`${INTERIORS_BASE}/contact`} className={interiorsButton}>
          Contact us
        </Link>
        <Link href={`${INTERIORS_BASE}/services`} className="text-sm font-semibold text-[#0f3b32] hover:text-[#b8860b]">
          <ServiceIcon name="ruler" className="mr-1 inline h-4 w-4" /> Explore our services
        </Link>
      </div>
    </section>
  );
}

export function InteriorsHome() {
  return (
    <>
      <Hero />
      <About />
      <Services />
      <EstimateBand />
      <Portfolio />
      <Testimonials />
      <ContactBand />
    </>
  );
}
