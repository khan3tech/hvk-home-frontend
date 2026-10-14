import { ArrowRight, Gem, Lightbulb, Share2, UsersRound } from "lucide-react";
import { TECH_WHY_POINTS } from "@/lib/tech-constants";
import { cn } from "@/lib/utils";
import { TechEyebrow, techButtonClass } from "./tech-ui";

const ICONS = {
  gem: Gem,
  network: Share2,
  lightbulb: Lightbulb,
  users: UsersRound,
};

export function TechWhy() {
  return (
    <section
      id="why-hvk"
      className="scroll-mt-20 border-y border-white/10 bg-[#0d0d0d] py-14 sm:py-16"
    >
      <div className="tech-container grid gap-10 lg:grid-cols-[0.9fr_1.6fr] lg:items-center">
        <div>
          <TechEyebrow>Why HVK</TechEyebrow>
          <h2 className="mt-3 text-[clamp(1.9rem,3.5vw,2.6rem)] font-medium leading-[1.1] text-white">
            Different Expertise.
            <br />
            One Trusted Partner.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-tech-soft">
            We combine creativity, technology and experience to deliver exceptional results
            across industries.
          </p>
          <a href="#about" className={cn(techButtonClass, "mt-6 px-5 py-2 text-xs")}>
            Learn More <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {TECH_WHY_POINTS.map((point) => {
            const Icon = ICONS[point.icon];
            return (
              <div
                key={point.title}
                className="rounded-md border border-white/[0.06] bg-tech-panel-alt px-6 py-7 text-center transition-colors hover:border-gold/50"
              >
                <Icon className="mx-auto h-7 w-7 text-gold" strokeWidth={1.4} aria-hidden="true" />
                <h3 className="mt-4 text-lg font-medium text-white">{point.title}</h3>
                <p className="mx-auto mt-3 max-w-[11rem] text-xs leading-relaxed text-tech-muted">
                  {point.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
