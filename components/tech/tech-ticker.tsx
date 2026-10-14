import { ArrowRight } from "lucide-react";
import { TECH_TICKER_ITEMS } from "@/lib/tech-constants";

export function TechTicker() {
  // The list is rendered twice so the marquee can loop seamlessly at -50%.
  const items = [...TECH_TICKER_ITEMS, ...TECH_TICKER_ITEMS];

  return (
    <div className="border-y border-white/10 bg-tech-panel">
      <div className="tech-container flex items-center gap-5 py-3.5">
        <span className="shrink-0 rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-[#1a140b]">
          What&apos;s New
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
          <ul className="flex w-max animate-marquee items-center gap-8 text-sm text-tech-soft hover:[animation-play-state:paused]">
            {items.map((item, index) => (
              <li
                key={`${item}-${index}`}
                aria-hidden={index >= TECH_TICKER_ITEMS.length}
                className="flex items-center gap-8 whitespace-nowrap"
              >
                {item}
                <span className="h-1 w-1 rounded-full bg-tech-muted" />
              </li>
            ))}
          </ul>
        </div>
        <a
          href="#services"
          aria-label="See our services"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold text-[#1a140b] transition-colors hover:bg-gold-light"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
