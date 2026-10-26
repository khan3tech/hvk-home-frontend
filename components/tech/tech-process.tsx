import { ArrowRight } from "lucide-react";
import { TECH_PROCESS_STEPS } from "@/lib/tech-constants";
import { cn } from "@/lib/utils";
import { TechArrowCircle, TechEyebrow, techOutlineButtonClass } from "./tech-ui";

export function TechProcess() {
  return (
    <section
      id="process"
      className="relative scroll-mt-20 overflow-hidden border-t border-white/10 bg-tech-bg py-14 sm:py-16"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/images/tech/mountains.jpg')] bg-cover bg-center opacity-70"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-tech-bg/30 to-tech-bg/80" />

      <div className="tech-container relative">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <TechEyebrow>Our Process</TechEyebrow>
            <h2 className="mt-3 text-[clamp(1.9rem,3.5vw,2.6rem)] font-medium leading-[1.1] text-white">
              From Vision to Impact.
            </h2>
            <p className="mt-3 text-sm text-tech-soft">
              A simple, collaborative process to turn ideas into exceptional results.
            </p>
          </div>
          <a href="#contact" className={cn(techOutlineButtonClass, "self-start px-5 py-2.5 text-xs sm:self-auto")}>
            Let&apos;s Work Together <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {TECH_PROCESS_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex items-center justify-between gap-4 lg:border-l lg:border-white/10 lg:px-6 lg:first:border-l-0 lg:first:pl-0"
            >
              <div>
                <span className="block text-3xl font-light text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 text-base font-medium text-white">{step.title}</h3>
                <p className="mt-1 max-w-[12rem] text-sm leading-snug text-tech-soft">{step.text}</p>
              </div>
              {index < TECH_PROCESS_STEPS.length - 1 && (
                <TechArrowCircle className="hidden h-10 w-10 lg:grid" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
