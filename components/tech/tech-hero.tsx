import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";
import { TECH_HERO_STATS, TECH_HERO_WORDS } from "@/lib/tech-constants";
import { TechEyebrow, TechWordStack, techButtonClass } from "./tech-ui";

export function TechHero() {
  return (
    <section id="home" className="relative scroll-mt-24 overflow-hidden bg-tech-bg">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-2/3 bg-[url('/images/tech/mountains.jpg')] bg-cover bg-bottom opacity-50 [mask-image:linear-gradient(to_top,black,transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[18%] top-1/3 h-96 w-96 rounded-full bg-gold/10 blur-3xl"
      />

      <div className="tech-container relative grid items-center gap-10 pb-14 pt-10 lg:grid-cols-[1fr_1.05fr_auto] lg:gap-6 lg:pb-16 lg:pt-6">
        <div className="max-w-xl">
          <TechEyebrow>One Brand. Six Capabilities.</TechEyebrow>
          <h1 className="mt-4 text-[clamp(2.75rem,6vw,4.5rem)] font-medium leading-[1.02] tracking-tight text-white">
            Creating Experiences
            <span className="block bg-gradient-to-r from-gold-light via-gold to-gold-deep bg-clip-text text-transparent">
              Beyond Limits.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-tech-soft sm:text-lg">
            At HVK, we bring together creativity, technology, experiences and strategic
            solutions to build a better tomorrow.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a href="#services" className={techButtonClass}>
              Explore Our Services <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#about"
              className="group inline-flex items-center gap-3 text-sm font-medium text-white"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full border border-white/50 transition-colors group-hover:border-gold group-hover:text-gold-light">
                <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />
              </span>
              Watch Our Story
            </a>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 divide-x divide-white/15">
            {TECH_HERO_STATS.map((stat) => (
              <div key={stat.label} className="px-4 first:pl-0">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-2xl font-medium text-white sm:text-3xl">{stat.value}</dd>
                <dd className="mt-1 text-xs leading-snug text-tech-muted sm:text-sm">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto aspect-[315/330] w-full max-w-[560px]">
          <Image
            src="/images/tech/hero-showcase.jpg"
            alt="HVK brand cube showing events, food, interiors, photography, software and digital marketing"
            fill
            priority
            sizes="(min-width: 1024px) 560px, 90vw"
            className="object-contain [mask-image:radial-gradient(ellipse_at_center,black_62%,transparent_78%)]"
          />
        </div>

        <TechWordStack words={TECH_HERO_WORDS} className="hidden xl:block" />
      </div>
    </section>
  );
}
