import Image from "next/image";
import { MapPin } from "lucide-react";
import { TECH_ADDRESS, TECH_CTA_WORDS, TECH_EMAIL, TECH_PHONES } from "@/lib/tech-constants";
import { TalkToUs } from "./tech-contact-modal";
import { TechEyebrow, TechWordStack } from "./tech-ui";

export function TechCta() {
  return (
    <section id="contact" className="relative scroll-mt-20 overflow-hidden bg-cream text-[#16130f]">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full opacity-40 sm:opacity-100 md:w-[62%] lg:right-[12%] lg:w-[50%]">
        <Image
          src="/images/tech/cta-ribbon.jpg"
          alt=""
          fill
          sizes="62vw"
          className="object-cover object-left [mask-image:linear-gradient(to_right,transparent,black_18%,black_85%,transparent)]"
        />
      </div>

      <div className="tech-container relative flex items-center justify-between gap-8 py-14 sm:py-16">
        <div>
          <TechEyebrow className="text-[#7a6a52]">Let&apos;s Create</TechEyebrow>
          <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05]">
            Something
            <br />
            Exceptional Together.
          </h2>
          <p className="mt-3 text-sm text-[#3d3730]">
            Have a project, idea or requirement? We&apos;d love to hear from you.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <TalkToUs />
            <a
              href="#services"
              className="inline-flex items-center rounded-full border border-[#16130f] px-6 py-2.5 text-sm font-semibold transition hover:bg-[#16130f] hover:text-cream"
            >
              Explore Our Services
            </a>
          </div>
          <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#3d3730]">
            {TECH_PHONES.map((phone) => (
              <a key={phone.href} href={phone.href} className="hover:text-gold-deep">
                {phone.label}
              </a>
            ))}
            <a href={`mailto:${TECH_EMAIL}`} className="hover:text-gold-deep">
              {TECH_EMAIL}
            </a>
          </p>
          <address className="mt-3 flex max-w-md items-start gap-2 text-sm not-italic text-[#3d3730]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
            <span>{TECH_ADDRESS}</span>
          </address>
        </div>

        <div className="hidden lg:block">
          <TechWordStack words={TECH_CTA_WORDS} className="text-[#7a6a52]" />
          <div className="mt-5 h-px w-10 bg-[#7a6a52]" />
        </div>
      </div>
    </section>
  );
}
