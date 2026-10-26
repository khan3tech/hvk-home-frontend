import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { TECH_SERVICES } from "@/lib/tech-constants";
import { TechArrowCircle, TechEyebrow } from "./tech-ui";

export function TechServices() {
  return (
    <section id="services" className="scroll-mt-20 bg-tech-bg py-16 sm:py-20">
      <div className="tech-container">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto_auto] lg:items-end lg:gap-12">
          <div>
            <TechEyebrow>Our Services</TechEyebrow>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.08] text-white">
              Six Capabilities.
              <br />
              Infinite Possibilities.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-tech-soft sm:text-base">
            From unforgettable events to innovative digital solutions, our specialized services
            are designed to create real impact for businesses, individuals and communities.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-gold-light"
          >
            Enquire About a Service <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {TECH_SERVICES.map((service) => (
            <a
              key={service.title}
              href="#contact"
              className="group flex flex-col overflow-hidden rounded-md border border-white/15 bg-tech-panel transition duration-300 hover:-translate-y-1 hover:border-gold/70"
            >
              <div className="relative aspect-[4/3] overflow-hidden xl:aspect-[129/97]">
                <Image
                  src={service.image}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 200px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-tech-panel to-transparent" />
              </div>
              <div className="flex flex-1 flex-col px-4 pb-4 pt-2">
                <h3 className="text-base font-medium leading-snug text-white">{service.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-tech-muted">
                  {service.description}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold">
                    Explore <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <TechArrowCircle className="h-8 w-8 group-hover:border-gold group-hover:text-gold-light" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
