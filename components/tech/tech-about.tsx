import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { TECH_ABOUT_STATS } from "@/lib/tech-constants";
import { cn } from "@/lib/utils";
import { TechArrowCircle, TechEyebrow, techButtonClass } from "./tech-ui";

export function TechAbout() {
  return (
    <section id="about" className="scroll-mt-20 bg-tech-bg py-14 sm:py-16">
      <div className="tech-container grid gap-6 lg:grid-cols-[1fr_1.05fr_0.42fr] lg:items-stretch">
        <div className="pr-2 lg:py-2">
          <TechEyebrow>About HVK</TechEyebrow>
          <h2 className="mt-3 text-[clamp(1.9rem,3.5vw,2.6rem)] font-medium leading-[1.1] text-white">
            A Company Built on People, Ideas and Possibilities.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-tech-soft">
            HVK is a multi-vertical company committed to creating meaningful experiences,
            innovative solutions and lasting value. Our six specialized services work together
            to help businesses, individuals and communities grow, connect and thrive.
          </p>
          <a href="#process" className={cn(techButtonClass, "mt-6 px-5 py-2 text-xs")}>
            Our Story <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>

          <dl className="mt-8 grid grid-cols-3 gap-4">
            {TECH_ABOUT_STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-2xl font-medium text-white">{stat.value}</dd>
                <dd className="mt-1 text-xs text-tech-muted">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative min-h-[320px] overflow-hidden rounded-md border border-white/10 bg-[#0d1014]">
          <div className="absolute inset-y-0 left-0 right-[36%]">
            <Image
              src="/images/tech/about-building.jpg"
              alt="HVK office building with the HVK logo on its facade"
              fill
              sizes="(min-width: 1024px) 32vw, 72vw"
              className="object-cover object-[85%_center] [mask-image:linear-gradient(to_right,black_88%,transparent)]"
            />
          </div>
          <div className="absolute bottom-3 right-3 flex w-[34%] min-w-[140px] flex-col justify-between gap-6 rounded-md border border-white/10 bg-black/85 p-4 backdrop-blur-sm sm:min-h-[55%]">
            <p className="text-lg leading-snug text-white sm:text-xl">
              Building a Brighter Tomorrow.
            </p>
            <TechArrowCircle className="self-end border-gold text-gold-light" />
          </div>
        </div>

        <figure className="relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-md border border-white/10 bg-tech-panel-alt p-4">
          <Image
            src="/images/tech/about-leaf.jpg"
            alt=""
            width={106}
            height={166}
            className="absolute right-0 top-[5.5rem] h-auto w-[45%] max-w-[106px] [mask-image:radial-gradient(closest-side,black_55%,transparent)]"
          />
          <p className="relative text-lg leading-snug text-white">
            More than services.
            <br />A positive impact.
          </p>
          <div className="relative mt-32">
            <blockquote className="text-sm leading-relaxed text-tech-soft">
              &ldquo;Creativity, technology and human connection for a better tomorrow.&rdquo;
            </blockquote>
            <figcaption className="mt-4 text-sm font-medium text-white">— HVK</figcaption>
          </div>
        </figure>
      </div>
    </section>
  );
}
